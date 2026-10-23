package com.prota;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prota.ai.client.GeminiClient;
import com.prota.dto.request.CreateFoodEntryRequest;
import com.prota.dto.request.RegisterRequest;
import com.prota.entity.DailyLog;
import com.prota.entity.enums.MealType;
import com.prota.entity.enums.NutritionSource;
import com.prota.exception.AiServiceException;
import com.prota.repo.DailyLogRepository;
import com.prota.repo.FoodEntryRepository;
import com.prota.repo.WaterEntryRepository;
import com.prota.repo.WeightEntryRepository;
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
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class Phase6CImproveProgressTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DailyLogRepository dailyLogRepository;

    @Autowired
    private FoodEntryRepository foodEntryRepository;

    @Autowired
    private WaterEntryRepository waterEntryRepository;

    @Autowired
    private WeightEntryRepository weightEntryRepository;

    @MockitoBean
    private GeminiClient geminiClient;

    private MockHttpSession registerUser(String email, String password, String fullName) throws Exception {
        RegisterRequest req = RegisterRequest.builder()
                .email(email)
                .password(password)
                .fullName(fullName)
                .build();

        MvcResult res = mockMvc.perform(post("/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        return (MockHttpSession) res.getRequest().getSession();
    }

    private void addFoodEntry(MockHttpSession session, LocalDate date, String name, BigDecimal protein, BigDecimal calories) throws Exception {
        CreateFoodEntryRequest req = CreateFoodEntryRequest.builder()
                .foodName(name)
                .mealType(MealType.LUNCH)
                .category("Whole Foods")
                .quantity(new BigDecimal("150"))
                .quantityUnit("g")
                .proteinG(protein)
                .caloriesKcal(calories)
                .carbohydratesG(new BigDecimal("10"))
                .fatG(new BigDecimal("5"))
                .nutritionSource(NutritionSource.MANUAL)
                .consumedAt(Instant.now())
                .build();

        mockMvc.perform(post("/logs/daily/" + date + "/entries")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());
    }

    private void addWater(MockHttpSession session, LocalDate date, int amountMl) throws Exception {
        mockMvc.perform(post("/water")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "entryDate", date.toString(),
                                "amountMl", amountMl,
                                "consumedAt", Instant.now().toString()
                        ))))
                .andExpect(status().isCreated());
    }

    private void addWeight(MockHttpSession session, LocalDate date, BigDecimal weightKg) throws Exception {
        mockMvc.perform(post("/weight")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "entryDate", date.toString(),
                                "weightKg", weightKg,
                                "recordedAt", Instant.now().toString()
                        ))))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Should return insufficient data state when no meals have been logged")
    void testInsufficientDataWhenNoFoodLogged() throws Exception {
        MockHttpSession session = registerUser("novice-" + UUID.randomUUID() + "@example.com", "Password123!", "Novice User");

        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(6);

        mockMvc.perform(get("/progress/improvement")
                        .session(session)
                        .param("from", from.toString())
                        .param("to", to.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDaysInRange", is(7)))
                .andExpect(jsonPath("$.dataCoverage.foodTrackedDays", is(0)))
                .andExpect(jsonPath("$.dataCoverage.hasSufficientData", is(false)))
                .andExpect(jsonPath("$.aiSummary.status", is("INSUFFICIENT_DATA")))
                .andExpect(jsonPath("$.aiSummary.recommendations", hasSize(0)))
                .andExpect(jsonPath("$.detectedPatterns[0].id", is("PATTERN_INSUFFICIENT_LOGGING")));
    }

    @Test
    @DisplayName("Should correctly handle inverted dates and enforce max date range")
    void testDateRangeHandling() throws Exception {
        MockHttpSession session = registerUser("daterange-" + UUID.randomUUID() + "@example.com", "Password123!", "Date User");

        LocalDate today = LocalDate.now();
        LocalDate past = today.minusDays(5);

        // Inverted: from is today, to is past -> should automatically swap
        mockMvc.perform(get("/progress/improvement")
                        .session(session)
                        .param("from", today.toString())
                        .param("to", past.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fromDate", is(past.toString())))
                .andExpect(jsonPath("$.toDate", is(today.toString())))
                .andExpect(jsonPath("$.totalDaysInRange", is(6)));
    }

    @Test
    @DisplayName("Should calculate deterministic metrics with missing days and not treat missing days as zero")
    void testDeterministicMetricsWithMissingDays() throws Exception {
        MockHttpSession session = registerUser("athlete-" + UUID.randomUUID() + "@example.com", "Password123!", "Pro Athlete");

        LocalDate today = LocalDate.now();
        LocalDate day1 = today.minusDays(4);
        LocalDate day2 = today.minusDays(2);
        LocalDate from = today.minusDays(6);

        // Add 2 days of food entries in a 7-day range (default protein target = 140g, calories = 2000 kcal)
        // Day 1: 150g protein, 2100 kcal (meets protein goal)
        addFoodEntry(session, day1, "Chicken & Rice", new BigDecimal("150.00"), new BigDecimal("2100.00"));
        // Day 2: 170g protein, 1950 kcal (meets protein goal)
        addFoodEntry(session, day2, "Salmon & Sweet Potato", new BigDecimal("170.00"), new BigDecimal("1950.00"));

        // Hydration on day 1 (2500 ml)
        addWater(session, day1, 2500);

        // Weight on day 1 (80.0 kg) and day 2 (79.5 kg)
        addWeight(session, day1, new BigDecimal("80.00"));
        addWeight(session, day2, new BigDecimal("79.50"));

        when(geminiClient.isConfigured()).thenReturn(false);

        mockMvc.perform(get("/progress/improvement")
                        .session(session)
                        .param("from", from.toString())
                        .param("to", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDaysInRange", is(7)))
                .andExpect(jsonPath("$.dataCoverage.foodTrackedDays", is(2)))
                .andExpect(jsonPath("$.dataCoverage.waterTrackedDays", is(1)))
                .andExpect(jsonPath("$.dataCoverage.weightRecordedDays", is(2)))
                .andExpect(jsonPath("$.dataCoverage.hasSufficientData", is(true)))
                // Average protein must be (150 + 170) / 2 = 160.0 (NOT divided by 7!)
                .andExpect(jsonPath("$.verifiedMetrics.protein.averageIntakeG", is(160.0)))
                .andExpect(jsonPath("$.verifiedMetrics.protein.daysMeetingGoal", is(2)))
                .andExpect(jsonPath("$.verifiedMetrics.protein.goalAdherencePercentage", is(100.0)))
                // Average calories must be (2100 + 1950) / 2 = 2025.0
                .andExpect(jsonPath("$.verifiedMetrics.calories.averageIntakeKcal", is(2025)))
                // Weight delta: 79.5 - 80.0 = -0.50
                .andExpect(jsonPath("$.verifiedMetrics.weight.weightChange", is(-0.50)))
                .andExpect(jsonPath("$.verifiedMetrics.weight.trendDirection", is("DECREASING")))
                // Detected patterns include high protein consistency
                .andExpect(jsonPath("$.detectedPatterns", hasItem(hasEntry("id", "PATTERN_PROTEIN_CONSISTENTLY_MET"))))
                .andExpect(jsonPath("$.aiSummary.status", is("UNAVAILABLE")));
    }

    @Test
    @DisplayName("Should parse structured AI recommendations when Gemini is available")
    void testGeminiRecommendationsSuccess() throws Exception {
        MockHttpSession session = registerUser("runner-" + UUID.randomUUID() + "@example.com", "Password123!", "Marathon Runner");

        LocalDate today = LocalDate.now();
        LocalDate day1 = today.minusDays(3);
        LocalDate day2 = today.minusDays(1);

        addFoodEntry(session, day1, "Eggs & Oats", new BigDecimal("100.00"), new BigDecimal("1600.00"));
        addFoodEntry(session, day2, "Tuna Salad", new BigDecimal("110.00"), new BigDecimal("1700.00"));

        when(geminiClient.isConfigured()).thenReturn(true);

        String mockAiResponse = """
            {
              "executiveSummary": "Your nutritional intake is structured with consistent breakfasts and lunches, though total protein remains slightly under your target.",
              "doingWellHighlights": ["Consistently logging nutrient-dense meals on tracked days"],
              "recommendations": [
                {
                  "id": "REC-1",
                  "title": "Increase Protein Density at Breakfast",
                  "observation": "Daily protein averaged 105g compared to your 140g target on tracked days.",
                  "practicalAction": "Add 150g of Greek yogurt or a scoop of whey protein powder to your morning oats.",
                  "expectedImprovement": "Closes the 35g daily protein deficit without excessive calories.",
                  "uncertaintyOrLimitation": "Based on 2 tracked days; meal portions assumed as logged.",
                  "category": "PROTEIN"
                }
              ]
            }
            """;
        when(geminiClient.generateStructuredTextEstimate(anyString())).thenReturn(mockAiResponse);

        mockMvc.perform(get("/progress/improvement")
                        .session(session)
                        .param("from", today.minusDays(6).toString())
                        .param("to", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.aiSummary.status", is("SUCCESS")))
                .andExpect(jsonPath("$.aiSummary.executiveSummary", containsString("nutritional intake is structured")))
                .andExpect(jsonPath("$.aiSummary.recommendations", hasSize(1)))
                .andExpect(jsonPath("$.aiSummary.recommendations[0].title", is("Increase Protein Density at Breakfast")))
                .andExpect(jsonPath("$.aiSummary.recommendations[0].category", is("PROTEIN")));
    }

    @Test
    @DisplayName("Should gracefully fall back without fabricated AI recommendations when Gemini throws exception")
    void testGeminiFailureFallback() throws Exception {
        MockHttpSession session = registerUser("fallback-" + UUID.randomUUID() + "@example.com", "Password123!", "Fallback User");

        LocalDate today = LocalDate.now();
        addFoodEntry(session, today.minusDays(2), "Steak", new BigDecimal("145.00"), new BigDecimal("2050.00"));
        addFoodEntry(session, today.minusDays(1), "Chicken", new BigDecimal("150.00"), new BigDecimal("2100.00"));

        when(geminiClient.isConfigured()).thenReturn(true);
        when(geminiClient.generateStructuredTextEstimate(anyString()))
                .thenThrow(new AiServiceException("AI_TIMEOUT", "Provider timeout"));

        mockMvc.perform(get("/progress/improvement")
                        .session(session)
                        .param("from", today.minusDays(4).toString())
                        .param("to", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.aiSummary.status", is("UNAVAILABLE")))
                .andExpect(jsonPath("$.aiSummary.recommendations", hasSize(0)))
                // Verified metrics remain intact and correct
                .andExpect(jsonPath("$.verifiedMetrics.protein.averageIntakeG", is(147.5)))
                .andExpect(jsonPath("$.dataCoverage.foodTrackedDays", is(2)));
    }

    @Test
    @DisplayName("Should isolate progress improvement data between different authenticated users")
    void testUserDataIsolation() throws Exception {
        MockHttpSession userA = registerUser("usera-" + UUID.randomUUID() + "@example.com", "Password123!", "User Alpha");
        MockHttpSession userB = registerUser("userb-" + UUID.randomUUID() + "@example.com", "Password123!", "User Beta");

        LocalDate today = LocalDate.now();
        addFoodEntry(userA, today, "Mega Feast", new BigDecimal("220.00"), new BigDecimal("3200.00"));

        // User B has not logged anything today
        mockMvc.perform(get("/progress/improvement")
                        .session(userB)
                        .param("from", today.minusDays(2).toString())
                        .param("to", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dataCoverage.foodTrackedDays", is(0)))
                .andExpect(jsonPath("$.verifiedMetrics.protein.averageIntakeG").doesNotExist());
    }
}
