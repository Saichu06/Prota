package com.prota;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prota.ai.client.GeminiClient;
import com.prota.dto.request.CreateFoodEntryRequest;
import com.prota.dto.request.RegisterRequest;
import com.prota.dto.request.SaveDietPlanRequest;
import com.prota.dto.request.SaveWorkoutPlanRequest;
import com.prota.entity.enums.DietGoal;
import com.prota.entity.enums.ExperienceLevel;
import com.prota.entity.enums.MealType;
import com.prota.entity.enums.NutritionSource;
import com.prota.entity.enums.SplitType;
import com.prota.entity.enums.TrainingLocation;
import com.prota.entity.enums.WorkoutGoal;
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
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class Phase7ReportTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private GeminiClient geminiClient;

    private MockHttpSession registerAndLoginUser(String email, String username) throws Exception {
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email(email)
                .fullName(username)
                .password("StrongPassword123!")
                .build();

        MvcResult result = mockMvc.perform(post("/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        return (MockHttpSession) result.getRequest().getSession(false);
    }

    @Test
    @DisplayName("Unauthenticated requests to reports are strictly rejected with 401")
    void unauthenticatedReportRequestsAreRejected() throws Exception {
        mockMvc.perform(get("/reports/preview"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/reports/pdf").param("type", "DAILY_NUTRITION"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/reports/csv").param("type", "FOOD_ENTRIES"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Report preview calculates correct metadata and handles empty states gracefully")
    void getReportPreview_returnsCalculatedSummaryAndGoals() throws Exception {
        MockHttpSession session = registerAndLoginUser("report_user1@prota.com", "reportuser1");
        LocalDate today = LocalDate.now();

        // 1. Initial preview when empty
        mockMvc.perform(get("/reports/preview")
                        .session(session)
                        .param("type", "DAILY_NUTRITION")
                        .param("from", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reportType").value("DAILY_NUTRITION"))
                .andExpect(jsonPath("$.totalFoodEntries").value(0))
                .andExpect(jsonPath("$.canGenerate").value(true));

        // 2. Add food entry for today
        CreateFoodEntryRequest foodReq = CreateFoodEntryRequest.builder()
                .foodName("Greek Yogurt with Berries")
                .mealType(MealType.BREAKFAST)
                .quantity(new BigDecimal("200"))
                .quantityUnit("g")
                .proteinG(new BigDecimal("20.0"))
                .caloriesKcal(new BigDecimal("150.0"))
                .carbohydratesG(new BigDecimal("12.0"))
                .fatG(new BigDecimal("2.0"))
                .nutritionSource(NutritionSource.MANUAL)
                .consumedAt(java.time.Instant.now())
                .build();

        mockMvc.perform(post("/logs/daily/" + today + "/entries")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(foodReq)))
                .andExpect(status().isCreated());

        // 3. Check preview again
        mockMvc.perform(get("/reports/preview")
                        .session(session)
                        .param("type", "DAILY_NUTRITION")
                        .param("from", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalFoodEntries").value(1))
                .andExpect(jsonPath("$.recordedDays").value(1))
                .andExpect(jsonPath("$.averageDailyProteinG").value(20.0))
                .andExpect(jsonPath("$.averageDailyCaloriesKcal").value(150.0));
    }

    @Test
    @DisplayName("Download Daily Nutrition PDF returns valid PDF stream and headers")
    void downloadPdfReport_dailyNutrition_returnsValidPdfBytes() throws Exception {
        MockHttpSession session = registerAndLoginUser("report_user2@prota.com", "reportuser2");
        LocalDate today = LocalDate.now();

        // Log a food entry
        CreateFoodEntryRequest foodReq = CreateFoodEntryRequest.builder()
                .foodName("Chicken Breast & Quinoa")
                .mealType(MealType.LUNCH)
                .quantity(new BigDecimal("250"))
                .quantityUnit("g")
                .proteinG(new BigDecimal("45.0"))
                .caloriesKcal(new BigDecimal("380.0"))
                .nutritionSource(NutritionSource.MANUAL)
                .consumedAt(java.time.Instant.now())
                .build();

        mockMvc.perform(post("/logs/daily/" + today + "/entries")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(foodReq)))
                .andExpect(status().isCreated());

        MvcResult result = mockMvc.perform(get("/reports/pdf")
                        .session(session)
                        .param("type", "DAILY_NUTRITION")
                        .param("from", today.toString()))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("prota_daily_nutrition_")))
                .andReturn();

        byte[] pdfBytes = result.getResponse().getContentAsByteArray();
        assertThat(pdfBytes).isNotEmpty();
        // Standard PDF magic byte header '%PDF'
        assertThat(new String(pdfBytes, 0, 4)).isEqualTo("%PDF");
    }

    @Test
    @DisplayName("Download Weekly and Monthly PDF returns valid PDF stream")
    void downloadPdfReport_weeklyAndMonthly_returnsValidPdfBytes() throws Exception {
        MockHttpSession session = registerAndLoginUser("report_user3@prota.com", "reportuser3");
        LocalDate today = LocalDate.now();

        MvcResult weeklyResult = mockMvc.perform(get("/reports/pdf")
                        .session(session)
                        .param("type", "WEEKLY_NUTRITION")
                        .param("to", today.toString()))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andReturn();

        byte[] weeklyPdf = weeklyResult.getResponse().getContentAsByteArray();
        assertThat(new String(weeklyPdf, 0, 4)).isEqualTo("%PDF");

        MvcResult monthlyResult = mockMvc.perform(get("/reports/pdf")
                        .session(session)
                        .param("type", "MONTHLY_NUTRITION")
                        .param("to", today.toString()))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andReturn();

        byte[] monthlyPdf = monthlyResult.getResponse().getContentAsByteArray();
        assertThat(new String(monthlyPdf, 0, 4)).isEqualTo("%PDF");
    }

    @Test
    @DisplayName("Download CSV exports returns RFC 4180 format with formula injection protection")
    void downloadCsvExport_returnsRfc4180FormatAndFormulaProtection() throws Exception {
        MockHttpSession session = registerAndLoginUser("report_user4@prota.com", "reportuser4");
        LocalDate today = LocalDate.now();

        // Food entry with potential CSV comma and formula injection prefix
        CreateFoodEntryRequest foodReq = CreateFoodEntryRequest.builder()
                .foodName("=SUM(A1:A10), Special Bowl")
                .mealType(MealType.DINNER)
                .quantity(new BigDecimal("300"))
                .quantityUnit("g")
                .proteinG(new BigDecimal("35.0"))
                .caloriesKcal(new BigDecimal("420.0"))
                .nutritionSource(NutritionSource.MANUAL)
                .notes("Formula test: +10% extra")
                .consumedAt(java.time.Instant.now())
                .build();

        mockMvc.perform(post("/logs/daily/" + today + "/entries")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(foodReq)))
                .andExpect(status().isCreated());

        MvcResult result = mockMvc.perform(get("/reports/csv")
                        .session(session)
                        .param("type", "FOOD_ENTRIES")
                        .param("from", today.toString())
                        .param("to", today.toString()))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", org.hamcrest.Matchers.containsString("text/csv")))
                .andReturn();

        String csvContent = result.getResponse().getContentAsString();
        assertThat(csvContent).contains("Date,Meal Type,Food Name,Quantity,Unit,Protein (g)");
        // Verified formula sanitization: the '=' was prepended with single quote "'"
        assertThat(csvContent).contains("'=SUM(A1:A10)");
        // Verified comma escaping
        assertThat(csvContent).contains("\"'=SUM(A1:A10), Special Bowl\"");
    }

    @Test
    @DisplayName("Download Saved Diet and Workout Plan Reports succeeds for existing plans")
    void downloadSavedPlanReports_generatesCleanPdfs() throws Exception {
        MockHttpSession session = registerAndLoginUser("report_user5@prota.com", "reportuser5");

        // Save a Diet Plan
        com.prota.dto.response.DietPlanDetailDto dietDetail = com.prota.dto.response.DietPlanDetailDto.builder()
                .title("High Protein Cut Protocol")
                .goal(DietGoal.FAT_LOSS)
                .dailyCaloriesKcal(new BigDecimal("1950.0"))
                .dailyProteinG(new BigDecimal("160.0"))
                .meals(List.of())
                .disclaimer("Informational only")
                .build();

        SaveDietPlanRequest dietReq = SaveDietPlanRequest.builder()
                .title("High Protein Cut Protocol")
                .goal(DietGoal.FAT_LOSS)
                .dailyCaloriesKcal(new BigDecimal("1950.0"))
                .dailyProteinG(new BigDecimal("160.0"))
                .planDetail(dietDetail)
                .build();

        mockMvc.perform(post("/diet-plans")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dietReq)))
                .andExpect(status().isCreated());

        // Save a Workout Plan
        com.prota.dto.response.WorkoutPlanDetailDto workoutDetail = com.prota.dto.response.WorkoutPlanDetailDto.builder()
                .title("Hypertrophy Upper Lower Split")
                .primaryGoal(WorkoutGoal.MUSCLE_HYPERTROPHY)
                .trainingLocation(TrainingLocation.GYM)
                .splitType(SplitType.UPPER_LOWER)
                .daysPerWeek(4)
                .sessionDurationMins(60)
                .experienceLevel(ExperienceLevel.INTERMEDIATE)
                .sessions(List.of())
                .disclaimer("Informational only")
                .build();

        SaveWorkoutPlanRequest workoutReq = SaveWorkoutPlanRequest.builder()
                .title("Hypertrophy Upper Lower Split")
                .primaryGoal(WorkoutGoal.MUSCLE_HYPERTROPHY)
                .trainingLocation(TrainingLocation.GYM)
                .splitType(SplitType.UPPER_LOWER)
                .daysPerWeek(4)
                .sessionDurationMins(60)
                .experienceLevel(ExperienceLevel.INTERMEDIATE)
                .planDetail(workoutDetail)
                .build();

        mockMvc.perform(post("/workout-plans")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(workoutReq)))
                .andExpect(status().isCreated());

        // Export Diet Plan PDF
        MvcResult dietPdf = mockMvc.perform(get("/reports/pdf")
                        .session(session)
                        .param("type", "SAVED_DIET_PLAN"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andReturn();
        assertThat(new String(dietPdf.getResponse().getContentAsByteArray(), 0, 4)).isEqualTo("%PDF");

        // Export Workout Plan PDF
        MvcResult workoutPdf = mockMvc.perform(get("/reports/pdf")
                        .session(session)
                        .param("type", "SAVED_WORKOUT_PLAN"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andReturn();
        assertThat(new String(workoutPdf.getResponse().getContentAsByteArray(), 0, 4)).isEqualTo("%PDF");
    }

    @Test
    @DisplayName("User isolation: User A cannot preview or download User B's reports")
    void reportAuthorization_preventsCrossUserLeakage() throws Exception {
        MockHttpSession sessionA = registerAndLoginUser("report_userA@prota.com", "reportuserA");
        MockHttpSession sessionB = registerAndLoginUser("report_userB@prota.com", "reportuserB");
        LocalDate today = LocalDate.now();

        // User A logs food
        CreateFoodEntryRequest foodReq = CreateFoodEntryRequest.builder()
                .foodName("Secret Salmon Bowl")
                .mealType(MealType.DINNER)
                .quantity(new BigDecimal("300"))
                .quantityUnit("g")
                .proteinG(new BigDecimal("42.0"))
                .caloriesKcal(new BigDecimal("500.0"))
                .nutritionSource(NutritionSource.MANUAL)
                .consumedAt(java.time.Instant.now())
                .build();

        mockMvc.perform(post("/logs/daily/" + today + "/entries")
                        .session(sessionA)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(foodReq)))
                .andExpect(status().isCreated());

        // User B preview must show 0 entries
        mockMvc.perform(get("/reports/preview")
                        .session(sessionB)
                        .param("type", "DAILY_NUTRITION")
                        .param("from", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalFoodEntries").value(0))
                .andExpect(jsonPath("$.recordedDays").value(0));

        // User B CSV export must NOT contain User A's food
        MvcResult csvB = mockMvc.perform(get("/reports/csv")
                        .session(sessionB)
                        .param("type", "FOOD_ENTRIES")
                        .param("from", today.toString())
                        .param("to", today.toString()))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(csvB.getResponse().getContentAsString()).doesNotContain("Secret Salmon Bowl");
    }
}
