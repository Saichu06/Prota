package com.prota.service;

import com.prota.dto.response.AnalyticsDailyPoint;
import com.prota.dto.response.AnalyticsSummaryResponse;
import com.prota.entity.DailyLog;
import com.prota.entity.FoodEntry;
import com.prota.entity.UserSetting;
import com.prota.entity.WaterEntry;
import com.prota.entity.WeightEntry;
import com.prota.repo.DailyLogRepository;
import com.prota.repo.FoodEntryRepository;
import com.prota.repo.UserSettingRepository;
import com.prota.repo.WaterEntryRepository;
import com.prota.repo.WeightEntryRepository;
import com.prota.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final DailyLogRepository dailyLogRepository;
    private final FoodEntryRepository foodEntryRepository;
    private final WaterEntryRepository waterEntryRepository;
    private final WeightEntryRepository weightEntryRepository;
    private final UserSettingRepository userSettingRepository;

    public AnalyticsService(DailyLogRepository dailyLogRepository,
                            FoodEntryRepository foodEntryRepository,
                            WaterEntryRepository waterEntryRepository,
                            WeightEntryRepository weightEntryRepository,
                            UserSettingRepository userSettingRepository) {
        this.dailyLogRepository = dailyLogRepository;
        this.foodEntryRepository = foodEntryRepository;
        this.waterEntryRepository = waterEntryRepository;
        this.weightEntryRepository = weightEntryRepository;
        this.userSettingRepository = userSettingRepository;
    }

    @Transactional(readOnly = true)
    public AnalyticsSummaryResponse getAnalyticsSummary(LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            LocalDate temp = from;
            from = to;
            to = temp;
        }

        UUID userId = SecurityUtils.getCurrentUserId();
        UserSetting settings = userSettingRepository.findByUserId(userId).orElse(null);
        BigDecimal defaultProteinGoal = settings != null && settings.getProteinGoalG() != null
                ? settings.getProteinGoalG() : new BigDecimal("140.00");
        BigDecimal defaultCalorieGoal = settings != null && settings.getCalorieGoalKcal() != null
                ? settings.getCalorieGoalKcal() : new BigDecimal("2000.00");

        List<DailyLog> logs = dailyLogRepository.findByUserIdAndLogDateBetweenOrderByLogDateAsc(userId, from, to);
        Map<LocalDate, DailyLog> logsByDate = logs.stream()
                .collect(Collectors.toMap(DailyLog::getLogDate, l -> l, (existing, replacement) -> existing));

        List<WaterEntry> waterList = waterEntryRepository.findByUserIdAndEntryDateBetweenOrderByEntryDateAscConsumedAtAsc(userId, from, to);
        Map<LocalDate, Integer> waterByDate = new HashMap<>();
        for (WaterEntry w : waterList) {
            waterByDate.merge(w.getEntryDate(), w.getAmountMl(), Integer::sum);
        }

        List<WeightEntry> weightList = weightEntryRepository.findByUserIdAndEntryDateBetweenOrderByEntryDateAscRecordedAtAsc(userId, from, to);
        Map<LocalDate, BigDecimal> weightByDate = new HashMap<>();
        for (WeightEntry wt : weightList) {
            weightByDate.put(wt.getEntryDate(), wt.getWeightKg()); // latest per date will overwrite
        }

        List<AnalyticsDailyPoint> dailyPoints = new ArrayList<>();
        int totalDays = (int) ChronoUnit.DAYS.between(from, to) + 1;
        int trackedDaysCount = 0;
        int proteinGoalMetDays = 0;
        int calorieGoalMetDays = 0;
        BigDecimal sumProtein = BigDecimal.ZERO;
        BigDecimal sumCalories = BigDecimal.ZERO;
        int foodTrackedDays = 0;
        int totalWaterMl = 0;
        int waterTrackedDays = 0;

        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            DailyLog log = logsByDate.get(d);
            Integer water = waterByDate.get(d);
            BigDecimal weight = weightByDate.get(d);

            BigDecimal dayProtein = null;
            BigDecimal dayProteinGoal = defaultProteinGoal;
            BigDecimal dayCalories = null;
            BigDecimal dayCalorieGoal = defaultCalorieGoal;
            int foodCount = 0;
            boolean hasData = false;

            if (log != null) {
                dayProteinGoal = log.getProteinGoalG() != null ? log.getProteinGoalG() : defaultProteinGoal;
                dayCalorieGoal = log.getCalorieGoalKcal() != null ? log.getCalorieGoalKcal() : defaultCalorieGoal;

                List<FoodEntry> entries = foodEntryRepository.findByDailyLogIdOrderByConsumedAtDescIdDesc(log.getId());
                foodCount = entries.size();
                if (!entries.isEmpty()) {
                    hasData = true;
                    BigDecimal p = BigDecimal.ZERO;
                    BigDecimal c = BigDecimal.ZERO;
                    for (FoodEntry fe : entries) {
                        if (fe.getProteinG() != null) p = p.add(fe.getProteinG());
                        if (fe.getCaloriesKcal() != null) c = c.add(fe.getCaloriesKcal());
                    }
                    dayProtein = p.setScale(1, RoundingMode.HALF_UP);
                    dayCalories = c.setScale(1, RoundingMode.HALF_UP);

                    sumProtein = sumProtein.add(dayProtein);
                    sumCalories = sumCalories.add(dayCalories);
                    foodTrackedDays++;

                    if (dayProtein.compareTo(dayProteinGoal) >= 0) {
                        proteinGoalMetDays++;
                    }
                    if (dayCalorieGoal != null && dayCalories.compareTo(dayCalorieGoal) <= 0) {
                        calorieGoalMetDays++;
                    }
                }
            }

            if (water != null && water > 0) {
                hasData = true;
                totalWaterMl += water;
                waterTrackedDays++;
            }

            if (weight != null) {
                hasData = true;
            }

            if (hasData) {
                trackedDaysCount++;
            }

            dailyPoints.add(AnalyticsDailyPoint.builder()
                    .date(d)
                    .proteinG(dayProtein)
                    .proteinGoalG(dayProteinGoal)
                    .caloriesKcal(dayCalories)
                    .calorieGoalKcal(dayCalorieGoal)
                    .waterMl(water)
                    .weightKg(weight)
                    .hasData(hasData)
                    .foodEntriesCount(foodCount)
                    .build());
        }

        BigDecimal avgProtein = foodTrackedDays > 0
                ? sumProtein.divide(BigDecimal.valueOf(foodTrackedDays), 1, RoundingMode.HALF_UP)
                : null;

        BigDecimal avgCalories = foodTrackedDays > 0
                ? sumCalories.divide(BigDecimal.valueOf(foodTrackedDays), 0, RoundingMode.HALF_UP)
                : null;

        BigDecimal proteinAdherence = foodTrackedDays > 0
                ? BigDecimal.valueOf(proteinGoalMetDays)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(foodTrackedDays), 1, RoundingMode.HALF_UP)
                : null;

        BigDecimal calorieAdherence = foodTrackedDays > 0
                ? BigDecimal.valueOf(calorieGoalMetDays)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(foodTrackedDays), 1, RoundingMode.HALF_UP)
                : null;

        Integer avgWaterMl = waterTrackedDays > 0 ? totalWaterMl / waterTrackedDays : null;

        // Weight trend
        BigDecimal startWeight = null;
        BigDecimal latestWeight = null;
        BigDecimal weightChange = null;
        if (!weightList.isEmpty()) {
            startWeight = weightList.get(0).getWeightKg();
            latestWeight = weightList.get(weightList.size() - 1).getWeightKg();
            weightChange = latestWeight.subtract(startWeight).setScale(2, RoundingMode.HALF_UP);
        }

        // Generate deterministic factual insights
        List<String> insights = new ArrayList<>();
        if (foodTrackedDays > 0) {
            insights.add(String.format("You logged nutrition on %d of %d days (%d%%).",
                    foodTrackedDays, totalDays, (foodTrackedDays * 100) / totalDays));

            if (proteinAdherence != null) {
                insights.add(String.format("Protein goal was achieved on %d of %d tracked days (%s%%).",
                        proteinGoalMetDays, foodTrackedDays, proteinAdherence));
            }

            if (avgProtein != null) {
                BigDecimal diff = avgProtein.subtract(defaultProteinGoal);
                if (diff.compareTo(BigDecimal.ZERO) >= 0) {
                    insights.add(String.format("Average protein intake is %sg/day (+%sg vs target).",
                            avgProtein, diff.setScale(1, RoundingMode.HALF_UP)));
                } else {
                    insights.add(String.format("Average protein intake is %sg/day (%sg below target).",
                            avgProtein, diff.abs().setScale(1, RoundingMode.HALF_UP)));
                }
            }
        } else {
            insights.add("No food entries recorded in this date range yet.");
        }

        if (waterTrackedDays > 0 && avgWaterMl != null) {
            insights.add(String.format("Hydration was logged on %d days, averaging %,d ml/day.",
                    waterTrackedDays, avgWaterMl));
        }

        if (weightChange != null && startWeight != null && latestWeight != null && !startWeight.equals(latestWeight)) {
            String dir = weightChange.compareTo(BigDecimal.ZERO) > 0 ? "+" : "";
            insights.add(String.format("Weight changed by %s%s kg across %d recordings (%s kg to %s kg).",
                    dir, weightChange, weightList.size(), startWeight, latestWeight));
        }

        return AnalyticsSummaryResponse.builder()
                .fromDate(from)
                .toDate(to)
                .totalDaysInRange(totalDays)
                .trackedDaysCount(trackedDaysCount)
                .averageProteinG(avgProtein)
                .averageCaloriesKcal(avgCalories)
                .proteinGoalAdherencePercentage(proteinAdherence)
                .calorieGoalAdherencePercentage(calorieAdherence)
                .totalWaterMl(totalWaterMl)
                .averageWaterMl(avgWaterMl)
                .startWeightKg(startWeight)
                .latestWeightKg(latestWeight)
                .weightChangeKg(weightChange)
                .dailyData(dailyPoints)
                .insights(insights)
                .build();
    }
}
