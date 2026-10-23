package com.prota.service;

import com.prota.dto.request.CreateFoodEntryRequest;
import com.prota.dto.request.UpdateFoodEntryRequest;
import com.prota.dto.response.DailyLogResponse;
import com.prota.dto.response.FoodEntryResponse;
import com.prota.entity.DailyLog;
import com.prota.entity.FoodEntry;
import com.prota.entity.SavedFood;
import com.prota.entity.User;
import com.prota.entity.UserSetting;
import com.prota.entity.WaterEntry;
import com.prota.entity.WeightEntry;
import com.prota.exception.ResourceNotFoundException;
import com.prota.repo.DailyLogRepository;
import com.prota.repo.FoodEntryRepository;
import com.prota.repo.SavedFoodRepository;
import com.prota.repo.UserRepository;
import com.prota.repo.UserSettingRepository;
import com.prota.repo.WaterEntryRepository;
import com.prota.repo.WeightEntryRepository;
import com.prota.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class DailyFoodLoggingService {

    private final DailyLogRepository dailyLogRepository;
    private final FoodEntryRepository foodEntryRepository;
    private final SavedFoodRepository savedFoodRepository;
    private final UserSettingRepository userSettingRepository;
    private final UserRepository userRepository;
    private final WaterEntryRepository waterEntryRepository;
    private final WeightEntryRepository weightEntryRepository;
    private final com.prota.repo.AiFoodEstimateRepository aiFoodEstimateRepository;

    public DailyFoodLoggingService(DailyLogRepository dailyLogRepository,
                                  FoodEntryRepository foodEntryRepository,
                                  SavedFoodRepository savedFoodRepository,
                                  UserSettingRepository userSettingRepository,
                                  UserRepository userRepository,
                                  WaterEntryRepository waterEntryRepository,
                                  WeightEntryRepository weightEntryRepository,
                                  com.prota.repo.AiFoodEstimateRepository aiFoodEstimateRepository) {
        this.dailyLogRepository = dailyLogRepository;
        this.foodEntryRepository = foodEntryRepository;
        this.savedFoodRepository = savedFoodRepository;
        this.userSettingRepository = userSettingRepository;
        this.userRepository = userRepository;
        this.waterEntryRepository = waterEntryRepository;
        this.weightEntryRepository = weightEntryRepository;
        this.aiFoodEstimateRepository = aiFoodEstimateRepository;
    }

    @Transactional(readOnly = true)
    public DailyLogResponse getDailyLog(LocalDate date) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Optional<DailyLog> dailyLogOpt = dailyLogRepository.findByUserIdAndLogDate(currentUserId, date);

        if (dailyLogOpt.isPresent()) {
            DailyLog dailyLog = dailyLogOpt.get();
            List<FoodEntry> entries = foodEntryRepository.findByDailyLogIdOrderByConsumedAtDescIdDesc(dailyLog.getId());
            return buildDailyLogResponse(dailyLog, entries);
        } else {
            // Lazy display: Day has not been logged yet in DB. Return projected goals from user settings.
            UserSetting userSetting = userSettingRepository.findByUserId(currentUserId).orElse(null);
            BigDecimal proteinGoal = userSetting != null ? userSetting.getProteinGoalG() : new BigDecimal("140.00");
            BigDecimal calorieGoal = userSetting != null ? userSetting.getCalorieGoalKcal() : new BigDecimal("2000.00");
            Integer waterGoal = userSetting != null ? userSetting.getWaterGoalMl() : 2500;
            String tz = userSetting != null ? userSetting.getTimezone() : "UTC";

            int waterConsumed = waterEntryRepository.findByUserIdAndEntryDateOrderByConsumedAtDesc(currentUserId, date)
                .stream().mapToInt(WaterEntry::getAmountMl).sum();
            BigDecimal weight = weightEntryRepository.findByUserIdAndEntryDateOrderByRecordedAtDesc(currentUserId, date)
                .stream().map(WeightEntry::getWeightKg).findFirst().orElse(null);

            return DailyLogResponse.builder()
                .id(null)
                .logDate(date)
                .timezone(tz)
                .proteinGoalG(proteinGoal)
                .calorieGoalKcal(calorieGoal)
                .waterGoalMl(waterGoal)
                .consumedProteinG(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                .consumedCaloriesKcal(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                .consumedCarbohydratesG(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                .consumedFatG(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                .hasIncompleteCalories(false)
                .proteinRemainingG(proteinGoal)
                .proteinCompletionPercentage(BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP))
                .consumedWaterMl(waterConsumed > 0 ? waterConsumed : null)
                .recordedWeightKg(weight)
                .foodEntries(Collections.emptyList())
                .build();
        }
    }

    @Transactional(readOnly = true)
    public List<DailyLogResponse> getDailyLogsRange(LocalDate from, LocalDate to) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        List<DailyLog> logs = dailyLogRepository.findByUserIdAndLogDateBetweenOrderByLogDateAsc(currentUserId, from, to);

        return logs.stream().map(log -> {
            List<FoodEntry> entries = foodEntryRepository.findByDailyLogIdOrderByConsumedAtDescIdDesc(log.getId());
            return buildDailyLogResponse(log, entries);
        }).toList();
    }

    @Transactional
    public FoodEntryResponse addFoodEntry(LocalDate date, CreateFoodEntryRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Get or lazily create DailyLog for (user, date)
        DailyLog dailyLog = dailyLogRepository.findByUserIdAndLogDate(currentUserId, date)
            .orElseGet(() -> {
                UserSetting settings = userSettingRepository.findByUserId(currentUserId).orElse(null);
                BigDecimal proteinGoal = settings != null ? settings.getProteinGoalG() : new BigDecimal("140.00");
                BigDecimal calorieGoal = settings != null ? settings.getCalorieGoalKcal() : null;
                Integer waterGoal = settings != null ? settings.getWaterGoalMl() : null;
                String tz = settings != null ? settings.getTimezone() : "UTC";

                DailyLog newLog = DailyLog.builder()
                    .user(currentUser)
                    .logDate(date)
                    .timezoneAtCreation(tz)
                    .proteinGoalG(proteinGoal)
                    .calorieGoalKcal(calorieGoal)
                    .waterGoalMl(waterGoal)
                    .build();

                return dailyLogRepository.save(newLog);
            });

        SavedFood savedFood = null;
        if (request.getSavedFoodId() != null) {
            savedFood = savedFoodRepository.findByIdAndUserId(request.getSavedFoodId(), currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Saved food template not found"));
        }

        com.prota.entity.AiFoodEstimate aiEstimate = null;
        if (request.getAiEstimateId() != null) {
            aiEstimate = aiFoodEstimateRepository.findByIdAndUserId(request.getAiEstimateId(), currentUserId)
                .orElse(null);
            if (aiEstimate != null) {
                aiEstimate.setStatus(com.prota.entity.enums.EstimateStatus.CONFIRMED);
                aiEstimate.setConfirmedAt(java.time.Instant.now());
                aiFoodEstimateRepository.save(aiEstimate);
            }
        }

        com.prota.entity.enums.NutritionSource source = request.getNutritionSource();
        if (source == null) {
            source = (aiEstimate != null) ? com.prota.entity.enums.NutritionSource.AI_CONFIRMED : com.prota.entity.enums.NutritionSource.MANUAL;
        }

        FoodEntry entry = FoodEntry.builder()
            .user(currentUser)
            .dailyLog(dailyLog)
            .savedFood(savedFood)
            .aiEstimate(aiEstimate)
            .foodName(request.getFoodName().trim())
            .mealType(request.getMealType())
            .category(request.getCategory() != null ? request.getCategory().trim() : null)
            .quantity(request.getQuantity())
            .quantityUnit(request.getQuantityUnit().trim())
            .proteinG(request.getProteinG())
            .caloriesKcal(request.getCaloriesKcal())
            .carbohydratesG(request.getCarbohydratesG())
            .fatG(request.getFatG())
            .nutritionSource(source)
            .notes(request.getNotes() != null ? request.getNotes().trim() : null)
            .consumedAt(request.getConsumedAt())
            .build();

        FoodEntry saved = foodEntryRepository.save(entry);
        return mapToFoodEntryResponse(saved);
    }

    @Transactional
    public DailyLogResponse addBatchFoodEntries(LocalDate date, List<CreateFoodEntryRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return getDailyLog(date);
        }

        for (CreateFoodEntryRequest request : requests) {
            addFoodEntry(date, request);
        }

        return getDailyLog(date);
    }

    @Transactional(readOnly = true)
    public FoodEntryResponse getFoodEntry(UUID id) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        FoodEntry entry = foodEntryRepository.findByIdAndUserId(id, currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("Food entry not found with id: " + id));

        return mapToFoodEntryResponse(entry);
    }

    @Transactional
    public FoodEntryResponse updateFoodEntry(UUID id, UpdateFoodEntryRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        FoodEntry entry = foodEntryRepository.findByIdAndUserId(id, currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("Food entry not found with id: " + id));

        entry.setFoodName(request.getFoodName().trim());
        entry.setMealType(request.getMealType());
        entry.setCategory(request.getCategory() != null ? request.getCategory().trim() : null);
        entry.setQuantity(request.getQuantity());
        entry.setQuantityUnit(request.getQuantityUnit().trim());
        entry.setProteinG(request.getProteinG());
        entry.setCaloriesKcal(request.getCaloriesKcal());
        entry.setCarbohydratesG(request.getCarbohydratesG());
        entry.setFatG(request.getFatG());
        entry.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);
        entry.setConsumedAt(request.getConsumedAt());

        FoodEntry updated = foodEntryRepository.save(entry);
        return mapToFoodEntryResponse(updated);
    }

    @Transactional
    public void deleteFoodEntry(UUID id) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        FoodEntry entry = foodEntryRepository.findByIdAndUserId(id, currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("Food entry not found with id: " + id));

        foodEntryRepository.delete(entry);
    }

    private DailyLogResponse buildDailyLogResponse(DailyLog log, List<FoodEntry> entries) {
        BigDecimal totalProtein = BigDecimal.ZERO;
        BigDecimal totalCalories = BigDecimal.ZERO;
        BigDecimal totalCarbs = BigDecimal.ZERO;
        BigDecimal totalFat = BigDecimal.ZERO;
        boolean hasIncompleteCalories = false;

        for (FoodEntry entry : entries) {
            if (entry.getProteinG() != null) {
                totalProtein = totalProtein.add(entry.getProteinG());
            }
            if (entry.getCaloriesKcal() != null) {
                totalCalories = totalCalories.add(entry.getCaloriesKcal());
            } else {
                hasIncompleteCalories = true;
            }
            if (entry.getCarbohydratesG() != null) {
                totalCarbs = totalCarbs.add(entry.getCarbohydratesG());
            }
            if (entry.getFatG() != null) {
                totalFat = totalFat.add(entry.getFatG());
            }
        }

        totalProtein = totalProtein.setScale(2, RoundingMode.HALF_UP);
        totalCalories = totalCalories.setScale(2, RoundingMode.HALF_UP);
        totalCarbs = totalCarbs.setScale(2, RoundingMode.HALF_UP);
        totalFat = totalFat.setScale(2, RoundingMode.HALF_UP);

        BigDecimal goal = log.getProteinGoalG();
        BigDecimal remaining = goal.subtract(totalProtein);
        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            remaining = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        } else {
            remaining = remaining.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal percentage;
        if (goal.compareTo(BigDecimal.ZERO) > 0) {
            percentage = totalProtein.multiply(new BigDecimal("100"))
                .divide(goal, 1, RoundingMode.HALF_UP);
        } else {
            percentage = BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP);
        }

        List<FoodEntryResponse> entryResponses = entries.stream()
            .map(this::mapToFoodEntryResponse)
            .toList();

        int waterConsumed = waterEntryRepository.findByUserIdAndEntryDateOrderByConsumedAtDesc(log.getUser().getId(), log.getLogDate())
            .stream().mapToInt(WaterEntry::getAmountMl).sum();
        BigDecimal weight = weightEntryRepository.findByUserIdAndEntryDateOrderByRecordedAtDesc(log.getUser().getId(), log.getLogDate())
            .stream().map(WeightEntry::getWeightKg).findFirst().orElse(null);

        return DailyLogResponse.builder()
            .id(log.getId())
            .logDate(log.getLogDate())
            .timezone(log.getTimezoneAtCreation())
            .proteinGoalG(log.getProteinGoalG())
            .calorieGoalKcal(log.getCalorieGoalKcal())
            .waterGoalMl(log.getWaterGoalMl())
            .consumedProteinG(totalProtein)
            .consumedCaloriesKcal(totalCalories)
            .consumedCarbohydratesG(totalCarbs)
            .consumedFatG(totalFat)
            .hasIncompleteCalories(hasIncompleteCalories)
            .proteinRemainingG(remaining)
            .proteinCompletionPercentage(percentage)
            .consumedWaterMl(waterConsumed > 0 ? waterConsumed : null)
            .recordedWeightKg(weight)
            .foodEntries(entryResponses)
            .build();
    }

    private FoodEntryResponse mapToFoodEntryResponse(FoodEntry entry) {
        return FoodEntryResponse.builder()
            .id(entry.getId())
            .dailyLogId(entry.getDailyLog().getId())
            .savedFoodId(entry.getSavedFood() != null ? entry.getSavedFood().getId() : null)
            .aiEstimateId(entry.getAiEstimate() != null ? entry.getAiEstimate().getId() : null)
            .foodName(entry.getFoodName())
            .mealType(entry.getMealType())
            .category(entry.getCategory())
            .quantity(entry.getQuantity())
            .quantityUnit(entry.getQuantityUnit())
            .proteinG(entry.getProteinG())
            .caloriesKcal(entry.getCaloriesKcal())
            .carbohydratesG(entry.getCarbohydratesG())
            .fatG(entry.getFatG())
            .nutritionSource(entry.getNutritionSource())
            .notes(entry.getNotes())
            .consumedAt(entry.getConsumedAt())
            .createdAt(entry.getCreatedAt())
            .updatedAt(entry.getUpdatedAt())
            .build();
    }
}
