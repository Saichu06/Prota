package com.prota.ai.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prota.dto.request.AiChatMessageDto;
import com.prota.exception.AiQuotaExceededException;
import com.prota.exception.AiServiceException;
import com.prota.exception.AiServiceUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@Component
public class GeminiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);

    private final String apiKey;
    private final String model;
    private final String baseUrl;
    private final int timeoutSeconds;
    private final int maxOutputTokens;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public GeminiClient(
            @Value("${gemini.api-key:${GEMINI_API_KEY:}}") String apiKey,
            @Value("${gemini.model:gemini-3.5-flash-lite}") String model,
            @Value("${gemini.base-url:https://generativelanguage.googleapis.com/v1beta}") String baseUrl,
            @Value("${gemini.timeout-seconds:25}") int timeoutSeconds,
            @Value("${gemini.max-output-tokens:2048}") int maxOutputTokens,
            ObjectMapper objectMapper) {
        this.apiKey = (apiKey != null) ? apiKey.trim() : "";
        this.model = (model != null && !model.isBlank()) ? model.trim() : "gemini-3.5-flash-lite";
        this.baseUrl = (baseUrl != null && !baseUrl.isBlank()) ? baseUrl.trim() : "https://generativelanguage.googleapis.com/v1beta";
        this.timeoutSeconds = timeoutSeconds > 0 ? timeoutSeconds : 25;
        this.maxOutputTokens = maxOutputTokens > 0 ? maxOutputTokens : 2048;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(this.timeoutSeconds));

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    public boolean isConfigured() {
        return !apiKey.isEmpty() && !apiKey.equalsIgnoreCase("your_gemini_api_key_here");
    }

    public String getModel() {
        return model;
    }

    public String generateChatCompletion(
            String systemInstruction,
            List<AiChatMessageDto> conversationHistory,
            String userMessage) {

        if (!isConfigured()) {
            throw new AiServiceUnavailableException("Gemini API key is not configured on this server.");
        }

        try {
            Map<String, Object> body = new HashMap<>();

            // System Instruction
            if (systemInstruction != null && !systemInstruction.isBlank()) {
                body.put("system_instruction", Map.of(
                        "parts", List.of(Map.of("text", systemInstruction))
                ));
            }

            // Contents list
            List<Map<String, Object>> contents = new ArrayList<>();

            if (conversationHistory != null) {
                for (AiChatMessageDto prev : conversationHistory) {
                    if (prev.getContent() != null && !prev.getContent().isBlank()) {
                        String role = "model".equalsIgnoreCase(prev.getRole()) ? "model" : "user";
                        contents.add(Map.of(
                                "role", role,
                                "parts", List.of(Map.of("text", prev.getContent()))
                        ));
                    }
                }
            }

            // Current turn
            contents.add(Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", userMessage))
            ));
            body.put("contents", contents);

            // Generation config
            body.put("generationConfig", Map.of(
                    "temperature", 0.3,
                    "maxOutputTokens", maxOutputTokens
            ));

            String uri = String.format("%s/models/%s:generateContent", baseUrl, model);

            byte[] responseBytes = restClient.post()
                    .uri(uri)
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(byte[].class);

            if (responseBytes == null || responseBytes.length == 0) {
                throw new AiServiceException("EMPTY_AI_RESPONSE", "Received empty response from AI provider.");
            }

            String responseJson = new String(responseBytes, StandardCharsets.UTF_8);
            return extractCandidateText(responseJson);

        } catch (HttpClientErrorException.TooManyRequests e) {
            log.warn("Gemini API quota exceeded: 429 Too Many Requests");
            throw new AiQuotaExceededException("AI service quota reached. Please wait a moment before trying again.");
        } catch (HttpClientErrorException.NotFound e) {
            log.warn("Gemini model not found: 404 for model={}: {}", model, e.getResponseBodyAsString());
            throw new AiServiceException("MODEL_NOT_FOUND", "The configured AI model is currently unavailable from the provider.");
        } catch (HttpClientErrorException e) {
            log.warn("Gemini client error: status={}, body={}", e.getStatusCode().value(), e.getResponseBodyAsString());
            if (e.getStatusCode().value() == 429) {
                throw new AiQuotaExceededException("AI service rate limit exceeded. Please retry shortly.");
            }
            throw new AiServiceException("AI_CLIENT_ERROR", "The AI request could not be processed.");
        } catch (HttpServerErrorException e) {
            log.warn("Gemini upstream server error: status={}, body={}", e.getStatusCode().value(), e.getResponseBodyAsString());
            throw new AiServiceException("AI_UPSTREAM_ERROR", "The AI provider is temporarily unavailable. Please try again shortly.");
        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during Gemini execution: {}", e.getMessage(), e);
            throw new AiServiceException("AI_PROCESSING_ERROR", "Failed to communicate with AI provider.");
        }
    }

    public String generateStructuredTextEstimate(String prompt) {
        if (!isConfigured()) {
            throw new AiServiceUnavailableException("Gemini API key is not configured on this server.");
        }

        try {
            Map<String, Object> body = new HashMap<>();

            body.put("contents", List.of(Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", prompt))
            )));

            body.put("generationConfig", Map.of(
                    "response_mime_type", "application/json",
                    "temperature", 0.1,
                    "maxOutputTokens", maxOutputTokens
            ));

            String uri = String.format("%s/models/%s:generateContent", baseUrl, model);

            byte[] responseBytes = restClient.post()
                    .uri(uri)
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(byte[].class);

            if (responseBytes == null || responseBytes.length == 0) {
                throw new AiServiceException("EMPTY_AI_RESPONSE", "Received empty response from AI provider.");
            }

            String responseJson = new String(responseBytes, StandardCharsets.UTF_8);
            return extractCandidateText(responseJson);

        } catch (HttpClientErrorException.TooManyRequests e) {
            log.warn("Gemini API quota exceeded in text estimation: 429 Too Many Requests");
            throw new AiQuotaExceededException("AI quota exceeded for food estimation. Please retry later.");
        } catch (HttpClientErrorException.NotFound e) {
            log.warn("Gemini model not found: 404 for model={}: {}", model, e.getResponseBodyAsString());
            throw new AiServiceException("MODEL_NOT_FOUND", "The configured AI model is currently unavailable.");
        } catch (HttpClientErrorException e) {
            log.warn("Gemini text estimation client error: status={}, body={}", e.getStatusCode().value(), e.getResponseBodyAsString());
            if (e.getStatusCode().value() == 429) {
                throw new AiQuotaExceededException("AI rate limit reached. Please retry in a few seconds.");
            }
            throw new AiServiceException("AI_TEXT_CLIENT_ERROR", "The meal description could not be processed by AI.");
        } catch (HttpServerErrorException e) {
            log.warn("Gemini text estimation upstream error: status={}, body={}", e.getStatusCode().value(), e.getResponseBodyAsString());
            throw new AiServiceException("AI_TEXT_UPSTREAM_ERROR", "The AI nutrition service is temporarily unavailable.");
        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error in Gemini text estimation: {}", e.getMessage(), e);
            throw new AiServiceException("AI_TEXT_PROCESSING_ERROR", "Failed to process meal estimation.");
        }
    }

    public String generateMultimodalEstimate(byte[] imageBytes, String mimeType, String prompt) {
        if (!isConfigured()) {
            throw new AiServiceUnavailableException("Gemini API key is not configured on this server.");
        }

        try {
            Map<String, Object> body = new HashMap<>();

            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            List<Map<String, Object>> parts = List.of(
                    Map.of("inline_data", Map.of("mime_type", mimeType, "data", base64Image)),
                    Map.of("text", prompt)
            );

            body.put("contents", List.of(Map.of(
                    "role", "user",
                    "parts", parts
            )));

            body.put("generationConfig", Map.of(
                    "response_mime_type", "application/json",
                    "temperature", 0.1,
                    "maxOutputTokens", maxOutputTokens
            ));

            String uri = String.format("%s/models/%s:generateContent", baseUrl, model);

            byte[] responseBytes = restClient.post()
                    .uri(uri)
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(byte[].class);

            if (responseBytes == null || responseBytes.length == 0) {
                throw new AiServiceException("EMPTY_AI_RESPONSE", "Received empty response from AI provider.");
            }

            String responseJson = new String(responseBytes, StandardCharsets.UTF_8);
            return extractCandidateText(responseJson);

        } catch (HttpClientErrorException.TooManyRequests e) {
            log.warn("Gemini API quota exceeded in image estimation: 429 Too Many Requests");
            throw new AiQuotaExceededException("AI quota exceeded for photo analysis. Please retry later.");
        } catch (HttpClientErrorException.NotFound e) {
            log.warn("Gemini vision model not found: 404 for model={}: {}", model, e.getResponseBodyAsString());
            throw new AiServiceException("MODEL_NOT_FOUND", "The configured vision model is currently unavailable.");
        } catch (HttpClientErrorException e) {
            log.warn("Gemini image analysis client error: status={}, body={}", e.getStatusCode().value(), e.getResponseBodyAsString());
            if (e.getStatusCode().value() == 429) {
                throw new AiQuotaExceededException("AI rate limit reached. Please retry in a few seconds.");
            }
            throw new AiServiceException("AI_IMAGE_CLIENT_ERROR", "The photo could not be processed by AI.");
        } catch (HttpServerErrorException e) {
            log.warn("Gemini image analysis upstream error: status={}, body={}", e.getStatusCode().value(), e.getResponseBodyAsString());
            throw new AiServiceException("AI_IMAGE_UPSTREAM_ERROR", "The AI vision service is temporarily unavailable.");
        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error in Gemini vision call: {}", e.getMessage(), e);
            throw new AiServiceException("AI_IMAGE_PROCESSING_ERROR", "Failed to process photo analysis.");
        }
    }

    private String extractCandidateText(String responseJson) {
        if (responseJson == null || responseJson.isBlank()) {
            throw new AiServiceException("EMPTY_AI_RESPONSE", "Received empty response from AI provider.");
        }
        try {
            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode first = candidates.get(0);
                JsonNode parts = first.path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    StringBuilder sb = new StringBuilder();
                    for (JsonNode part : parts) {
                        if (part.has("text")) {
                            String txt = part.path("text").asText("");
                            sb.append(txt);
                        }
                    }
                    String text = sb.toString().trim();
                    if (!text.isEmpty()) {
                        return text;
                    }
                }
            }
            throw new AiServiceException("NO_CANDIDATE_TEXT", "No valid response text returned by model.");
        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new AiServiceException("MALFORMED_AI_RESPONSE", "Could not parse AI response JSON.");
        }
    }
}
