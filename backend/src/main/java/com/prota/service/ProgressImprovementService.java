package com.prota.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prota.ai.client.GeminiClient;
import com.prota.dto.response.*;
import com.prota.entity.*;
import com.prota.exception.AiServiceException;
import com.prota.repo.*;
import com.prota.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProgressImprovementService {

    private static final Logger log = LoggerFactory.getLogger(ProgressImprovementService.class);

    private final DailyLogRepository dailyLogRepository;
    private final FoodEntryRepository foodEntryRepository;
    private final WaterEntryRepository waterEntryRepository;
    private final WeightEntryRepository weightEntryRepository;
    private final UserSettingRepository userSettingRepository;
    private final DietPlanRepository dietPlanRepository;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public ProgressImprovementService(DailyLogRepository dailyLogRepository,
                                    FoodEntryRepository foodEntryRepository,
                                    WaterEntryRepository waterEntryRepository,
                                    WeightEntryRepository weightEntryRepository,
                                    UserSettingRepository userSettingRepository,
                                    DietPlanRepository dietPlanRepository,
                                    WorkoutPlanRepository workoutPlanRepository,
                                    GeminiClient geminiClient,
                                    ObjectMapper objectMapper) {
        this.dailyLogRepository = dailyLogRepository;
        this.foodEntryRepository = foodEntryRepository;
        this.waterEntryRepository = waterEntryRepository;
        this.weightEntryRepository = weightEntryRepository;
        this.userSettingRepository = userSettingRepository;
        this.dietPlanRepository = dietPlanRepository;
        this.workoutPlanRepository = workoutPlanRepository;
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public ProgressImprovementResponse analyzeProgress(LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            throw new IllegalArgumentException("Both 'from' and 'to' date parameters are required.");
        }

        if (from.isAfter(to)) {
            LocalDate temp = from;
            from = to;
            to = temp;
        }

        LocalDate today = LocalDate.now();
        if (to.isAfter(today)) {
            to = today;
        }
        if (from.isAfter(today)) {
            from = today;
        }

        long rangeDays = ChronoUnit.DAYS.between(from, to) + 1;
        if (rangeDays > 365) {
            throw new IllegalArgumentException("Date range cannot exceed 365 days.");
        }

        UUID userId = SecurityUtils.getCurrentUserId();
        UserSetting settings = userSettingRepository.findByUserId(userId).orElse(null);

        BigDecimal defaultProteinGoal = settings != null && settings.getProteinGoalG() != null
                ? settings.getProteinGoalG() : new BigDecimal("140.00");
        BigDecimal defaultCalorieGoal = settings != null && settings.getCalorieGoalKcal() != null
                ? settings.getCalorieGoalKcal() : new BigDecimal("2000.00");
        Integer defaultWaterGoal = settings != null && settings.getWaterGoalMl() != null
                ? settings.getWaterGoalMl() : 2500;
        String weightUnit = settings != null && settings.getWeightUnit() != null
                ? settings.getWeightUnit().name() : "KG";

        // Fetch logs and records
        List<DailyLog> logs = dailyLogRepository.findByUserIdAndLogDateBetweenOrderByLogDateAsc(userId, from, to);
        Map<LocalDate, DailyLog> logsByDate = logs.stream()
                .collect(Collectors.toMap(DailyLog::getLogDate, l -> l, (e1, e2) -> e1));

        List<WaterEntry> waterList = waterEntryRepository.findByUserIdAndEntryDateBetweenOrderByEntryDateAscConsumedAtAsc(userId, from, to);
        Map<LocalDate, Integer> waterByDate = new HashMap<>();
        for (WaterEntry w : waterList) {
            waterByDate.merge(w.getEntryDate(), w.getAmountMl(), Integer::sum);
        }

        List<WeightEntry> weightList = weightEntryRepository.findByUserIdAndEntryDateBetweenOrderByEntryDateAscRecordedAtAsc(userId, from, to);
        Map<LocalDate, BigDecimal> weightByDate = new HashMap<>();
        for (WeightEntry wt : weightList) {
            weightByDate.put(wt.getEntryDate(), wt.getWeightKg());
        }

        // Optional fitness context
        List<DietPlan> dietPlans = dietPlanRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<WorkoutPlan> workoutPlans = workoutPlanRepository.findByUserIdOrderByCreatedAtDesc(userId);
        String fitnessContextNote = buildFitnessContextNote(dietPlans, workoutPlans);

        // Daily points and metric accumulators
        List<AnalyticsDailyPoint> dailyPoints = new ArrayList<>();
        int foodTrackedDays = 0;
        int waterTrackedDays = 0;
        int weightRecordedDays = weightByDate.size();
        BigDecimal sumProtein = BigDecimal.ZERO;
        BigDecimal sumCalories = BigDecimal.ZERO;
        int totalWaterMl = 0;

        int proteinMetDays = 0;
        int proteinBelowDays = 0;
        int proteinAboveDays = 0;

        int calorieOnTargetDays = 0;
        int calorieBelowDays = 0;
        int calorieAboveDays = 0;

        int waterMetDays = 0;
        boolean hasHistoricalGoalSnapshot = false;

        List<BigDecimal> dailyProteinValues = new ArrayList<>();

        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            DailyLog log = logsByDate.get(d);
            Integer water = waterByDate.get(d);
            BigDecimal weight = weightByDate.get(d);

            BigDecimal dayProtein = null;
            BigDecimal dayProteinGoal = defaultProteinGoal;
            BigDecimal dayCalories = null;
            BigDecimal dayCalorieGoal = defaultCalorieGoal;
            Integer dayWaterGoal = defaultWaterGoal;
            int foodCount = 0;
            boolean hasData = false;

            if (log != null) {
                if (log.getProteinGoalG() != null) {
                    dayProteinGoal = log.getProteinGoalG();
                    hasHistoricalGoalSnapshot = true;
                }
                if (log.getCalorieGoalKcal() != null) {
                    dayCalorieGoal = log.getCalorieGoalKcal();
                }
                if (log.getWaterGoalMl() != null) {
                    dayWaterGoal = log.getWaterGoalMl();
                }

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
                    dailyProteinValues.add(dayProtein);

                    if (dayProtein.compareTo(dayProteinGoal) >= 0) {
                        proteinMetDays++;
                        proteinAboveDays++;
                    } else {
                        proteinBelowDays++;
                    }

                    if (dayCalorieGoal != null) {
                        BigDecimal lowerBound = dayCalorieGoal.multiply(new BigDecimal("0.90"));
                        BigDecimal upperBound = dayCalorieGoal.multiply(new BigDecimal("1.10"));
                        if (dayCalories.compareTo(lowerBound) >= 0 && dayCalories.compareTo(upperBound) <= 0) {
                            calorieOnTargetDays++;
                        } else if (dayCalories.compareTo(lowerBound) < 0) {
                            calorieBelowDays++;
                        } else {
                            calorieAboveDays++;
                        }
                    }
                }
            }

            if (water != null && water > 0) {
                hasData = true;
                totalWaterMl += water;
                waterTrackedDays++;
                if (water >= dayWaterGoal) {
                    waterMetDays++;
                }
            }

            if (weight != null) {
                hasData = true;
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

        int totalDays = (int) rangeDays;
        BigDecimal trackingConsistencyPct = BigDecimal.valueOf(foodTrackedDays)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(totalDays), 1, RoundingMode.HALF_UP);

        boolean hasSufficientData = foodTrackedDays >= 2;
        String limitationsNote = buildLimitationsNote(totalDays, foodTrackedDays, waterTrackedDays, weightRecordedDays);

        DataCoverageDto dataCoverage = DataCoverageDto.builder()
                .totalCalendarDays(totalDays)
                .foodTrackedDays(foodTrackedDays)
                .waterTrackedDays(waterTrackedDays)
                .weightRecordedDays(weightRecordedDays)
                .trackingConsistencyPercentage(trackingConsistencyPct)
                .hasSufficientData(hasSufficientData)
                .limitationsNote(limitationsNote)
                .build();

        // Protein metrics
        BigDecimal avgProtein = foodTrackedDays > 0
                ? sumProtein.divide(BigDecimal.valueOf(foodTrackedDays), 1, RoundingMode.HALF_UP)
                : null;
        BigDecimal proteinAdherencePct = foodTrackedDays > 0
                ? BigDecimal.valueOf(proteinMetDays).multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(foodTrackedDays), 1, RoundingMode.HALF_UP)
                : null;
        String proteinTrendDirection = calculateTrend(dailyProteinValues);

        ProteinMetricsDto proteinMetrics = ProteinMetricsDto.builder()
                .averageIntakeG(avgProtein)
                .baselineGoalG(defaultProteinGoal)
                .isHistoricalGoal(hasHistoricalGoalSnapshot)
                .daysMeetingGoal(proteinMetDays)
                .daysBelowGoal(proteinBelowDays)
                .daysAboveGoal(proteinAboveDays)
                .goalAdherencePercentage(proteinAdherencePct)
                .trendDirection(proteinTrendDirection)
                .build();

        // Calorie metrics
        BigDecimal avgCalories = foodTrackedDays > 0
                ? sumCalories.divide(BigDecimal.valueOf(foodTrackedDays), 0, RoundingMode.HALF_UP)
                : null;
        BigDecimal calorieAdherencePct = foodTrackedDays > 0
                ? BigDecimal.valueOf(calorieOnTargetDays).multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(foodTrackedDays), 1, RoundingMode.HALF_UP)
                : null;
        String calorieTrend = determineCalorieTrend(avgCalories, defaultCalorieGoal);

        CalorieMetricsDto calorieMetrics = CalorieMetricsDto.builder()
                .averageIntakeKcal(avgCalories)
                .baselineGoalKcal(defaultCalorieGoal)
                .isHistoricalGoal(hasHistoricalGoalSnapshot)
                .daysOnTarget(calorieOnTargetDays)
                .daysBelowGoal(calorieBelowDays)
                .daysAboveGoal(calorieAboveDays)
                .goalAdherencePercentage(calorieAdherencePct)
                .trendDirection(calorieTrend)
                .build();

        // Hydration metrics
        Integer avgWater = waterTrackedDays > 0 ? totalWaterMl / waterTrackedDays : null;
        BigDecimal waterAdherencePct = waterTrackedDays > 0
                ? BigDecimal.valueOf(waterMetDays).multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(waterTrackedDays), 1, RoundingMode.HALF_UP)
                : null;
        String hydrationStatus = avgWater != null && avgWater >= (defaultWaterGoal * 0.9) ? "OPTIMAL" : "DEFICIT";
        if (waterTrackedDays == 0) hydrationStatus = "INSUFFICIENT_DATA";

        HydrationMetricsDto hydrationMetrics = HydrationMetricsDto.builder()
                .averageWaterMl(avgWater)
                .baselineGoalMl(defaultWaterGoal)
                .isHistoricalGoal(hasHistoricalGoalSnapshot)
                .daysMeetingGoal(waterMetDays)
                .daysTracked(waterTrackedDays)
                .goalAdherencePercentage(waterAdherencePct)
                .status(hydrationStatus)
                .build();

        // Weight metrics
        BigDecimal startWeight = null;
        BigDecimal latestWeight = null;
        BigDecimal weightChange = null;
        LocalDate startDate = null;
        LocalDate latestDate = null;
        boolean hasSufficientWeight = weightList.size() >= 2;
        String weightTrend = "INCONCLUSIVE";

        if (!weightList.isEmpty()) {
            WeightEntry first = weightList.get(0);
            WeightEntry last = weightList.get(weightList.size() - 1);
            startWeight = first.getWeightKg();
            latestWeight = last.getWeightKg();
            startDate = first.getEntryDate();
            latestDate = last.getEntryDate();

            if (hasSufficientWeight) {
                weightChange = latestWeight.subtract(startWeight).setScale(2, RoundingMode.HALF_UP);
                if (weightChange.compareTo(new BigDecimal("0.3")) > 0) {
                    weightTrend = "INCREASING";
                } else if (weightChange.compareTo(new BigDecimal("-0.3")) < 0) {
                    weightTrend = "DECREASING";
                } else {
                    weightTrend = "STABLE";
                }
            }
        }

        WeightMetricsDto weightMetrics = WeightMetricsDto.builder()
                .measurementCount(weightList.size())
                .weightUnit(weightUnit)
                .startWeight(startWeight)
                .latestWeight(latestWeight)
                .weightChange(weightChange)
                .startDate(startDate)
                .latestDate(latestDate)
                .hasSufficientMeasurements(hasSufficientWeight)
                .trendDirection(weightTrend)
                .build();

        VerifiedMetricsDto verifiedMetrics = VerifiedMetricsDto.builder()
                .protein(proteinMetrics)
                .calories(calorieMetrics)
                .hydration(hydrationMetrics)
                .weight(weightMetrics)
                .build();

        // Deterministic pattern detection
        String dateRangeLabel = String.format("%s to %s",
                from.format(DateTimeFormatter.ofPattern("MMM d")),
                to.format(DateTimeFormatter.ofPattern("MMM d, yyyy")));

        List<DetectedPatternDto> patterns = detectPatterns(
                from, to, dateRangeLabel, totalDays, foodTrackedDays, waterTrackedDays,
                proteinMetrics, calorieMetrics, hydrationMetrics, weightMetrics);

        // Gemini AI Recommendations
        AiImprovementSummaryDto aiSummary = generateAiSummary(
                hasSufficientData, verifiedMetrics, dataCoverage, patterns, fitnessContextNote);

        return ProgressImprovementResponse.builder()
                .fromDate(from)
                .toDate(to)
                .totalDaysInRange(totalDays)
                .dataCoverage(dataCoverage)
                .verifiedMetrics(verifiedMetrics)
                .dailyTrends(dailyPoints)
                .detectedPatterns(patterns)
                .aiSummary(aiSummary)
                .build();
    }

    private List<DetectedPatternDto> detectPatterns(
            LocalDate from, LocalDate to, String dateRangeLabel, int totalDays,
            int foodTrackedDays, int waterTrackedDays,
            ProteinMetricsDto protein, CalorieMetricsDto calories,
            HydrationMetricsDto hydration, WeightMetricsDto weight) {

        List<DetectedPatternDto> patterns = new ArrayList<>();

        if (foodTrackedDays < 2) {
            patterns.add(DetectedPatternDto.builder()
                    .id("PATTERN_INSUFFICIENT_LOGGING")
                    .category("CONSISTENCY")
                    .type("OBSERVATION")
                    .title("Limited Data Logged")
                    .description(String.format("You logged meals on %d of %d days. At least 2-3 logged days are required to identify confident dietary patterns.", foodTrackedDays, totalDays))
                    .dateRange(dateRangeLabel)
                    .supportingMetric(String.format("%d logged days", foodTrackedDays))
                    .recordedDaysCount(foodTrackedDays)
                    .limitations("Missing days are excluded from averages rather than assumed to be zero.")
                    .build());
            return patterns;
        }

        // 1. Protein Patterns
        if (protein.getGoalAdherencePercentage() != null) {
            double adherence = protein.getGoalAdherencePercentage().doubleValue();
            if (adherence >= 75.0) {
                patterns.add(DetectedPatternDto.builder()
                        .id("PATTERN_PROTEIN_CONSISTENTLY_MET")
                        .category("PROTEIN")
                        .type("POSITIVE")
                        .title("High Protein Consistency")
                        .description(String.format("You hit or exceeded your daily protein goal on %d of %d tracked days (%.1f%%).",
                                protein.getDaysMeetingGoal(), foodTrackedDays, adherence))
                        .dateRange(dateRangeLabel)
                        .supportingMetric(String.format("Avg %sg/day vs %sg target", protein.getAverageIntakeG(), protein.getBaselineGoalG()))
                        .recordedDaysCount(foodTrackedDays)
                        .limitations(String.format("Observed over %d logged days.", foodTrackedDays))
                        .build());
            } else if (adherence < 50.0 && protein.getDaysBelowGoal() >= 2) {
                patterns.add(DetectedPatternDto.builder()
                        .id("PATTERN_PROTEIN_DEFICIT_FREQUENT")
                        .category("PROTEIN")
                        .type("OPPORTUNITY")
                        .title("Protein Intake Frequently Below Target")
                        .description(String.format("Protein intake fell below your target on %d of %d tracked days. Your average intake was %sg/day.",
                                protein.getDaysBelowGoal(), foodTrackedDays, protein.getAverageIntakeG()))
                        .dateRange(dateRangeLabel)
                        .supportingMetric(String.format("%sg avg vs %sg target (-%sg)",
                                protein.getAverageIntakeG(), protein.getBaselineGoalG(),
                                protein.getBaselineGoalG().subtract(protein.getAverageIntakeG())))
                        .recordedDaysCount(foodTrackedDays)
                        .limitations(String.format("Based on %d tracked days.", foodTrackedDays))
                        .build());
            } else {
                patterns.add(DetectedPatternDto.builder()
                        .id("PATTERN_PROTEIN_MODERATE")
                        .category("PROTEIN")
                        .type("OBSERVATION")
                        .title("Moderate Protein Adherence")
                        .description(String.format("You met your protein target on %d of %d tracked days (%.1f%%).",
                                protein.getDaysMeetingGoal(), foodTrackedDays, adherence))
                        .dateRange(dateRangeLabel)
                        .supportingMetric(String.format("Avg %sg/day", protein.getAverageIntakeG()))
                        .recordedDaysCount(foodTrackedDays)
                        .limitations("Adherence was calculated exclusively on logged days.")
                        .build());
            }

            if ("IMPROVING".equals(protein.getTrendDirection())) {
                patterns.add(DetectedPatternDto.builder()
                        .id("PATTERN_PROTEIN_TREND_IMPROVING")
                        .category("PROTEIN")
                        .type("POSITIVE")
                        .title("Upward Protein Trajectory")
                        .description("Daily protein intake trended upward in the second half of this period compared to the first half.")
                        .dateRange(dateRangeLabel)
                        .supportingMetric("Upward intake trend")
                        .recordedDaysCount(foodTrackedDays)
                        .limitations("Trend reflects logged days only.")
                        .build());
            }
        }

        // 2. Calorie Patterns
        if (calories.getAverageIntakeKcal() != null && calories.getBaselineGoalKcal() != null) {
            BigDecimal goal = calories.getBaselineGoalKcal();
            BigDecimal avg = calories.getAverageIntakeKcal();
            BigDecimal diff = avg.subtract(goal);

            if (diff.abs().compareTo(goal.multiply(new BigDecimal("0.10"))) <= 0) {
                patterns.add(DetectedPatternDto.builder()
                        .id("PATTERN_CALORIES_BALANCED")
                        .category("CALORIES")
                        .type("POSITIVE")
                        .title("Balanced Energy Intake")
                        .description(String.format("Average intake of %,.0f kcal is within 10%% of your %,.0f kcal goal.", avg, goal))
                        .dateRange(dateRangeLabel)
                        .supportingMetric(String.format("%,.0f kcal avg (target: %,.0f kcal)", avg, goal))
                        .recordedDaysCount(foodTrackedDays)
                        .limitations(String.format("Calculated across %d logged days.", foodTrackedDays))
                        .build());
            } else if (diff.compareTo(BigDecimal.ZERO) > 0) {
                patterns.add(DetectedPatternDto.builder()
                        .id("PATTERN_CALORIES_SURPLUS")
                        .category("CALORIES")
                        .type("OPPORTUNITY")
                        .title("Consistent Caloric Surplus")
                        .description(String.format("Average recorded intake (%,.0f kcal) is +%,.0f kcal above your daily target.", avg, diff))
                        .dateRange(dateRangeLabel)
                        .supportingMetric(String.format("+%,.0f kcal/day surplus", diff))
                        .recordedDaysCount(foodTrackedDays)
                        .limitations("Based on days where meals were logged.")
                        .build());
            } else {
                patterns.add(DetectedPatternDto.builder()
                        .id("PATTERN_CALORIES_DEFICIT")
                        .category("CALORIES")
                        .type("OPPORTUNITY")
                        .title("Substantial Caloric Deficit")
                        .description(String.format("Average recorded intake (%,.0f kcal) is %,.0f kcal below your daily target.", avg, diff.abs()))
                        .dateRange(dateRangeLabel)
                        .supportingMetric(String.format("-%s kcal/day deficit", diff.abs()))
                        .recordedDaysCount(foodTrackedDays)
                        .limitations("Ensure days with light entries reflect complete logging.")
                        .build());
            }
        }

        // 3. Hydration Patterns
        if (waterTrackedDays >= 2) {
            if ("OPTIMAL".equals(hydration.getStatus())) {
                patterns.add(DetectedPatternDto.builder()
                        .id("PATTERN_HYDRATION_OPTIMAL")
                        .category("HYDRATION")
                        .type("POSITIVE")
                        .title("Consistent Hydration")
                        .description(String.format("Average hydration (%,d ml/day) meets your %,d ml daily water goal.",
                                hydration.getAverageWaterMl(), hydration.getBaselineGoalMl()))
                        .dateRange(dateRangeLabel)
                        .supportingMetric(String.format("%,d ml/day avg across %d logged days", hydration.getAverageWaterMl(), waterTrackedDays))
                        .recordedDaysCount(waterTrackedDays)
                        .limitations("Reflects days with recorded water entries.")
                        .build());
            } else {
                int waterDiff = hydration.getBaselineGoalMl() - (hydration.getAverageWaterMl() != null ? hydration.getAverageWaterMl() : 0);
                patterns.add(DetectedPatternDto.builder()
                        .id("PATTERN_HYDRATION_BELOW_GOAL")
                        .category("HYDRATION")
                        .type("OPPORTUNITY")
                        .title("Hydration Below Target")
                        .description(String.format("Water intake averaged %,d ml/day (%d ml below your %,d ml goal).",
                                hydration.getAverageWaterMl(), waterDiff, hydration.getBaselineGoalMl()))
                        .dateRange(dateRangeLabel)
                        .supportingMetric(String.format("-%d ml/day below goal", waterDiff))
                        .recordedDaysCount(waterTrackedDays)
                        .limitations("Based on recorded hydration entries.")
                        .build());
            }
        } else if (foodTrackedDays >= 3 && waterTrackedDays <= 1) {
            patterns.add(DetectedPatternDto.builder()
                    .id("PATTERN_HYDRATION_TRACKING_GAP")
                    .category("HYDRATION")
                    .type("OPPORTUNITY")
                    .title("Hydration Logging Incomplete")
                    .description(String.format("You logged meals on %d days but only tracked water on %d day(s). Consistent hydration logging helps evaluate fluid balance.",
                            foodTrackedDays, waterTrackedDays))
                    .dateRange(dateRangeLabel)
                    .supportingMetric(String.format("%d of %d days tracked water", waterTrackedDays, foodTrackedDays))
                    .recordedDaysCount(waterTrackedDays)
                    .limitations("Water intake was not recorded on most food-tracked days.")
                    .build());
        }

        // 4. Weight Patterns
        if (weight.isHasSufficientMeasurements()) {
            String dir = weight.getWeightChange().compareTo(BigDecimal.ZERO) > 0 ? "+" : "";
            patterns.add(DetectedPatternDto.builder()
                    .id("PATTERN_WEIGHT_TREND")
                    .category("WEIGHT")
                    .type("OBSERVATION")
                    .title(String.format("Weight Trend: %s", weight.getTrendDirection()))
                    .description(String.format("Weight changed by %s%s %s across %d measurements between %s and %s.",
                            dir, weight.getWeightChange(), weight.getWeightUnit(),
                            weight.getMeasurementCount(), weight.getStartDate(), weight.getLatestDate()))
                    .dateRange(dateRangeLabel)
                    .supportingMetric(String.format("%s%s %s change", dir, weight.getWeightChange(), weight.getWeightUnit()))
                    .recordedDaysCount(weight.getMeasurementCount())
                    .limitations("Weight fluctuation can include fluid shifts and glycogen storage.")
                    .build());
        }

        // 5. Logging Consistency Patterns
        int loggingPct = (foodTrackedDays * 100) / totalDays;
        if (loggingPct >= 70) {
            patterns.add(DetectedPatternDto.builder()
                    .id("PATTERN_STRONG_LOGGING_HABIT")
                    .category("CONSISTENCY")
                    .type("POSITIVE")
                    .title("Strong Food Logging Consistency")
                    .description(String.format("You logged nutrition on %d of %d days (%d%%). High tracking consistency provides reliable performance insights.",
                            foodTrackedDays, totalDays, loggingPct))
                    .dateRange(dateRangeLabel)
                    .supportingMetric(String.format("%d%% logging rate", loggingPct))
                    .recordedDaysCount(foodTrackedDays)
                    .limitations("Consistent tracking improves analytical confidence.")
                    .build());
        } else if (loggingPct < 50) {
            patterns.add(DetectedPatternDto.builder()
                    .id("PATTERN_SPARSE_LOGGING")
                    .category("CONSISTENCY")
                    .type("OPPORTUNITY")
                    .title("Logging Gaps in Period")
                    .description(String.format("Nutrition was recorded on %d of %d days (%d%%). Tracking consecutive days will increase certainty in habit trends.",
                            foodTrackedDays, totalDays, loggingPct))
                    .dateRange(dateRangeLabel)
                    .supportingMetric(String.format("%d missing days", totalDays - foodTrackedDays))
                    .recordedDaysCount(foodTrackedDays)
                    .limitations("Untracked days are treated as missing data, not as fasting or skipped meals.")
                    .build());
        }

        return patterns;
    }

    private AiImprovementSummaryDto generateAiSummary(
            boolean hasSufficientData,
            VerifiedMetricsDto verifiedMetrics,
            DataCoverageDto dataCoverage,
            List<DetectedPatternDto> patterns,
            String fitnessContextNote) {

        String disclaimer = "General wellness and nutrition guidance only. Not medical diagnosis or treatment.";

        if (!hasSufficientData) {
            return AiImprovementSummaryDto.builder()
                    .status("INSUFFICIENT_DATA")
                    .statusMessage("Log meals for at least 2 to 3 days to unlock evidence-based AI recommendations.")
                    .executiveSummary("Personalized AI recommendations require sufficient recorded data to identify meaningful trends without making unfounded assumptions.")
                    .doingWellHighlights(List.of("You've started logging your nutrition data!"))
                    .recommendations(List.of())
                    .fitnessContextNote(fitnessContextNote)
                    .safetyDisclaimer(disclaimer)
                    .build();
        }

        if (!geminiClient.isConfigured()) {
            return AiImprovementSummaryDto.builder()
                    .status("UNAVAILABLE")
                    .statusMessage("Gemini AI integration is not configured on this server. Your verified metrics and detected patterns are displayed below.")
                    .executiveSummary("Verified statistical analysis completed successfully. AI synthesis is offline.")
                    .doingWellHighlights(extractDoingWellHighlightsFromPatterns(patterns))
                    .recommendations(List.of())
                    .fitnessContextNote(fitnessContextNote)
                    .safetyDisclaimer(disclaimer)
                    .build();
        }

        try {
            String prompt = buildGeminiPrompt(verifiedMetrics, dataCoverage, patterns, fitnessContextNote);
            String aiJsonText = geminiClient.generateStructuredTextEstimate(prompt);
            return parseAiSummary(aiJsonText, fitnessContextNote, disclaimer);
        } catch (AiServiceException e) {
            log.warn("Gemini service exception generating improvement recommendations: {}", e.getMessage());
            return AiImprovementSummaryDto.builder()
                    .status("UNAVAILABLE")
                    .statusMessage("AI recommendations are temporarily unavailable from the provider. Your verified metrics and detected patterns are displayed below.")
                    .executiveSummary("Statistical metrics and pattern detection completed successfully.")
                    .doingWellHighlights(extractDoingWellHighlightsFromPatterns(patterns))
                    .recommendations(List.of())
                    .fitnessContextNote(fitnessContextNote)
                    .safetyDisclaimer(disclaimer)
                    .build();
        } catch (Exception e) {
            log.error("Unexpected error in AI improvement summary generation: {}", e.getMessage(), e);
            return AiImprovementSummaryDto.builder()
                    .status("ERROR")
                    .statusMessage("An unexpected error occurred while generating AI recommendations. Your verified metrics remain accurate.")
                    .executiveSummary("Verified historical metrics and detected patterns are displayed.")
                    .doingWellHighlights(extractDoingWellHighlightsFromPatterns(patterns))
                    .recommendations(List.of())
                    .fitnessContextNote(fitnessContextNote)
                    .safetyDisclaimer(disclaimer)
                    .build();
        }
    }

    private String buildGeminiPrompt(
            VerifiedMetricsDto metrics,
            DataCoverageDto coverage,
            List<DetectedPatternDto> patterns,
            String fitnessContext) {

        StringBuilder sb = new StringBuilder();
        sb.append("You are an evidence-based clinical nutrition & wellness specialist for the Prota platform.\n");
        sb.append("Analyze the user's authentic verified metrics and detected patterns below.\n");
        sb.append("RULES:\n");
        sb.append("1. Ground every claim STRICTLY in the supplied numbers. Do NOT invent figures or unrecorded behaviors.\n");
        sb.append("2. Missing days mean UNTRACKED, NOT zero food or failure.\n");
        sb.append("3. Provide 2 to 4 actionable, practical recommendations. Prioritize high-impact nutritional habits.\n");
        sb.append("4. Avoid extreme restriction (<1200 kcal/day) or unsafe supplement advice.\n");
        sb.append("5. Tone: encouraging, evidence-based, non-judgmental, constructive.\n");
        sb.append("6. Return ONLY a valid JSON object matching the requested schema.\n\n");

        sb.append("VERIFIED METRICS SUMMARY:\n");
        sb.append(String.format("- Total calendar days: %d, Tracked days: %d (%.1f%% consistency)\n",
                coverage.getTotalCalendarDays(), coverage.getFoodTrackedDays(), coverage.getTrackingConsistencyPercentage()));

        ProteinMetricsDto p = metrics.getProtein();
        if (p.getAverageIntakeG() != null) {
            sb.append(String.format("- Protein: Avg %sg/day vs %sg target (Adherence: %.1f%% on %d/%d days, Trend: %s)\n",
                    p.getAverageIntakeG(), p.getBaselineGoalG(), p.getGoalAdherencePercentage(),
                    p.getDaysMeetingGoal(), coverage.getFoodTrackedDays(), p.getTrendDirection()));
        }

        CalorieMetricsDto c = metrics.getCalories();
        if (c.getAverageIntakeKcal() != null) {
            sb.append(String.format("- Calories: Avg %,.0f kcal/day vs %,.0f kcal target (Trend: %s)\n",
                    c.getAverageIntakeKcal(), c.getBaselineGoalKcal(), c.getTrendDirection()));
        }

        HydrationMetricsDto h = metrics.getHydration();
        if (h.getAverageWaterMl() != null) {
            sb.append(String.format("- Hydration: Avg %,d ml/day vs %,d ml target (%d days logged, Status: %s)\n",
                    h.getAverageWaterMl(), h.getBaselineGoalMl(), h.getDaysTracked(), h.getStatus()));
        }

        WeightMetricsDto w = metrics.getWeight();
        if (w.isHasSufficientMeasurements()) {
            sb.append(String.format("- Weight: %s %s change across %d measurements (Trend: %s)\n",
                    w.getWeightChange(), w.getWeightUnit(), w.getMeasurementCount(), w.getTrendDirection()));
        }

        if (fitnessContext != null && !fitnessContext.isBlank()) {
            sb.append(String.format("- Active Fitness Context: %s\n", fitnessContext));
        }

        sb.append("\nDETECTED PATTERNS:\n");
        for (DetectedPatternDto pat : patterns) {
            sb.append(String.format("- [%s] %s: %s (Metric: %s)\n",
                    pat.getType(), pat.getTitle(), pat.getDescription(), pat.getSupportingMetric()));
        }

        sb.append("\nOUTPUT JSON SCHEMA:\n");
        sb.append("{\n");
        sb.append("  \"executiveSummary\": \"2-3 sentence overview of nutrition consistency and key trajectory\",\n");
        sb.append("  \"doingWellHighlights\": [\"1-3 specific factual achievements based on positive patterns\"],\n");
        sb.append("  \"recommendations\": [\n");
        sb.append("    {\n");
        sb.append("      \"id\": \"REC-1\",\n");
        sb.append("      \"title\": \"Concise title\",\n");
        sb.append("      \"observation\": \"What data pattern motivated this\",\n");
        sb.append("      \"practicalAction\": \"Concrete realistic step to take\",\n");
        sb.append("      \"expectedImprovement\": \"Why this helps and expected benefit\",\n");
        sb.append("      \"uncertaintyOrLimitation\": \"Any data limitation or caveat\",\n");
        sb.append("      \"category\": \"PROTEIN\" | \"CALORIES\" | \"HYDRATION\" | \"HABITS\"\n");
        sb.append("    }\n");
        sb.append("  ]\n");
        sb.append("}\n");

        return sb.toString();
    }

    private AiImprovementSummaryDto parseAiSummary(String jsonText, String fitnessContextNote, String safetyDisclaimer) {
        try {
            JsonNode root = objectMapper.readTree(jsonText);
            String executiveSummary = root.hasNonNull("executiveSummary")
                    ? root.get("executiveSummary").asText()
                    : "Your nutritional analysis has been synthesized based on your logged records.";

            List<String> highlights = new ArrayList<>();
            if (root.has("doingWellHighlights") && root.get("doingWellHighlights").isArray()) {
                for (JsonNode h : root.get("doingWellHighlights")) {
                    if (h.isTextual() && !h.asText().isBlank()) {
                        highlights.add(h.asText());
                    }
                }
            }

            List<AiRecommendationDto> recommendations = new ArrayList<>();
            if (root.has("recommendations") && root.get("recommendations").isArray()) {
                int index = 1;
                for (JsonNode r : root.get("recommendations")) {
                    String title = r.hasNonNull("title") ? r.get("title").asText() : "Nutrition Recommendation";
                    String obs = r.hasNonNull("observation") ? r.get("observation").asText() : "Observed from intake trends";
                    String act = r.hasNonNull("practicalAction") ? r.get("practicalAction").asText() : "Consider adjusting daily meal distribution";
                    String exp = r.hasNonNull("expectedImprovement") ? r.get("expectedImprovement").asText() : "Improved adherence to nutritional goals";
                    String unc = r.hasNonNull("uncertaintyOrLimitation") ? r.get("uncertaintyOrLimitation").asText() : "Reflects logged days only";
                    String cat = r.hasNonNull("category") ? r.get("category").asText() : "HABITS";

                    recommendations.add(AiRecommendationDto.builder()
                            .id("REC-" + (index++))
                            .title(title)
                            .observation(obs)
                            .practicalAction(act)
                            .expectedImprovement(exp)
                            .uncertaintyOrLimitation(unc)
                            .category(cat)
                            .build());
                }
            }

            return AiImprovementSummaryDto.builder()
                    .status("SUCCESS")
                    .statusMessage("AI recommendations successfully generated from verified data.")
                    .executiveSummary(executiveSummary)
                    .doingWellHighlights(highlights)
                    .recommendations(recommendations)
                    .fitnessContextNote(fitnessContextNote)
                    .safetyDisclaimer(safetyDisclaimer)
                    .build();

        } catch (Exception e) {
            log.warn("Failed to parse Gemini recommendations JSON: {}", e.getMessage());
            return AiImprovementSummaryDto.builder()
                    .status("ERROR")
                    .statusMessage("Failed to parse AI provider recommendation structure.")
                    .executiveSummary("Statistical analysis is complete.")
                    .doingWellHighlights(List.of())
                    .recommendations(List.of())
                    .fitnessContextNote(fitnessContextNote)
                    .safetyDisclaimer(safetyDisclaimer)
                    .build();
        }
    }

    private List<String> extractDoingWellHighlightsFromPatterns(List<DetectedPatternDto> patterns) {
        List<String> list = new ArrayList<>();
        for (DetectedPatternDto p : patterns) {
            if ("POSITIVE".equals(p.getType())) {
                list.add(p.getTitle() + ": " + p.getDescription());
            }
        }
        if (list.isEmpty()) {
            list.add("You are maintaining consistent tracking in Prota.");
        }
        return list;
    }

    private String calculateTrend(List<BigDecimal> values) {
        if (values.size() < 4) {
            return "INSUFFICIENT_DATA";
        }
        int half = values.size() / 2;
        BigDecimal sumFirst = BigDecimal.ZERO;
        for (int i = 0; i < half; i++) {
            sumFirst = sumFirst.add(values.get(i));
        }
        BigDecimal avgFirst = sumFirst.divide(BigDecimal.valueOf(half), 1, RoundingMode.HALF_UP);

        BigDecimal sumSecond = BigDecimal.ZERO;
        int secondCount = values.size() - half;
        for (int i = half; i < values.size(); i++) {
            sumSecond = sumSecond.add(values.get(i));
        }
        BigDecimal avgSecond = sumSecond.divide(BigDecimal.valueOf(secondCount), 1, RoundingMode.HALF_UP);

        BigDecimal diff = avgSecond.subtract(avgFirst);
        if (diff.compareTo(new BigDecimal("5.0")) >= 0) {
            return "IMPROVING";
        } else if (diff.compareTo(new BigDecimal("-5.0")) <= 0) {
            return "DECLINING";
        } else {
            return "STABLE";
        }
    }

    private String determineCalorieTrend(BigDecimal avgCalories, BigDecimal goalCalories) {
        if (avgCalories == null || goalCalories == null) {
            return "INSUFFICIENT_DATA";
        }
        BigDecimal ratio = avgCalories.divide(goalCalories, 2, RoundingMode.HALF_UP);
        if (ratio.compareTo(new BigDecimal("1.10")) > 0) {
            return "SURPLUS";
        } else if (ratio.compareTo(new BigDecimal("0.85")) < 0) {
            return "DEFICIT";
        } else {
            return "BALANCED";
        }
    }

    private String buildLimitationsNote(int totalDays, int foodDays, int waterDays, int weightDays) {
        List<String> parts = new ArrayList<>();
        if (foodDays < totalDays) {
            parts.add(String.format("%d of %d days had meal records", foodDays, totalDays));
        }
        if (waterDays < foodDays) {
            parts.add(String.format("hydration logged on %d days", waterDays));
        }
        if (weightDays < 2) {
            parts.add(String.format("%d weight entry recorded", weightDays));
        }
        if (parts.isEmpty()) {
            return "Complete data logged across this period.";
        }
        return "Data coverage: " + String.join(", ", parts) + ". Missing days are excluded from averages.";
    }

    private String buildFitnessContextNote(List<DietPlan> dietPlans, List<WorkoutPlan> workoutPlans) {
        StringBuilder sb = new StringBuilder();
        if (!workoutPlans.isEmpty()) {
            WorkoutPlan wp = workoutPlans.get(0);
            sb.append(String.format("Active %s (%d days/week %s)",
                    wp.getTitle(), wp.getDaysPerWeek(), wp.getSplitType()));
        }
        if (!dietPlans.isEmpty()) {
            DietPlan dp = dietPlans.get(0);
            if (sb.length() > 0) sb.append(" | ");
            sb.append(String.format("Saved Diet: %s", dp.getTitle()));
        }
        return sb.toString();
    }
}
