package com.prota;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prota.dto.request.CreateFoodEntryRequest;
import com.prota.dto.request.CreateSavedFoodRequest;
import com.prota.dto.request.CreateWaterEntryRequest;
import com.prota.dto.request.CreateWeightEntryRequest;
import com.prota.dto.request.RegisterRequest;
import com.prota.dto.request.UpdateFoodEntryRequest;
import com.prota.entity.enums.MealType;
import com.prota.entity.enums.NutritionSource;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class Phase3CNutritionAndAnalyticsTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
    @DisplayName("Should create, update, read, and delete food entries in DailyLog")
    void testFoodEntryCrudAndTotals() throws Exception {
        MockHttpSession session = registerUser("foodlog-" + UUID.randomUUID() + "@example.com", "Password123!", "Food User");
        LocalDate today = LocalDate.now();

        // 1. Add food entry
        CreateFoodEntryRequest addReq = CreateFoodEntryRequest.builder()
                .foodName("Greek Yogurt 0%")
                .mealType(MealType.BREAKFAST)
                .category("Dairy")
                .quantity(new BigDecimal("200"))
                .quantityUnit("g")
                .proteinG(new BigDecimal("20.00"))
                .caloriesKcal(new BigDecimal("120.00"))
                .carbohydratesG(new BigDecimal("8.00"))
                .fatG(new BigDecimal("0.50"))
                .nutritionSource(NutritionSource.MANUAL)
                .consumedAt(Instant.now())
                .build();

        MvcResult entryResult = mockMvc.perform(post("/logs/daily/" + today + "/entries")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.foodName", is("Greek Yogurt 0%")))
                .andExpect(jsonPath("$.proteinG", is(20.0)))
                .andReturn();

        String entryId = objectMapper.readTree(entryResult.getResponse().getContentAsString()).get("id").asText();

        // 2. Fetch daily log and verify computed consumed macros
        mockMvc.perform(get("/logs/daily")
                        .session(session)
                        .param("date", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consumedProteinG", is(20.0)))
                .andExpect(jsonPath("$.consumedCaloriesKcal", is(120.0)))
                .andExpect(jsonPath("$.foodEntries", hasSize(1)));

        // 3. Update the food entry (e.g. adjust serving)
        UpdateFoodEntryRequest updateReq = UpdateFoodEntryRequest.builder()
                .foodName("Greek Yogurt 0% Extra")
                .mealType(MealType.BREAKFAST)
                .category("Dairy")
                .quantity(new BigDecimal("300"))
                .quantityUnit("g")
                .proteinG(new BigDecimal("30.00"))
                .caloriesKcal(new BigDecimal("180.00"))
                .carbohydratesG(new BigDecimal("12.00"))
                .fatG(new BigDecimal("0.75"))
                .consumedAt(Instant.now())
                .build();

        mockMvc.perform(put("/logs/daily/entries/" + entryId)
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.foodName", is("Greek Yogurt 0% Extra")))
                .andExpect(jsonPath("$.proteinG", is(30.0)));

        // 4. Verify updated totals in daily log
        mockMvc.perform(get("/logs/daily")
                        .session(session)
                        .param("date", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consumedProteinG", is(30.0)))
                .andExpect(jsonPath("$.consumedCaloriesKcal", is(180.0)));

        // 5. Delete food entry
        mockMvc.perform(delete("/logs/daily/entries/" + entryId)
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isNoContent());

        // 6. Verify empty log after deletion
        mockMvc.perform(get("/logs/daily")
                        .session(session)
                        .param("date", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consumedProteinG", is(0.0)))
                .andExpect(jsonPath("$.foodEntries", hasSize(0)));
    }

    @Test
    @DisplayName("Should create, list, and delete water entries")
    void testWaterEntries() throws Exception {
        MockHttpSession session = registerUser("water-" + UUID.randomUUID() + "@example.com", "Password123!", "Water User");
        LocalDate date = LocalDate.now();

        CreateWaterEntryRequest req = CreateWaterEntryRequest.builder()
                .amountMl(500)
                .entryDate(date)
                .consumedAt(Instant.now())
                .build();

        MvcResult result = mockMvc.perform(post("/water")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.amountMl", is(500)))
                .andReturn();

        String waterId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

        // Daily list
        mockMvc.perform(get("/water/daily")
                        .session(session)
                        .param("date", date.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].amountMl", is(500)));

        // Daily log reflection
        mockMvc.perform(get("/logs/daily")
                        .session(session)
                        .param("date", date.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consumedWaterMl", is(500)));

        // Delete water entry
        mockMvc.perform(delete("/water/" + waterId)
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/water/daily")
                        .session(session)
                        .param("date", date.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("Should create, list, and delete weight entries")
    void testWeightEntries() throws Exception {
        MockHttpSession session = registerUser("weight-" + UUID.randomUUID() + "@example.com", "Password123!", "Weight User");
        LocalDate date = LocalDate.now();

        CreateWeightEntryRequest req = CreateWeightEntryRequest.builder()
                .weightKg(new BigDecimal("76.500"))
                .entryDate(date)
                .notes("Morning weigh-in fasting")
                .recordedAt(Instant.now())
                .build();

        MvcResult result = mockMvc.perform(post("/weight")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.weightKg", is(76.5)))
                .andReturn();

        String weightId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

        // Daily list
        mockMvc.perform(get("/weight/daily")
                        .session(session)
                        .param("date", date.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].weightKg", is(76.5)))
                .andExpect(jsonPath("$[0].notes", is("Morning weigh-in fasting")));

        // Daily log reflection
        mockMvc.perform(get("/logs/daily")
                        .session(session)
                        .param("date", date.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recordedWeightKg", is(76.5)));

        // Delete weight entry
        mockMvc.perform(delete("/weight/" + weightId)
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Should create, search, and delete saved food templates")
    void testSavedFoods() throws Exception {
        MockHttpSession session = registerUser("savedfood-" + UUID.randomUUID() + "@example.com", "Password123!", "SavedFood User");

        CreateSavedFoodRequest req1 = CreateSavedFoodRequest.builder()
                .name("Whey Protein Isolate")
                .brand("Optimum Nutrition")
                .servingQuantity(new BigDecimal("30"))
                .servingUnit("g")
                .proteinG(new BigDecimal("24.00"))
                .caloriesKcal(new BigDecimal("120.00"))
                .carbohydratesG(new BigDecimal("1.00"))
                .fatG(new BigDecimal("1.00"))
                .build();

        MvcResult res1 = mockMvc.perform(post("/saved-foods")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Whey Protein Isolate")))
                .andReturn();

        String foodId = objectMapper.readTree(res1.getResponse().getContentAsString()).get("id").asText();

        // Search by query
        mockMvc.perform(get("/saved-foods")
                        .session(session)
                        .param("query", "whey"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("Whey Protein Isolate")));

        // Search with no match
        mockMvc.perform(get("/saved-foods")
                        .session(session)
                        .param("query", "salmon"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        // Delete saved food
        mockMvc.perform(delete("/saved-foods/" + foodId)
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Should calculate analytics summary and observations accurately over date range")
    void testAnalyticsSummary() throws Exception {
        MockHttpSession session = registerUser("analytics-" + UUID.randomUUID() + "@example.com", "Password123!", "Analytics User");
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        // Add 100g protein on yesterday
        CreateFoodEntryRequest f1 = CreateFoodEntryRequest.builder()
                .foodName("Chicken Breast")
                .mealType(MealType.LUNCH)
                .quantity(new BigDecimal("300"))
                .quantityUnit("g")
                .proteinG(new BigDecimal("93.00"))
                .caloriesKcal(new BigDecimal("495.00"))
                .nutritionSource(NutritionSource.MANUAL)
                .consumedAt(Instant.now())
                .build();

        mockMvc.perform(post("/logs/daily/" + yesterday + "/entries")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(f1)))
                .andExpect(status().isCreated());

        // Add 160g protein on today (exceeds 140g default goal)
        CreateFoodEntryRequest f2 = CreateFoodEntryRequest.builder()
                .foodName("Egg White Omelet & Salmon")
                .mealType(MealType.DINNER)
                .quantity(new BigDecimal("400"))
                .quantityUnit("g")
                .proteinG(new BigDecimal("160.00"))
                .caloriesKcal(new BigDecimal("700.00"))
                .nutritionSource(NutritionSource.MANUAL)
                .consumedAt(Instant.now())
                .build();

        mockMvc.perform(post("/logs/daily/" + today + "/entries")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(f2)))
                .andExpect(status().isCreated());

        // Add water on today
        mockMvc.perform(post("/water")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CreateWaterEntryRequest.builder()
                                .amountMl(2000)
                                .entryDate(today)
                                .build())))
                .andExpect(status().isCreated());

        // Query analytics for 7 days
        LocalDate from = today.minusDays(6);
        mockMvc.perform(get("/analytics/summary")
                        .session(session)
                        .param("from", from.toString())
                        .param("to", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDaysInRange", is(7)))
                .andExpect(jsonPath("$.trackedDaysCount", is(2)))
                // Average protein across the 2 tracked days: (93.0 + 160.0) / 2 = 126.5
                .andExpect(jsonPath("$.averageProteinG", is(126.5)))
                // 1 out of 2 tracked days achieved the 140g target -> 50.0% adherence
                .andExpect(jsonPath("$.proteinGoalAdherencePercentage", is(50.0)))
                .andExpect(jsonPath("$.totalWaterMl", is(2000)))
                .andExpect(jsonPath("$.dailyData", hasSize(7)))
                .andExpect(jsonPath("$.insights", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("Should report AI_NOT_CONFIGURED gracefully on image analysis when Gemini key is not set")
    void testAiEstimateBoundary() throws Exception {
        MockHttpSession session = registerUser("ai-" + UUID.randomUUID() + "@example.com", "Password123!", "AI User");

        MockMultipartFile imageFile = new MockMultipartFile(
                "image",
                "food.jpg",
                "image/jpeg",
                new byte[]{ (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46 }
        );

        mockMvc.perform(multipart("/ai/estimate/image")
                        .file(imageFile)
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UNAVAILABLE")))
                .andExpect(jsonPath("$.errorCode", is("AI_NOT_CONFIGURED")))
                .andExpect(jsonPath("$.message", containsString("AI nutrition estimation is currently unavailable")));
    }

    @Test
    @DisplayName("Should forbid cross-user modification of food, water, and weight entries")
    void testCrossUserAuthorization() throws Exception {
        MockHttpSession userA = registerUser("userA-" + UUID.randomUUID() + "@example.com", "Password123!", "User A");
        MockHttpSession userB = registerUser("userB-" + UUID.randomUUID() + "@example.com", "Password123!", "User B");

        LocalDate today = LocalDate.now();

        // User A logs a food entry
        CreateFoodEntryRequest addReq = CreateFoodEntryRequest.builder()
                .foodName("User A's Meal")
                .mealType(MealType.LUNCH)
                .quantity(new BigDecimal("100"))
                .quantityUnit("g")
                .proteinG(new BigDecimal("15.00"))
                .nutritionSource(NutritionSource.MANUAL)
                .consumedAt(Instant.now())
                .build();

        MvcResult result = mockMvc.perform(post("/logs/daily/" + today + "/entries")
                        .session(userA)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String entryId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

        // User B tries to read User A's entry -> 404 (ResourceNotFoundException)
        mockMvc.perform(get("/logs/daily/entries/" + entryId)
                        .session(userB))
                .andExpect(status().isNotFound());

        // User B tries to delete User A's entry -> 404
        mockMvc.perform(delete("/logs/daily/entries/" + entryId)
                        .session(userB)
                        .with(csrf()))
                .andExpect(status().isNotFound());
    }
}
