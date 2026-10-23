package com.prota;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prota.ai.client.GeminiClient;
import com.prota.dto.request.DietPlanGenerateRequest;
import com.prota.dto.request.RegisterRequest;
import com.prota.dto.request.SaveDietPlanRequest;
import com.prota.dto.response.DietPlanDetailDto;
import com.prota.dto.response.DietPlanMealDto;
import com.prota.dto.response.DietPlanMealFoodDto;
import com.prota.entity.enums.DietGoal;
import com.prota.repo.DietPlanRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class Phase6ADietPlannerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DietPlanRepository dietPlanRepository;

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

    private String sampleGeminiPlanJson() {
        return """
                {
                  "meals": [
                    {
                      "mealName": "Breakfast",
                      "timing": "8:00 AM",
                      "foods": [
                        {
                          "name": "Oatmeal with Almond Milk & Chia Seeds",
                          "quantity": 1.0,
                          "quantityUnit": "bowl",
                          "proteinG": 12.0,
                          "caloriesKcal": 320.0,
                          "carbohydratesG": 48.0,
                          "fatG": 8.0,
                          "notes": "Rich in fiber and omega-3"
                        }
                      ],
                      "totalCaloriesKcal": 320.0,
                      "totalProteinG": 12.0,
                      "totalCarbohydratesG": 48.0,
                      "totalFatG": 8.0
                    },
                    {
                      "mealName": "Lunch",
                      "timing": "1:00 PM",
                      "foods": [
                        {
                          "name": "Grilled Chicken with Brown Rice",
                          "quantity": 1.0,
                          "quantityUnit": "plate",
                          "proteinG": 45.0,
                          "caloriesKcal": 550.0,
                          "carbohydratesG": 55.0,
                          "fatG": 14.0,
                          "notes": "Served with steamed broccoli"
                        }
                      ],
                      "totalCaloriesKcal": 550.0,
                      "totalProteinG": 45.0,
                      "totalCarbohydratesG": 55.0,
                      "totalFatG": 14.0
                    }
                  ],
                  "practicalSubstitutions": [
                    {
                      "originalFood": "Grilled Chicken",
                      "alternativeFood": "Tofu / Paneer",
                      "notes": "Vegetarian alternative"
                    }
                  ],
                  "shoppingList": [
                    {
                      "category": "Proteins & Dairy",
                      "items": ["Chicken Breast", "Almond Milk", "Eggs"]
                    }
                  ],
                  "mealPrepTips": [
                    "Cook chicken and grains in batch."
                  ],
                  "hydrationGuidance": "Drink 3.0 liters of water daily."
                }
                """;
    }

    @Test
    @DisplayName("Generate Diet Plan: Computes targets deterministically and returns structured plan without saving to DB")
    void generateDietPlan_Success() throws Exception {
        MockHttpSession session = registerUser("dietuser@example.com", "Password123!", "Diet User");

        when(geminiClient.generateStructuredTextEstimate(anyString()))
                .thenReturn(sampleGeminiPlanJson());

        DietPlanGenerateRequest req = DietPlanGenerateRequest.builder()
                .age(28)
                .gender("MALE")
                .heightCm(new BigDecimal("178.0"))
                .currentWeightKg(new BigDecimal("75.0"))
                .targetWeightKg(new BigDecimal("72.0"))
                .activityLevel("MODERATELY_ACTIVE")
                .goal(DietGoal.FAT_LOSS)
                .timeframeWeeks(6)
                .mealFrequency(3)
                .dietaryPreference("Omnivore")
                .preferredCuisine("Indian")
                .budget("MODERATE")
                .cookingTime("30 minutes")
                .build();

        long countBefore = dietPlanRepository.count();

        mockMvc.perform(post("/diet-plans/generate")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value(containsString("Fat Loss Plan")))
                .andExpect(jsonPath("$.goal").value("FAT_LOSS"))
                .andExpect(jsonPath("$.dailyCaloriesKcal").value(greaterThan(1200.0)))
                .andExpect(jsonPath("$.dailyProteinG").value(greaterThan(100.0)))
                .andExpect(jsonPath("$.meals", hasSize(2)))
                .andExpect(jsonPath("$.meals[0].mealName").value("Breakfast"))
                .andExpect(jsonPath("$.practicalSubstitutions", hasSize(1)))
                .andExpect(jsonPath("$.shoppingList", hasSize(1)))
                .andExpect(jsonPath("$.disclaimer").exists());

        // Ensure generation ALONE does not create database entries
        assertThat(dietPlanRepository.count()).isEqualTo(countBefore);
    }

    @Test
    @DisplayName("Generate Diet Plan: Clamps severe calorie deficits to safe clinical floor")
    void generateDietPlan_EnforcesSafeCaloricFloor() throws Exception {
        MockHttpSession session = registerUser("safefloor@example.com", "Password123!", "Floor User");

        when(geminiClient.generateStructuredTextEstimate(anyString()))
                .thenReturn(sampleGeminiPlanJson());

        // Small female with low activity -> BMR ~1150 kcal, TDEE ~1380. A 400 deficit would be < 1200 floor.
        DietPlanGenerateRequest req = DietPlanGenerateRequest.builder()
                .age(45)
                .gender("FEMALE")
                .heightCm(new BigDecimal("150.0"))
                .currentWeightKg(new BigDecimal("45.0"))
                .activityLevel("SEDENTARY")
                .goal(DietGoal.FAT_LOSS)
                .build();

        mockMvc.perform(post("/diet-plans/generate")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dailyCaloriesKcal").value(greaterThanOrEqualTo(1200.0)))
                .andExpect(jsonPath("$.safetyNotes", hasItem(containsString("safe clinical floor"))));
    }

    @Test
    @DisplayName("Generate Diet Plan: Validation failure on missing required fields")
    void generateDietPlan_ValidationFailure() throws Exception {
        MockHttpSession session = registerUser("valfail@example.com", "Password123!", "Val Fail User");

        // Missing age, height, weight
        DietPlanGenerateRequest req = DietPlanGenerateRequest.builder()
                .goal(DietGoal.MUSCLE_GAIN)
                .build();

        mockMvc.perform(post("/diet-plans/generate")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Save Diet Plan: Explicit user confirmation persists plan to PostgreSQL")
    void saveDietPlan_Success() throws Exception {
        MockHttpSession session = registerUser("saveplan@example.com", "Password123!", "Save Plan User");

        DietPlanDetailDto detail = DietPlanDetailDto.builder()
                .title("Custom Muscle Gain Plan")
                .goal(DietGoal.MUSCLE_GAIN)
                .creationDate("2026-10-21")
                .dailyCaloriesKcal(new BigDecimal("2800.00"))
                .dailyProteinG(new BigDecimal("170.00"))
                .dailyCarbohydratesG(new BigDecimal("340.00"))
                .dailyFatG(new BigDecimal("75.00"))
                .meals(List.of(DietPlanMealDto.builder()
                        .mealName("Breakfast")
                        .foods(List.of(DietPlanMealFoodDto.builder()
                                .name("Eggs and Oats")
                                .quantity(new BigDecimal("1"))
                                .quantityUnit("bowl")
                                .proteinG(new BigDecimal("25"))
                                .caloriesKcal(new BigDecimal("450"))
                                .build()))
                        .totalCaloriesKcal(new BigDecimal("450"))
                        .totalProteinG(new BigDecimal("25"))
                        .build()))
                .disclaimer("General guidance")
                .build();

        SaveDietPlanRequest saveReq = SaveDietPlanRequest.builder()
                .title("My Muscle Plan")
                .goal(DietGoal.MUSCLE_GAIN)
                .dailyCaloriesKcal(new BigDecimal("2800.00"))
                .dailyProteinG(new BigDecimal("170.00"))
                .dailyCarbohydratesG(new BigDecimal("340.00"))
                .dailyFatG(new BigDecimal("75.00"))
                .planDetail(detail)
                .build();

        MvcResult result = mockMvc.perform(post("/diet-plans")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saveReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.title").value("My Muscle Plan"))
                .andExpect(jsonPath("$.goal").value("MUSCLE_GAIN"))
                .andExpect(jsonPath("$.dailyCaloriesKcal").value(2800.0))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        UUID planId = UUID.fromString(objectMapper.readTree(responseBody).get("id").asText());

        // Retrieve saved plan by ID
        mockMvc.perform(get("/diet-plans/" + planId)
                        .session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(planId.toString()))
                .andExpect(jsonPath("$.planDetail.title").value("Custom Muscle Gain Plan"));

        // List saved plans
        mockMvc.perform(get("/diet-plans")
                        .session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(planId.toString()));

        // Delete saved plan
        mockMvc.perform(delete("/diet-plans/" + planId)
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isNoContent());

        // Verify deleted
        mockMvc.perform(get("/diet-plans/" + planId)
                        .session(session))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("User Isolation: User B cannot access or view User A's saved diet plans")
    void getSavedPlans_UserIsolation() throws Exception {
        MockHttpSession userA = registerUser("usera_diet@example.com", "Password123!", "User A");
        MockHttpSession userB = registerUser("userb_diet@example.com", "Password123!", "User B");

        DietPlanDetailDto detail = DietPlanDetailDto.builder()
                .title("User A Plan")
                .goal(DietGoal.GENERAL_FITNESS)
                .dailyCaloriesKcal(new BigDecimal("2000.00"))
                .dailyProteinG(new BigDecimal("120.00"))
                .build();

        SaveDietPlanRequest saveReq = SaveDietPlanRequest.builder()
                .title("User A Secret Plan")
                .goal(DietGoal.GENERAL_FITNESS)
                .dailyCaloriesKcal(new BigDecimal("2000.00"))
                .dailyProteinG(new BigDecimal("120.00"))
                .planDetail(detail)
                .build();

        MvcResult result = mockMvc.perform(post("/diet-plans")
                        .session(userA)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saveReq)))
                .andExpect(status().isCreated())
                .andReturn();

        UUID planAId = UUID.fromString(objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText());

        // User B attempts to access User A's plan directly -> 404
        mockMvc.perform(get("/diet-plans/" + planAId)
                        .session(userB))
                .andExpect(status().isNotFound());

        // User B lists plans -> empty
        mockMvc.perform(get("/diet-plans")
                        .session(userB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("Security: Unauthenticated access to /diet-plans returns 401 Unauthorized")
    void unauthenticatedAccess_Returns401() throws Exception {
        mockMvc.perform(get("/diet-plans"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/diet-plans/generate")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }
}
