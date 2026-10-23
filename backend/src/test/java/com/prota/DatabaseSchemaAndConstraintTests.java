package com.prota;

import com.prota.entity.*;
import com.prota.entity.enums.*;
import com.prota.repo.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class DatabaseSchemaAndConstraintTests {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSettingRepository userSettingRepository;

    @Autowired
    private DailyLogRepository dailyLogRepository;

    @Autowired
    private FoodEntryRepository foodEntryRepository;

    @Autowired
    private SavedFoodRepository savedFoodRepository;

    @Autowired
    private AiFoodEstimateRepository aiFoodEstimateRepository;

    @Autowired
    private WaterEntryRepository waterEntryRepository;

    @Autowired
    private WeightEntryRepository weightEntryRepository;

    @Autowired
    private ReminderSettingRepository reminderSettingRepository;

    @Autowired
    private PushSubscriptionRepository pushSubscriptionRepository;

    @Autowired
    private NotificationEventRepository notificationEventRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Test
    @DisplayName("Verify approved business tables exist in PostgreSQL including diet_plans")
    void testAllTwelveTablesExist() {
        List<String> expectedTables = List.of(
            "users",
            "user_settings",
            "daily_logs",
            "food_entries",
            "saved_foods",
            "water_entries",
            "weight_entries",
            "ai_food_estimates",
            "reminder_settings",
            "push_subscriptions",
            "notification_events",
            "refresh_tokens",
            "diet_plans",
            "workout_plans"
        );

        List<String> actualTables = jdbcTemplate.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name != 'flyway_schema_history'",
            (rs, rowNum) -> rs.getString("table_name")
        );

        assertThat(actualTables)
            .hasSameSizeAs(expectedTables)
            .containsAll(expectedTables);
    }

    @Test
    @DisplayName("Verify duplicate email is rejected by unique constraint and index")
    void testDuplicateEmailRejected() {
        String testEmail = "unique-" + UUID.randomUUID() + "@example.com";

        User user1 = User.builder()
            .fullName("First User")
            .email(testEmail)
            .passwordHash("$2a$10$dummyHash123456789012345678901234567890")
            .status(UserStatus.ACTIVE)
            .build();
        userRepository.saveAndFlush(user1);

        User user2 = User.builder()
            .fullName("Second User")
            .email(testEmail.toUpperCase()) // tests case insensitivity / uniqueness
            .passwordHash("$2a$10$dummyHash123456789012345678901234567890")
            .status(UserStatus.ACTIVE)
            .build();

        assertThatThrownBy(() -> userRepository.saveAndFlush(user2))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Verify duplicate daily log for same user and date is rejected")
    void testDuplicateDailyLogRejected() {
        User user = userRepository.saveAndFlush(User.builder()
            .fullName("Daily Log User")
            .email("dailylog-" + UUID.randomUUID() + "@example.com")
            .passwordHash("$2a$10$dummyHash123456789012345678901234567890")
            .status(UserStatus.ACTIVE)
            .build());

        LocalDate today = LocalDate.of(2026, 10, 20);

        DailyLog log1 = DailyLog.builder()
            .user(user)
            .logDate(today)
            .timezoneAtCreation("Asia/Kolkata")
            .proteinGoalG(new BigDecimal("150.00"))
            .calorieGoalKcal(new BigDecimal("2200.00"))
            .waterGoalMl(3000)
            .build();
        dailyLogRepository.saveAndFlush(log1);

        DailyLog log2 = DailyLog.builder()
            .user(user)
            .logDate(today)
            .timezoneAtCreation("Asia/Kolkata")
            .proteinGoalG(new BigDecimal("160.00"))
            .calorieGoalKcal(new BigDecimal("2300.00"))
            .waterGoalMl(3200)
            .build();

        assertThatThrownBy(() -> dailyLogRepository.saveAndFlush(log2))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Verify invalid numeric values (negative protein / invalid weight) are rejected by CHECK constraints")
    void testInvalidNumericCheckConstraints() {
        User user = userRepository.saveAndFlush(User.builder()
            .fullName("Check Constraint User")
            .email("check-" + UUID.randomUUID() + "@example.com")
            .passwordHash("$2a$10$dummyHash123456789012345678901234567890")
            .status(UserStatus.ACTIVE)
            .build());

        // 1. Protein goal must be positive (> 0)
        UserSetting invalidSetting = UserSetting.builder()
            .user(user)
            .proteinGoalG(new BigDecimal("-10.00"))
            .weightUnit(WeightUnit.KG)
            .timezone("UTC")
            .theme(ThemePreference.SYSTEM)
            .build();

        assertThatThrownBy(() -> userSettingRepository.saveAndFlush(invalidSetting))
            .isInstanceOf(DataIntegrityViolationException.class);

        // 2. Weight must be positive (> 0 and <= 700)
        WeightEntry invalidWeight = WeightEntry.builder()
            .user(user)
            .weightKg(new BigDecimal("-5.000"))
            .entryDate(LocalDate.now())
            .recordedAt(Instant.now())
            .build();

        assertThatThrownBy(() -> weightEntryRepository.saveAndFlush(invalidWeight))
            .isInstanceOf(DataIntegrityViolationException.class);

        // 3. Water must be positive and <= 20000 ml
        WaterEntry invalidWater = WaterEntry.builder()
            .user(user)
            .entryDate(LocalDate.now())
            .amountMl(-200)
            .consumedAt(Instant.now())
            .build();

        assertThatThrownBy(() -> waterEntryRepository.saveAndFlush(invalidWater))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Verify cross-user composite foreign key rejects referencing another user's daily log")
    void testCrossUserReferenceRejectedByCompositeForeignKey() {
        User userA = userRepository.saveAndFlush(User.builder()
            .fullName("User A")
            .email("usera-" + UUID.randomUUID() + "@example.com")
            .passwordHash("$2a$10$dummyHash123456789012345678901234567890")
            .status(UserStatus.ACTIVE)
            .build());

        User userB = userRepository.saveAndFlush(User.builder()
            .fullName("User B")
            .email("userb-" + UUID.randomUUID() + "@example.com")
            .passwordHash("$2a$10$dummyHash123456789012345678901234567890")
            .status(UserStatus.ACTIVE)
            .build());

        DailyLog userADailyLog = dailyLogRepository.saveAndFlush(DailyLog.builder()
            .user(userA)
            .logDate(LocalDate.of(2026, 10, 20))
            .timezoneAtCreation("UTC")
            .proteinGoalG(new BigDecimal("140.00"))
            .build());

        // Attempt to create a FoodEntry belonging to User B, but pointing to User A's DailyLog
        // The composite foreign key fk_food_entries_daily_log (user_id, daily_log_id) REFERENCES daily_logs(user_id, id)
        // MUST reject this at the database level!
        FoodEntry crossUserEntry = FoodEntry.builder()
            .user(userB) // User B
            .dailyLog(userADailyLog) // User A's daily log
            .foodName("Protein Shake")
            .mealType(MealType.SNACK)
            .quantity(new BigDecimal("300.000"))
            .quantityUnit("ML")
            .proteinG(new BigDecimal("30.00"))
            .nutritionSource(NutritionSource.MANUAL)
            .consumedAt(Instant.now())
            .build();

        assertThatThrownBy(() -> foodEntryRepository.saveAndFlush(crossUserEntry))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Verify deleting a saved food sets food_entries.saved_food_id to NULL without deleting the historical entry")
    void testSavedFoodDeletionPreservesHistoricalFoodEntry() {
        User user = userRepository.saveAndFlush(User.builder()
            .fullName("History Preserving User")
            .email("history-" + UUID.randomUUID() + "@example.com")
            .passwordHash("$2a$10$dummyHash123456789012345678901234567890")
            .status(UserStatus.ACTIVE)
            .build());

        DailyLog log = dailyLogRepository.saveAndFlush(DailyLog.builder()
            .user(user)
            .logDate(LocalDate.of(2026, 10, 20))
            .timezoneAtCreation("UTC")
            .proteinGoalG(new BigDecimal("150.00"))
            .build());

        SavedFood template = savedFoodRepository.saveAndFlush(SavedFood.builder()
            .user(user)
            .name("Whey Isolate")
            .servingQuantity(new BigDecimal("30.000"))
            .servingUnit("G")
            .proteinG(new BigDecimal("25.00"))
            .caloriesKcal(new BigDecimal("110.00"))
            .build());

        FoodEntry entry = foodEntryRepository.saveAndFlush(FoodEntry.builder()
            .user(user)
            .dailyLog(log)
            .savedFood(template)
            .foodName(template.getName())
            .mealType(MealType.BREAKFAST)
            .quantity(template.getServingQuantity())
            .quantityUnit(template.getServingUnit())
            .proteinG(template.getProteinG())
            .caloriesKcal(template.getCaloriesKcal())
            .nutritionSource(NutritionSource.SAVED_FOOD)
            .consumedAt(Instant.now())
            .build());

        UUID entryId = entry.getId();
        UUID templateId = template.getId();

        // Delete the saved food template
        savedFoodRepository.deleteById(templateId);
        savedFoodRepository.flush();

        // Historical entry must still exist!
        FoodEntry preservedEntry = foodEntryRepository.findById(entryId).orElseThrow();
        assertThat(preservedEntry).isNotNull();
        assertThat(preservedEntry.getSavedFood()).isNull();
        assertThat(preservedEntry.getProteinG()).isEqualByComparingTo(new BigDecimal("25.00"));
        assertThat(preservedEntry.getFoodName()).isEqualTo("Whey Isolate");
    }
}
