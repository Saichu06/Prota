package com.prota;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prota.ai.client.GeminiClient;
import com.prota.dto.request.AiChatRequest;
import com.prota.dto.request.CreateFoodEntryRequest;
import com.prota.dto.request.RegisterRequest;
import com.prota.entity.enums.MealType;
import com.prota.exception.AiQuotaExceededException;
import com.prota.exception.AiServiceUnavailableException;
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
import java.time.LocalDate;

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
public class Phase4AiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FoodEntryRepository foodEntryRepository;

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
    @DisplayName("AI Chat requires authentication - returns 401 for anonymous caller")
    void aiChatRequiresAuthentication() throws Exception {
        AiChatRequest request = AiChatRequest.builder()
                .message("How much protein have I consumed today?")
                .build();

        mockMvc.perform(post("/ai/chat")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("AI Chat validates request body - rejects empty message with 400")
    void aiChatValidatesEmptyMessage() throws Exception {
        MockHttpSession session = registerUser("chatvalidation@example.com", "Password123!", "Valid User");

        AiChatRequest request = AiChatRequest.builder()
                .message("   ")
                .build();

        mockMvc.perform(post("/ai/chat")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors[0].message").value(containsString("cannot be empty")));
    }

    @Test
    @DisplayName("AI Chat responds with grounded nutrition summary and mock Gemini reply")
    void aiChatRespondsWithGroundedSummary() throws Exception {
        MockHttpSession session = registerUser("aigrounded@example.com", "Password123!", "Grounded User");
        LocalDate today = LocalDate.now();

        // First log a food entry so that user has recorded nutrition for today
        CreateFoodEntryRequest foodReq = CreateFoodEntryRequest.builder()
                .foodName("Grilled Chicken Salad")
                .mealType(MealType.LUNCH)
                .quantity(new BigDecimal("200"))
                .quantityUnit("g")
                .proteinG(new BigDecimal("45.0"))
                .caloriesKcal(new BigDecimal("320.0"))
                .consumedAt(java.time.Instant.now())
                .notes("Delicious post-workout lunch")
                .build();

        mockMvc.perform(post("/logs/daily/" + today + "/entries")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(foodReq)))
                .andExpect(status().isCreated());

        when(geminiClient.isConfigured()).thenReturn(true);
        when(geminiClient.generateChatCompletion(anyString(), any(), anyString()))
                .thenReturn("You have consumed 45.0g of protein today out of your 140g goal. You have 95g remaining.");

        AiChatRequest chatReq = AiChatRequest.builder()
                .message("How much protein have I consumed today?")
                .contextDate(today.toString())
                .build();

        mockMvc.perform(post("/ai/chat")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(chatReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.reply").value(containsString("45.0g of protein")))
                .andExpect(jsonPath("$.groundedSummary.hasRecords").value(true))
                .andExpect(jsonPath("$.groundedSummary.consumedProteinG").value(45.0))
                .andExpect(jsonPath("$.groundedSummary.proteinRemainingG").value(95))
                .andExpect(jsonPath("$.groundedSummary.loggedFoodItems", hasSize(1)))
                .andExpect(jsonPath("$.disclaimer").isNotEmpty());
    }

    @Test
    @DisplayName("AI Chat returns clear UNAVAILABLE status when Gemini service is unconfigured")
    void aiChatHandlesUnconfiguredService() throws Exception {
        MockHttpSession session = registerUser("unconfigured@example.com", "Password123!", "Unconfigured User");

        when(geminiClient.isConfigured()).thenReturn(false);

        AiChatRequest chatReq = AiChatRequest.builder()
                .message("Summarize my nutrition")
                .build();

        mockMvc.perform(post("/ai/chat")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(chatReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UNAVAILABLE"))
                .andExpect(jsonPath("$.errorCode").value("AI_NOT_CONFIGURED"))
                .andExpect(jsonPath("$.message").value(containsString("unconfigured")));
    }

    @Test
    @DisplayName("AI Chat returns RATE_LIMITED when Gemini quota is exceeded")
    void aiChatHandlesQuotaExceeded() throws Exception {
        MockHttpSession session = registerUser("quota@example.com", "Password123!", "Quota User");

        when(geminiClient.isConfigured()).thenReturn(true);
        when(geminiClient.generateChatCompletion(anyString(), any(), anyString()))
                .thenThrow(new AiQuotaExceededException("AI service quota reached. Please wait a moment before trying again."));

        AiChatRequest chatReq = AiChatRequest.builder()
                .message("What should I eat next?")
                .build();

        mockMvc.perform(post("/ai/chat")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(chatReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RATE_LIMITED"))
                .andExpect(jsonPath("$.errorCode").value("AI_QUOTA_EXCEEDED"))
                .andExpect(jsonPath("$.message").value(containsString("quota reached")));
    }

    @Test
    @DisplayName("Camera Food Estimation: Validates image and returns structured estimates WITHOUT auto-saving")
    void cameraEstimationReturnsEstimatesWithoutPersisting() throws Exception {
        MockHttpSession session = registerUser("camerafood@example.com", "Password123!", "Camera User");

        MockMultipartFile imageFile = new MockMultipartFile(
                "image",
                "lunch.jpg",
                "image/jpeg",
                new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46}
        );

        when(geminiClient.isConfigured()).thenReturn(true);
        when(geminiClient.getModel()).thenReturn("gemini-3.5-flash");

        String mockEstimateJson = """
                {
                  "items": [
                    {
                      "foodName": "Greek Yogurt (Plain, 0% fat)",
                      "mealType": "SNACK",
                      "quantity": 170.0,
                      "quantityUnit": "g",
                      "proteinG": 17.5,
                      "caloriesKcal": 100.0,
                      "carbohydratesG": 6.0,
                      "fatG": 0.7,
                      "confidence": 0.95
                    },
                    {
                      "foodName": "Mixed Berberries",
                      "mealType": "SNACK",
                      "quantity": 75.0,
                      "quantityUnit": "g",
                      "proteinG": 0.8,
                      "caloriesKcal": 42.0,
                      "carbohydratesG": 10.5,
                      "fatG": 0.3,
                      "confidence": 0.90
                    }
                  ]
                }
                """;

        when(geminiClient.generateMultimodalEstimate(any(), anyString(), anyString()))
                .thenReturn(mockEstimateJson);

        long foodCountBefore = foodEntryRepository.count();

        // Call image estimation endpoint
        mockMvc.perform(multipart("/ai/estimate/image")
                        .file(imageFile)
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.items[0].foodName").value("Greek Yogurt (Plain, 0% fat)"))
                .andExpect(jsonPath("$.items[0].proteinG").value(17.5))
                .andExpect(jsonPath("$.message").value(containsString("estimates")));

        // Critical Check: Verify database count did NOT increase - entries must NOT be persisted without explicit user confirmation!
        long foodCountAfter = foodEntryRepository.count();
        assertThat(foodCountAfter).isEqualTo(foodCountBefore);
    }

    @Test
    @DisplayName("Camera Food Estimation: Rejects unsupported non-image formats")
    void cameraEstimationRejectsUnsupportedMimeType() throws Exception {
        MockHttpSession session = registerUser("badupload@example.com", "Password123!", "Bad Upload User");

        MockMultipartFile textFile = new MockMultipartFile(
                "image",
                "notes.txt",
                "text/plain",
                "This is not a food image".getBytes()
        );

        mockMvc.perform(multipart("/ai/estimate/image")
                        .file(textFile)
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FAILED"))
                .andExpect(jsonPath("$.errorCode").value("INVALID_IMAGE_FORMAT"))
                .andExpect(jsonPath("$.message").value(containsString("Only JPG, PNG, and WebP image formats are supported")));
    }
}
