package com.prota.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prota.ai.client.GeminiClient;
import com.prota.dto.request.AiTextEstimateRequest;
import com.prota.dto.response.AiFoodEstimateResponse;
import com.prota.dto.response.AiFoodItemDto;
import com.prota.entity.AiFoodEstimate;
import com.prota.entity.User;
import com.prota.entity.enums.EstimateStatus;
import com.prota.entity.enums.InputType;
import com.prota.entity.enums.MealType;
import com.prota.exception.AiQuotaExceededException;
import com.prota.exception.AiServiceException;
import com.prota.exception.ResourceNotFoundException;
import com.prota.repo.AiFoodEstimateRepository;
import com.prota.repo.UserRepository;
import com.prota.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class AiEstimateService {

    private static final Logger log = LoggerFactory.getLogger(AiEstimateService.class);

    private final AiFoodEstimateRepository aiFoodEstimateRepository;
    private final UserRepository userRepository;
    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public AiEstimateService(
            AiFoodEstimateRepository aiFoodEstimateRepository,
            UserRepository userRepository,
            GeminiClient geminiClient,
            ObjectMapper objectMapper) {
        this.aiFoodEstimateRepository = aiFoodEstimateRepository;
        this.userRepository = userRepository;
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public AiFoodEstimateResponse estimateFromText(AiTextEstimateRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request == null || request.getDescription() == null || request.getDescription().trim().isEmpty()) {
            return AiFoodEstimateResponse.builder()
                    .status("FAILED")
                    .errorCode("EMPTY_DESCRIPTION")
                    .message("Please provide a meal description for nutrition estimation.")
                    .items(Collections.emptyList())
                    .build();
        }

        if (request.getDescription().trim().length() > 1000) {
            return AiFoodEstimateResponse.builder()
                    .status("FAILED")
                    .errorCode("DESCRIPTION_TOO_LONG")
                    .message("Meal description exceeds maximum allowed length of 1000 characters.")
                    .items(Collections.emptyList())
                    .build();
        }

        // Check if Gemini API key is configured
        if (!geminiClient.isConfigured()) {
            return AiFoodEstimateResponse.builder()
                    .status("UNAVAILABLE")
                    .errorCode("AI_NOT_CONFIGURED")
                    .message("AI nutrition estimation is currently unavailable because the server Gemini API key is not configured. Please use manual food logging.")
                    .items(Collections.emptyList())
                    .build();
        }

        try {
            String defaultMealTypeStr = request.getMealType() != null ? request.getMealType().name() : "LUNCH";
            String prompt = String.format("""
                    Analyze this natural language meal description:
                    "%s"

                    Identify all distinct food items mentioned and provide realistic estimates for their serving quantity, serving unit, protein in grams, calories in kcal, carbohydrates in grams, fat in grams, and confidence score between 0.0 and 1.0.
                    Infer the most appropriate mealType from BREAKFAST, LUNCH, DINNER, or SNACK (defaulting to %s if unspecified).
                    Include brief notes if portions, ingredients, or preparation were assumed or uncertain.
                    All nutrient values MUST be realistic nutritional estimates based on the described meal.
                    Respond with valid JSON only conforming exactly to this structure:
                    {
                      "items": [
                        {
                          "foodName": "Boiled Eggs",
                          "mealType": "%s",
                          "quantity": 2.0,
                          "quantityUnit": "large",
                          "proteinG": 12.6,
                          "caloriesKcal": 156.0,
                          "carbohydratesG": 1.1,
                          "fatG": 10.6,
                          "confidence": 0.95,
                          "notes": "Assumed standard large eggs (~50g each)"
                        }
                      ]
                    }
                    If no recognizable food items are described, return {"items": []}.
                    """, request.getDescription().trim(), defaultMealTypeStr, defaultMealTypeStr);

            String rawJson = geminiClient.generateStructuredTextEstimate(prompt);

            List<AiFoodItemDto> items = parseEstimatedItems(rawJson, request.getMealType());

            String safeJson = ensureValidJson(rawJson);

            // Persist estimate for auditing & confirmation link
            AiFoodEstimate estimate = AiFoodEstimate.builder()
                    .user(user)
                    .inputType(InputType.TEXT)
                    .originalText(request.getDescription().trim())
                    .modelName(geminiClient.getModel())
                    .status(EstimateStatus.PENDING)
                    .estimateJson(safeJson)
                    .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                    .build();
            AiFoodEstimate saved = aiFoodEstimateRepository.save(estimate);

            if (items.isEmpty()) {
                return AiFoodEstimateResponse.builder()
                        .estimateId(saved.getId())
                        .status("SUCCESS")
                        .message("No distinct food items could be identified from your description. You can enter meals manually.")
                        .items(Collections.emptyList())
                        .build();
            }

            return AiFoodEstimateResponse.builder()
                    .estimateId(saved.getId())
                    .status("SUCCESS")
                    .message("Meal estimated successfully. All nutritional values are estimates; please review and adjust before saving.")
                    .items(items)
                    .build();

        } catch (AiQuotaExceededException e) {
            log.warn("Gemini quota exceeded during meal text estimation: {}", e.getMessage());
            return AiFoodEstimateResponse.builder()
                    .status("UNAVAILABLE")
                    .errorCode("AI_QUOTA_EXCEEDED")
                    .message("AI nutrition estimation rate limit reached. Please retry shortly or enter items manually.")
                    .items(Collections.emptyList())
                    .build();
        } catch (AiServiceException e) {
            log.warn("Gemini service error during meal text estimation: {}", e.getMessage());
            return AiFoodEstimateResponse.builder()
                    .status("FAILED")
                    .errorCode(e.getErrorCode())
                    .message(e.getMessage())
                    .items(Collections.emptyList())
                    .build();
        } catch (Exception e) {
            log.error("Unexpected error during meal text estimation: {}", e.getMessage(), e);
            return AiFoodEstimateResponse.builder()
                    .status("FAILED")
                    .errorCode("INTERNAL_AI_ERROR")
                    .message("An unexpected error occurred during meal estimation. Please log manually.")
                    .items(Collections.emptyList())
                    .build();
        }
    }

    @Transactional
    public AiFoodEstimateResponse estimateFromImage(MultipartFile file) {
        UUID userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (file == null || file.isEmpty()) {
            return AiFoodEstimateResponse.builder()
                    .status("FAILED")
                    .errorCode("EMPTY_IMAGE")
                    .message("No image was provided for analysis.")
                    .items(Collections.emptyList())
                    .build();
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/jpeg") && !contentType.startsWith("image/png") && !contentType.startsWith("image/webp"))) {
            return AiFoodEstimateResponse.builder()
                    .status("FAILED")
                    .errorCode("INVALID_IMAGE_FORMAT")
                    .message("Only JPG, PNG, and WebP image formats are supported.")
                    .items(Collections.emptyList())
                    .build();
        }

        // Validate file size (max 8MB)
        if (file.getSize() > 8 * 1024 * 1024) {
            return AiFoodEstimateResponse.builder()
                    .status("FAILED")
                    .errorCode("IMAGE_TOO_LARGE")
                    .message("Image file size exceeds the 8MB limit.")
                    .items(Collections.emptyList())
                    .build();
        }

        // Check if Gemini API key is configured
        if (!geminiClient.isConfigured()) {
            return AiFoodEstimateResponse.builder()
                    .status("UNAVAILABLE")
                    .errorCode("AI_NOT_CONFIGURED")
                    .message("AI nutrition estimation is currently unavailable because the server Gemini API key is not configured. Please use manual food logging.")
                    .items(Collections.emptyList())
                    .build();
        }

        try {
            byte[] imageBytes = file.getBytes();

            // Validate image content integrity & dimensions if image has enough bytes to decode
            if (imageBytes.length >= 100) {
                try (ByteArrayInputStream bais = new ByteArrayInputStream(imageBytes)) {
                    BufferedImage img = ImageIO.read(bais);
                    if (img != null) {
                        if (img.getWidth() < 10 || img.getHeight() < 10 || img.getWidth() > 8000 || img.getHeight() > 8000) {
                            return AiFoodEstimateResponse.builder()
                                    .status("FAILED")
                                    .errorCode("INVALID_IMAGE_DIMENSIONS")
                                    .message("Image dimensions must be between 10x10 and 8000x8000 pixels.")
                                    .items(Collections.emptyList())
                                    .build();
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to inspect image dimensions: {}", e.getMessage());
                }
            }

            String prompt = """
                    Analyze this meal photo carefully. Identify distinct food items visible and estimate their portion size, protein in grams, calories in kcal, carbohydrates in grams, fat in grams, and confidence score between 0.0 and 1.0.
                    Infer the most appropriate mealType from BREAKFAST, LUNCH, DINNER, or SNACK.
                    Include brief notes if portions, ingredients, or preparation were assumed or uncertain.
                    All nutrient values MUST be realistic nutritional estimates based on the visible serving size.
                    Respond with valid JSON only conforming exactly to this structure:
                    {
                      "items": [
                        {
                          "foodName": "Grilled Chicken Breast",
                          "mealType": "LUNCH",
                          "quantity": 150.0,
                          "quantityUnit": "g",
                          "proteinG": 46.5,
                          "caloriesKcal": 247.0,
                          "carbohydratesG": 0.0,
                          "fatG": 5.4,
                          "confidence": 0.90,
                          "notes": "Estimated from portion volume"
                        }
                      ]
                    }
                    If no food or edible item can be detected, return {"items": []}.
                    """;

            String rawJson = geminiClient.generateMultimodalEstimate(imageBytes, contentType, prompt);

            List<AiFoodItemDto> items = parseEstimatedItems(rawJson, null);

            String safeJson = ensureValidJson(rawJson);

            // Persist estimate for auditing & confirmation link
            AiFoodEstimate estimate = AiFoodEstimate.builder()
                    .user(user)
                    .inputType(InputType.IMAGE)
                    .modelName(geminiClient.getModel())
                    .status(EstimateStatus.PENDING)
                    .estimateJson(safeJson)
                    .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                    .build();
            AiFoodEstimate saved = aiFoodEstimateRepository.save(estimate);

            if (items.isEmpty()) {
                return AiFoodEstimateResponse.builder()
                        .estimateId(saved.getId())
                        .status("SUCCESS")
                        .message("No distinct food items could be identified with high confidence in this photo. You can enter meals manually.")
                        .items(Collections.emptyList())
                        .build();
            }

            return AiFoodEstimateResponse.builder()
                    .estimateId(saved.getId())
                    .status("SUCCESS")
                    .message("Photo analyzed successfully. All nutritional values are estimates; please review and adjust before saving.")
                    .items(items)
                    .build();

        } catch (AiQuotaExceededException e) {
            log.warn("Gemini quota exceeded during image analysis: {}", e.getMessage());
            return AiFoodEstimateResponse.builder()
                    .status("UNAVAILABLE")
                    .errorCode("AI_QUOTA_EXCEEDED")
                    .message("AI image analysis rate limit reached. Please retry shortly or enter items manually.")
                    .items(Collections.emptyList())
                    .build();
        } catch (AiServiceException e) {
            log.warn("Gemini service error during image analysis: {}", e.getMessage());
            return AiFoodEstimateResponse.builder()
                    .status("FAILED")
                    .errorCode(e.getErrorCode())
                    .message(e.getMessage())
                    .items(Collections.emptyList())
                    .build();
        } catch (IOException e) {
            log.error("Failed to read uploaded image bytes: {}", e.getMessage());
            return AiFoodEstimateResponse.builder()
                    .status("FAILED")
                    .errorCode("IMAGE_READ_ERROR")
                    .message("Failed to process the uploaded image file.")
                    .items(Collections.emptyList())
                    .build();
        } catch (Exception e) {
            log.error("Unexpected error during photo food analysis: {}", e.getMessage(), e);
            return AiFoodEstimateResponse.builder()
                    .status("FAILED")
                    .errorCode("INTERNAL_AI_ERROR")
                    .message("An unexpected error occurred during photo analysis. Please log manually.")
                    .items(Collections.emptyList())
                    .build();
        }
    }

    private List<AiFoodItemDto> parseEstimatedItems(String rawJson, MealType overrideMealType) {
        if (rawJson == null || rawJson.isBlank()) {
            return Collections.emptyList();
        }

        List<AiFoodItemDto> items = new ArrayList<>();
        try {
            // Strip potential markdown code fences if model wrapped response
            String cleanJson = rawJson.trim();
            if (cleanJson.startsWith("```json")) {
                cleanJson = cleanJson.substring(7);
            } else if (cleanJson.startsWith("```")) {
                cleanJson = cleanJson.substring(3);
            }
            if (cleanJson.endsWith("```")) {
                cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
            }
            cleanJson = cleanJson.trim();

            JsonNode root = objectMapper.readTree(cleanJson);
            JsonNode itemsNode = root.has("items") ? root.get("items") : (root.isArray() ? root : null);

            if (itemsNode != null && itemsNode.isArray()) {
                for (JsonNode item : itemsNode) {
                    String foodName = item.path("foodName").asText("Detected Food").trim();
                    if (foodName.isEmpty()) foodName = "Detected Food";

                    MealType mealType = overrideMealType != null ? overrideMealType : MealType.LUNCH;
                    if (item.hasNonNull("mealType")) {
                        String mealTypeStr = item.path("mealType").asText("LUNCH").toUpperCase();
                        try {
                            mealType = MealType.valueOf(mealTypeStr);
                        } catch (IllegalArgumentException ignored) {
                            // keep default
                        }
                    }

                    BigDecimal quantity = BigDecimal.valueOf(Math.max(0.01, item.path("quantity").asDouble(1.0)))
                            .setScale(2, RoundingMode.HALF_UP);
                    String quantityUnit = item.path("quantityUnit").asText("serving").trim();
                    if (quantityUnit.isEmpty()) quantityUnit = "serving";

                    BigDecimal protein = BigDecimal.valueOf(Math.max(0.0, item.path("proteinG").asDouble(0.0)))
                            .setScale(2, RoundingMode.HALF_UP);
                    BigDecimal calories = item.hasNonNull("caloriesKcal")
                            ? BigDecimal.valueOf(Math.max(0.0, item.path("caloriesKcal").asDouble(0.0))).setScale(2, RoundingMode.HALF_UP)
                            : null;
                    BigDecimal carbs = item.hasNonNull("carbohydratesG")
                            ? BigDecimal.valueOf(Math.max(0.0, item.path("carbohydratesG").asDouble(0.0))).setScale(2, RoundingMode.HALF_UP)
                            : null;
                    BigDecimal fat = item.hasNonNull("fatG")
                            ? BigDecimal.valueOf(Math.max(0.0, item.path("fatG").asDouble(0.0))).setScale(2, RoundingMode.HALF_UP)
                            : null;
                    Double confidence = item.hasNonNull("confidence")
                            ? Math.min(1.0, Math.max(0.05, item.path("confidence").asDouble(0.85)))
                            : null;

                    String notes = item.hasNonNull("notes") ? item.path("notes").asText().trim() : null;
                    if (notes != null && notes.isEmpty()) notes = null;

                    items.add(AiFoodItemDto.builder()
                            .foodName(foodName)
                            .mealType(mealType)
                            .quantity(quantity)
                            .quantityUnit(quantityUnit)
                            .proteinG(protein)
                            .caloriesKcal(calories)
                            .carbohydratesG(carbs)
                            .fatG(fat)
                            .confidence(confidence)
                            .notes(notes)
                            .build());
                }
            }
        } catch (Exception e) {
            log.warn("Could not parse estimated items JSON: {}", e.getMessage());
        }

        return items;
    }

    private String ensureValidJson(String rawJson) {
        if (rawJson == null || rawJson.isBlank()) {
            return "{\"items\": []}";
        }
        try {
            // Strip potential markdown fences
            String clean = rawJson.trim();
            if (clean.startsWith("```json")) {
                clean = clean.substring(7);
            } else if (clean.startsWith("```")) {
                clean = clean.substring(3);
            }
            if (clean.endsWith("```")) {
                clean = clean.substring(0, clean.length() - 3);
            }
            clean = clean.trim();

            JsonNode tree = objectMapper.readTree(clean);
            return objectMapper.writeValueAsString(tree);
        } catch (Exception e) {
            log.warn("Invalid or truncated JSON encountered from AI: {}", e.getMessage());
            try {
                return "{\"items\": [], \"raw\": " + objectMapper.writeValueAsString(rawJson) + "}";
            } catch (Exception ignored) {
                return "{\"items\": []}";
            }
        }
    }
}
