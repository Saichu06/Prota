package com.prota;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prota.ai.client.GeminiClient;
import com.prota.dto.request.AiTextEstimateRequest;
import com.prota.dto.request.CreateFoodEntryRequest;
import com.prota.dto.request.RegisterRequest;
import com.prota.entity.AiFoodEstimate;
import com.prota.entity.enums.EstimateStatus;
import com.prota.entity.enums.MealType;
import com.prota.entity.enums.NutritionSource;
import com.prota.exception.AiQuotaExceededException;
import com.prota.repo.AiFoodEstimateRepository;
import com.prota.repo.FoodEntryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class Phase5AiFoodLoggingTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FoodEntryRepository foodEntryRepository;

    @Autowired
    private AiFoodEstimateRepository aiFoodEstimateRepository;

    @MockitoBean
    private GeminiClient geminiClient;

    private MockHttpSession registerUser(String email, String password, String fullName) throws Exception {
        RegisterRequest req = RegisterRequest.builder()
                .fullName(fullName)
                .email(email)
                .password(password)
                .build();

        MvcResult result = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        return (MockHttpSession) result.getRequest().getSession();
    }

    @Test
    @DisplayName("Natural Language Estimation: parses multi-item meal description without saving to DB")
    void naturalLanguageEstimationReturnsStructuredDraftWithoutPersisting() throws Exception {
        MockHttpSession session = registerUser("naturalai@example.com", "Password123!", "Natural AI User");

        when(geminiClient.isConfigured()).thenReturn(true);
        when(geminiClient.getModel()).thenReturn("gemini-3.5-flash");

        String mockEstimateJson = """
                {
                  "items": [
                    {
                      "foodName": "Boiled Eggs",
                      "mealType": "BREAKFAST",
                      "quantity": 2.0,
                      "quantityUnit": "large",
                      "proteinG": 12.6,
                      "caloriesKcal": 156.0,
                      "carbohydratesG": 1.1,
                      "fatG": 10.6,
                      "confidence": 0.98,
                      "notes": "Estimated 2 standard large eggs"
                    },
                    {
                      "foodName": "Whole Wheat Toast",
                      "mealType": "BREAKFAST",
                      "quantity": 2.0,
                      "quantityUnit": "slices",
                      "proteinG": 7.2,
                      "caloriesKcal": 138.0,
                      "carbohydratesG": 24.0,
                      "fatG": 1.8,
                      "confidence": 0.92,
                      "notes": "Standard whole grain bread slice"
                    }
                  ]
                }
                """;

        when(geminiClient.generateStructuredTextEstimate(anyString())).thenReturn(mockEstimateJson);

        long foodCountBefore = foodEntryRepository.count();

        AiTextEstimateRequest req = AiTextEstimateRequest.builder()
                .description("Two boiled eggs and two slices of toast.")
                .mealType(MealType.BREAKFAST)
                .date(LocalDate.now())
                .build();

        mockMvc.perform(post("/ai/estimate/text")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.estimateId").isNotEmpty())
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.items[0].foodName").value("Boiled Eggs"))
                .andExpect(jsonPath("$.items[0].proteinG").value(12.6))
                .andExpect(jsonPath("$.items[0].notes").value(containsString("large eggs")))
                .andExpect(jsonPath("$.items[1].foodName").value("Whole Wheat Toast"))
                .andExpect(jsonPath("$.items[1].proteinG").value(7.2))
                .andExpect(jsonPath("$.message").value(containsString("estimates")));

        // Critical Check: Verify database count did NOT increase - entries must NOT be persisted without explicit user confirmation!
        long foodCountAfter = foodEntryRepository.count();
        assertThat(foodCountAfter).isEqualTo(foodCountBefore);
    }

    @Test
    @DisplayName("Natural Language Estimation: validates empty description and returns 400")
    void naturalLanguageEstimationValidatesEmptyDescription() throws Exception {
        MockHttpSession session = registerUser("textval@example.com", "Password123!", "Val User");

        AiTextEstimateRequest req = AiTextEstimateRequest.builder()
                .description("   ")
                .build();

        mockMvc.perform(post("/ai/estimate/text")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("Natural Language Estimation: rejects overly long descriptions > 1000 chars")
    void naturalLanguageEstimationRejectsLongDescription() throws Exception {
        MockHttpSession session = registerUser("longdesc@example.com", "Password123!", "Long Desc User");

        String longDescription = "a".repeat(1005);
        AiTextEstimateRequest req = AiTextEstimateRequest.builder()
                .description(longDescription)
                .build();

        mockMvc.perform(post("/ai/estimate/text")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("Natural Language Estimation: handles unconfigured Gemini boundary gracefully")
    void naturalLanguageEstimationHandlesUnconfiguredService() throws Exception {
        MockHttpSession session = registerUser("notconf@example.com", "Password123!", "Unconfigured User");

        when(geminiClient.isConfigured()).thenReturn(false);

        AiTextEstimateRequest req = AiTextEstimateRequest.builder()
                .description("A paneer dosa and a glass of milk.")
                .build();

        mockMvc.perform(post("/ai/estimate/text")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UNAVAILABLE"))
                .andExpect(jsonPath("$.errorCode").value("AI_NOT_CONFIGURED"));
    }

    @Test
    @DisplayName("Image Estimation: rejects oversized image > 8MB with clear error")
    void imageEstimationRejectsOversizedUpload() throws Exception {
        MockHttpSession session = registerUser("oversized@example.com", "Password123!", "Oversized User");

        byte[] bigBytes = new byte[9 * 1024 * 1024]; // 9MB
        MockMultipartFile bigFile = new MockMultipartFile(
                "image",
                "huge.jpg",
                "image/jpeg",
                bigBytes
        );

        mockMvc.perform(multipart("/ai/estimate/image")
                        .file(bigFile)
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FAILED"))
                .andExpect(jsonPath("$.errorCode").value("IMAGE_TOO_LARGE"));
    }

    @Test
    @DisplayName("Confirmed Save: batch-persists reviewed food entries transactionally and updates daily summary")
    void confirmedBatchSavePersistsFoodsAndUpdatesSummary() throws Exception {
        MockHttpSession session = registerUser("batchlog@example.com", "Password123!", "Batch Logger");
        LocalDate date = LocalDate.of(2026, 10, 21);

        // Pre-create an AiFoodEstimate to verify confirmation linkage
        when(geminiClient.isConfigured()).thenReturn(true);
        when(geminiClient.getModel()).thenReturn("gemini-3.5-flash");

        String mockEstimateJson = """
                {"items": [{"foodName": "Chicken and Rice", "mealType": "LUNCH", "quantity": 1.0, "quantityUnit": "bowl", "proteinG": 40.0, "caloriesKcal": 500.0}]}
                """;
        when(geminiClient.generateStructuredTextEstimate(anyString())).thenReturn(mockEstimateJson);

        AiTextEstimateRequest estimateReq = AiTextEstimateRequest.builder()
                .description("One cup of rice with 150 grams of cooked chicken.")
                .mealType(MealType.LUNCH)
                .build();

        MvcResult estimateResult = mockMvc.perform(post("/ai/estimate/text")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(estimateReq)))
                .andExpect(status().isOk())
                .andReturn();

        String respStr = estimateResult.getResponse().getContentAsString();
        String estimateIdStr = objectMapper.readTree(respStr).path("estimateId").asText();
        UUID estimateId = UUID.fromString(estimateIdStr);

        AiFoodEstimate estimateBefore = aiFoodEstimateRepository.findById(estimateId).orElseThrow();
        assertThat(estimateBefore.getStatus()).isEqualTo(EstimateStatus.PENDING);

        // Explicit user confirmation: submitting reviewed items
        CreateFoodEntryRequest item1 = CreateFoodEntryRequest.builder()
                .foodName("Cooked White Rice")
                .mealType(MealType.LUNCH)
                .quantity(new BigDecimal("150"))
                .quantityUnit("g")
                .proteinG(new BigDecimal("4.0"))
                .caloriesKcal(new BigDecimal("195.0"))
                .carbohydratesG(new BigDecimal("43.0"))
                .fatG(new BigDecimal("0.5"))
                .nutritionSource(NutritionSource.AI_CONFIRMED)
                .aiEstimateId(estimateId)
                .consumedAt(Instant.now())
                .build();

        CreateFoodEntryRequest item2 = CreateFoodEntryRequest.builder()
                .foodName("Grilled Chicken Breast")
                .mealType(MealType.LUNCH)
                .quantity(new BigDecimal("150"))
                .quantityUnit("g")
                .proteinG(new BigDecimal("46.5"))
                .caloriesKcal(new BigDecimal("247.0"))
                .carbohydratesG(BigDecimal.ZERO)
                .fatG(new BigDecimal("5.4"))
                .nutritionSource(NutritionSource.AI_CONFIRMED)
                .aiEstimateId(estimateId)
                .consumedAt(Instant.now())
                .build();

        List<CreateFoodEntryRequest> batchReq = List.of(item1, item2);

        // Submit to batch endpoint
        mockMvc.perform(post("/logs/daily/" + date + "/entries/batch")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batchReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.consumedProteinG").value(50.5))
                .andExpect(jsonPath("$.consumedCaloriesKcal").value(442.0))
                .andExpect(jsonPath("$.consumedCarbohydratesG").value(43.0))
                .andExpect(jsonPath("$.consumedFatG").value(5.9))
                .andExpect(jsonPath("$.foodEntries", hasSize(2)));

        // Verify AiFoodEstimate was updated to CONFIRMED
        AiFoodEstimate estimateAfter = aiFoodEstimateRepository.findById(estimateId).orElseThrow();
        assertThat(estimateAfter.getStatus()).isEqualTo(EstimateStatus.CONFIRMED);
        assertThat(estimateAfter.getConfirmedAt()).isNotNull();
    }

    @Test
    @DisplayName("Batch Food Save requires authentication - returns 401 for anonymous caller")
    void batchFoodSaveRequiresAuthentication() throws Exception {
        LocalDate date = LocalDate.now();
        CreateFoodEntryRequest item = CreateFoodEntryRequest.builder()
                .foodName("Protein Shake")
                .mealType(MealType.SNACK)
                .quantity(new BigDecimal("1"))
                .quantityUnit("scoop")
                .proteinG(new BigDecimal("25.0"))
                .consumedAt(Instant.now())
                .build();

        mockMvc.perform(post("/logs/daily/" + date + "/entries/batch")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(item))))
                .andExpect(status().isUnauthorized());
    }
}
