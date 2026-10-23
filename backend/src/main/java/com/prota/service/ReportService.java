package com.prota.service;

import com.prota.dto.report.CsvExportType;
import com.prota.dto.report.ReportPreviewResponse;
import com.prota.dto.report.ReportType;
import com.prota.entity.*;
import com.prota.exception.BadRequestException;
import com.prota.exception.ResourceNotFoundException;
import com.prota.repo.*;
import com.prota.security.SecurityUtils;
import com.prota.service.report.CsvReportGenerator;
import com.prota.service.report.PdfReportGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final DailyLogRepository dailyLogRepository;
    private final FoodEntryRepository foodEntryRepository;
    private final WaterEntryRepository waterEntryRepository;
    private final WeightEntryRepository weightEntryRepository;
    private final DietPlanRepository dietPlanRepository;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final UserSettingRepository userSettingRepository;
    private final UserRepository userRepository;
    private final PdfReportGenerator pdfReportGenerator;
    private final CsvReportGenerator csvReportGenerator;

    public ReportService(
            DailyLogRepository dailyLogRepository,
            FoodEntryRepository foodEntryRepository,
            WaterEntryRepository waterEntryRepository,
            WeightEntryRepository weightEntryRepository,
            DietPlanRepository dietPlanRepository,
            WorkoutPlanRepository workoutPlanRepository,
            UserSettingRepository userSettingRepository,
            UserRepository userRepository,
            PdfReportGenerator pdfReportGenerator,
            CsvReportGenerator csvReportGenerator
    ) {
        this.dailyLogRepository = dailyLogRepository;
        this.foodEntryRepository = foodEntryRepository;
        this.waterEntryRepository = waterEntryRepository;
        this.weightEntryRepository = weightEntryRepository;
        this.dietPlanRepository = dietPlanRepository;
        this.workoutPlanRepository = workoutPlanRepository;
        this.userSettingRepository = userSettingRepository;
        this.userRepository = userRepository;
        this.pdfReportGenerator = pdfReportGenerator;
        this.csvReportGenerator = csvReportGenerator;
    }

    @Transactional(readOnly = true)
    public ReportPreviewResponse getReportPreview(ReportType reportType, LocalDate startDate, LocalDate endDate, UUID planId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        LocalDate today = LocalDate.now();

        if (reportType == null) {
            reportType = ReportType.DAILY_NUTRITION;
        }

        LocalDate effectiveStart = startDate != null ? startDate : today;
        LocalDate effectiveEnd = endDate != null ? endDate : today;

        switch (reportType) {
            case DAILY_NUTRITION -> effectiveEnd = effectiveStart;
            case WEEKLY_NUTRITION -> {
                if (endDate == null) effectiveEnd = today;
                effectiveStart = effectiveEnd.minusDays(6);
            }
            case MONTHLY_NUTRITION -> {
                if (endDate == null) effectiveEnd = today;
                effectiveStart = effectiveEnd.minusDays(29);
            }
            case CUSTOM_RANGE, WEIGHT_PROGRESS -> {
                if (effectiveStart.isAfter(effectiveEnd)) {
                    LocalDate tmp = effectiveStart;
                    effectiveStart = effectiveEnd;
                    effectiveEnd = tmp;
                }
                long days = ChronoUnit.DAYS.between(effectiveStart, effectiveEnd);
                if (days > 366) {
                    throw new BadRequestException("Export date range cannot exceed 366 days (requested " + days + " days)");
                }
            }
            case SAVED_DIET_PLAN, SAVED_WORKOUT_PLAN -> {
                // Plans don't require date spans
            }
        }

        // Available Plans List for dropdowns
        List<DietPlan> dietPlans = dietPlanRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<WorkoutPlan> workoutPlans = workoutPlanRepository.findByUserIdOrderByCreatedAtDesc(userId);

        List<ReportPreviewResponse.PlanSummaryItem> availableDiet = dietPlans.stream()
                .map(p -> ReportPreviewResponse.PlanSummaryItem.builder()
                        .id(p.getId())
                        .title(p.getTitle())
                        .createdAt(p.getCreatedAt() != null ? p.getCreatedAt().toString().substring(0, 10) : "")
                        .details(p.getDailyCaloriesKcal().setScale(0, RoundingMode.HALF_UP) + " kcal, " +
                                p.getDailyProteinG().setScale(0, RoundingMode.HALF_UP) + "g protein")
                        .build())
                .collect(Collectors.toList());

        List<ReportPreviewResponse.PlanSummaryItem> availableWorkout = workoutPlans.stream()
                .map(p -> ReportPreviewResponse.PlanSummaryItem.builder()
                        .id(p.getId())
                        .title(p.getTitle())
                        .createdAt(p.getCreatedAt() != null ? p.getCreatedAt().toString().substring(0, 10) : "")
                        .details(p.getSplitType().name() + " (" + p.getDaysPerWeek() + " days/wk)")
                        .build())
                .collect(Collectors.toList());

        if (reportType == ReportType.SAVED_DIET_PLAN) {
            boolean hasPlans = !dietPlans.isEmpty();
            return ReportPreviewResponse.builder()
                    .reportType(reportType)
                    .canGenerate(hasPlans)
                    .summaryMessage(hasPlans ? "Ready to export saved diet plan." : "No saved diet plans exist. Generate and save a plan first.")
                    .availableDietPlans(availableDiet)
                    .availableWorkoutPlans(availableWorkout)
                    .build();
        }

        if (reportType == ReportType.SAVED_WORKOUT_PLAN) {
            boolean hasPlans = !workoutPlans.isEmpty();
            return ReportPreviewResponse.builder()
                    .reportType(reportType)
                    .canGenerate(hasPlans)
                    .summaryMessage(hasPlans ? "Ready to export saved workout plan." : "No saved workout plans exist. Generate and save a plan first.")
                    .availableDietPlans(availableDiet)
                    .availableWorkoutPlans(availableWorkout)
                    .build();
        }

        // Fetch logs for nutrition & weight reports
        List<DailyLog> dailyLogs = dailyLogRepository.findByUserIdAndLogDateBetweenOrderByLogDateAsc(userId, effectiveStart, effectiveEnd);
        List<FoodEntry> foodEntries = foodEntryRepository.findByUserIdAndDateRange(userId, effectiveStart, effectiveEnd);
        List<WaterEntry> waterEntries = waterEntryRepository.findByUserIdAndEntryDateBetweenOrderByEntryDateAscConsumedAtAsc(userId, effectiveStart, effectiveEnd);
        List<WeightEntry> weightEntries = weightEntryRepository.findByUserIdAndEntryDateBetweenOrderByEntryDateAscRecordedAtAsc(userId, effectiveStart, effectiveEnd);

        int totalDays = (int) ChronoUnit.DAYS.between(effectiveStart, effectiveEnd) + 1;
        Set<LocalDate> datesWithFood = foodEntries.stream()
                .map(fe -> fe.getDailyLog().getLogDate())
                .collect(Collectors.toSet());
        int recordedDays = datesWithFood.size();

        BigDecimal sumProtein = foodEntries.stream()
                .map(FoodEntry::getProteinG)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal sumCalories = foodEntries.stream()
                .map(FoodEntry::getCaloriesKcal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avgProtein = recordedDays > 0 ? sumProtein.divide(BigDecimal.valueOf(recordedDays), 1, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal avgCalories = recordedDays > 0 ? sumCalories.divide(BigDecimal.valueOf(recordedDays), 0, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        int totalWater = waterEntries.stream()
                .mapToInt(WaterEntry::getAmountMl)
                .sum();

        BigDecimal weightChange = null;
        String weightTrendNote = "No weight records in this range.";
        if (weightEntries.size() >= 2) {
            weightChange = weightEntries.get(weightEntries.size() - 1).getWeightKg()
                    .subtract(weightEntries.get(0).getWeightKg())
                    .setScale(2, RoundingMode.HALF_UP);
            String sign = weightChange.compareTo(BigDecimal.ZERO) > 0 ? "+" : "";
            weightTrendNote = sign + weightChange + " kg net change over " + weightEntries.size() + " measurements.";
        } else if (weightEntries.size() == 1) {
            weightTrendNote = "1 measurement recorded (" + weightEntries.get(0).getWeightKg().setScale(1, RoundingMode.HALF_UP) + " kg). Minimum 2 required for trend.";
        }

        boolean canGenerate = true;
        String message;
        if (recordedDays == 0 && weightEntries.isEmpty() && waterEntries.isEmpty()) {
            message = "No records logged between " + effectiveStart + " and " + effectiveEnd + ". Report will reflect empty data.";
        } else {
            message = "Found " + foodEntries.size() + " food entries across " + recordedDays + " logged days.";
        }

        return ReportPreviewResponse.builder()
                .reportType(reportType)
                .startDate(effectiveStart)
                .endDate(effectiveEnd)
                .totalDays(totalDays)
                .recordedDays(recordedDays)
                .totalFoodEntries(foodEntries.size())
                .averageDailyProteinG(avgProtein)
                .averageDailyCaloriesKcal(avgCalories)
                .totalHydrationMl(totalWater)
                .weightMeasurementsCount(weightEntries.size())
                .weightChangeKg(weightChange)
                .weightTrendNote(weightTrendNote)
                .canGenerate(canGenerate)
                .summaryMessage(message)
                .availableDietPlans(availableDiet)
                .availableWorkoutPlans(availableWorkout)
                .build();
    }

    @Transactional(readOnly = true)
    public byte[] generatePdfReport(
            ReportType reportType,
            LocalDate startDate,
            LocalDate endDate,
            UUID planId,
            String weightUnit,
            boolean includeDetails
    ) {
        UUID userId = SecurityUtils.getCurrentUserId();
        String userEmail = SecurityUtils.getCurrentUserEmail();
        UserSetting settings = userSettingRepository.findByUserId(userId).orElse(null);
        LocalDate today = LocalDate.now();

        LocalDate effectiveStart = startDate != null ? startDate : today;
        LocalDate effectiveEnd = endDate != null ? endDate : today;

        try {
            switch (reportType) {
                case DAILY_NUTRITION -> {
                    DailyLog log = dailyLogRepository.findByUserIdAndLogDate(userId, effectiveStart).orElse(null);
                    List<FoodEntry> entries = foodEntryRepository.findByUserIdAndDateRange(userId, effectiveStart, effectiveStart);
                    List<WaterEntry> waters = waterEntryRepository.findByUserIdAndEntryDateOrderByConsumedAtDesc(userId, effectiveStart);
                    Integer waterTotal = waters.isEmpty() ? null : waters.stream().mapToInt(WaterEntry::getAmountMl).sum();
                    List<WeightEntry> weights = weightEntryRepository.findByUserIdAndEntryDateOrderByRecordedAtDesc(userId, effectiveStart);
                    BigDecimal weightKg = weights.isEmpty() ? null : weights.get(0).getWeightKg();

                    return pdfReportGenerator.generateDailyNutritionReport(
                            effectiveStart, log, entries, waterTotal, weightKg, settings, userEmail
                    );
                }
                case WEEKLY_NUTRITION -> {
                    if (endDate == null) effectiveEnd = today;
                    effectiveStart = effectiveEnd.minusDays(6);
                    return generateRangePdf("Weekly Nutrition Report", effectiveStart, effectiveEnd, userId, settings, userEmail, includeDetails);
                }
                case MONTHLY_NUTRITION -> {
                    if (endDate == null) effectiveEnd = today;
                    effectiveStart = effectiveEnd.minusDays(29);
                    return generateRangePdf("Monthly Nutrition Report", effectiveStart, effectiveEnd, userId, settings, userEmail, includeDetails);
                }
                case CUSTOM_RANGE -> {
                    if (effectiveStart.isAfter(effectiveEnd)) {
                        LocalDate tmp = effectiveStart;
                        effectiveStart = effectiveEnd;
                        effectiveEnd = tmp;
                    }
                    if (ChronoUnit.DAYS.between(effectiveStart, effectiveEnd) > 366) {
                        throw new BadRequestException("Export date range cannot exceed 366 days");
                    }
                    return generateRangePdf("Custom Date-Range Nutrition Report", effectiveStart, effectiveEnd, userId, settings, userEmail, includeDetails);
                }
                case WEIGHT_PROGRESS -> {
                    if (effectiveStart.isAfter(effectiveEnd)) {
                        LocalDate tmp = effectiveStart;
                        effectiveStart = effectiveEnd;
                        effectiveEnd = tmp;
                    }
                    List<WeightEntry> entries = weightEntryRepository.findByUserIdAndEntryDateBetweenOrderByEntryDateAscRecordedAtAsc(userId, effectiveStart, effectiveEnd);
                    return pdfReportGenerator.generateWeightReport(
                            effectiveStart, effectiveEnd, entries, weightUnit != null ? weightUnit : "KG", settings, userEmail
                    );
                }
                case SAVED_DIET_PLAN -> {
                    DietPlan plan;
                    if (planId != null) {
                        plan = dietPlanRepository.findByIdAndUserId(planId, userId)
                                .orElseThrow(() -> new ResourceNotFoundException("Saved diet plan not found: " + planId));
                    } else {
                        List<DietPlan> list = dietPlanRepository.findByUserIdOrderByCreatedAtDesc(userId);
                        if (list.isEmpty()) {
                            throw new BadRequestException("No saved diet plans found to export");
                        }
                        plan = list.get(0);
                    }
                    return pdfReportGenerator.generateSavedDietPlanReport(plan, settings, userEmail);
                }
                case SAVED_WORKOUT_PLAN -> {
                    WorkoutPlan plan;
                    if (planId != null) {
                        plan = workoutPlanRepository.findByIdAndUserId(planId, userId)
                                .orElseThrow(() -> new ResourceNotFoundException("Saved workout plan not found: " + planId));
                    } else {
                        List<WorkoutPlan> list = workoutPlanRepository.findByUserIdOrderByCreatedAtDesc(userId);
                        if (list.isEmpty()) {
                            throw new BadRequestException("No saved workout plans found to export");
                        }
                        plan = list.get(0);
                    }
                    return pdfReportGenerator.generateSavedWorkoutPlanReport(plan, settings, userEmail);
                }
                default -> throw new BadRequestException("Unsupported report type: " + reportType);
            }
        } catch (Exception e) {
            if (e instanceof RuntimeException re) throw re;
            throw new RuntimeException("Failed to generate PDF report: " + e.getMessage(), e);
        }
    }

    private byte[] generateRangePdf(
            String title,
            LocalDate start,
            LocalDate end,
            UUID userId,
            UserSetting settings,
            String userEmail,
            boolean includeDetails
    ) throws Exception {
        List<DailyLog> logs = dailyLogRepository.findByUserIdAndLogDateBetweenOrderByLogDateAsc(userId, start, end);
        List<FoodEntry> entries = foodEntryRepository.findByUserIdAndDateRange(userId, start, end);
        List<WaterEntry> waters = waterEntryRepository.findByUserIdAndEntryDateBetweenOrderByEntryDateAscConsumedAtAsc(userId, start, end);
        List<WeightEntry> weights = weightEntryRepository.findByUserIdAndEntryDateBetweenOrderByEntryDateAscRecordedAtAsc(userId, start, end);

        Map<LocalDate, List<FoodEntry>> foodByDate = entries.stream()
                .collect(Collectors.groupingBy(fe -> fe.getDailyLog().getLogDate()));

        Map<LocalDate, Integer> waterByDate = waters.stream()
                .collect(Collectors.groupingBy(WaterEntry::getEntryDate, Collectors.summingInt(WaterEntry::getAmountMl)));

        Map<LocalDate, BigDecimal> weightByDate = weights.stream()
                .collect(Collectors.toMap(WeightEntry::getEntryDate, WeightEntry::getWeightKg, (a, b) -> b, TreeMap::new));

        // Ensure every calendar date in range is represented in logs list
        Map<LocalDate, DailyLog> logsByDate = logs.stream()
                .collect(Collectors.toMap(DailyLog::getLogDate, l -> l, (a, b) -> a));

        List<DailyLog> fullLogList = new ArrayList<>();
        LocalDate cur = start;
        while (!cur.isAfter(end)) {
            DailyLog dl = logsByDate.get(cur);
            if (dl == null) {
                // Synthetic log container to ensure gaps are explicitly visible
                dl = DailyLog.builder()
                        .logDate(cur)
                        .proteinGoalG(settings != null ? settings.getProteinGoalG() : null)
                        .calorieGoalKcal(settings != null ? settings.getCalorieGoalKcal() : null)
                        .waterGoalMl(settings != null ? settings.getWaterGoalMl() : null)
                        .build();
            }
            fullLogList.add(dl);
            cur = cur.plusDays(1);
        }

        return pdfReportGenerator.generateRangeNutritionReport(
                title, start, end, fullLogList, foodByDate, waterByDate, weightByDate, settings, userEmail, includeDetails
        );
    }

    @Transactional(readOnly = true)
    public byte[] generateCsvExport(CsvExportType exportType, LocalDate startDate, LocalDate endDate) {
        UUID userId = SecurityUtils.getCurrentUserId();
        LocalDate today = LocalDate.now();

        LocalDate effectiveStart = startDate != null ? startDate : today.minusDays(29);
        LocalDate effectiveEnd = endDate != null ? endDate : today;

        if (effectiveStart.isAfter(effectiveEnd)) {
            LocalDate tmp = effectiveStart;
            effectiveStart = effectiveEnd;
            effectiveEnd = tmp;
        }

        if (ChronoUnit.DAYS.between(effectiveStart, effectiveEnd) > 366) {
            throw new BadRequestException("CSV export date range cannot exceed 366 days");
        }

        try {
            switch (exportType) {
                case FOOD_ENTRIES -> {
                    List<FoodEntry> entries = foodEntryRepository.findByUserIdAndDateRange(userId, effectiveStart, effectiveEnd);
                    return csvReportGenerator.generateFoodEntriesCsv(entries);
                }
                case DAILY_SUMMARIES -> {
                    List<DailyLog> logs = dailyLogRepository.findByUserIdAndLogDateBetweenOrderByLogDateAsc(userId, effectiveStart, effectiveEnd);
                    List<FoodEntry> entries = foodEntryRepository.findByUserIdAndDateRange(userId, effectiveStart, effectiveEnd);
                    List<WaterEntry> waters = waterEntryRepository.findByUserIdAndEntryDateBetweenOrderByEntryDateAscConsumedAtAsc(userId, effectiveStart, effectiveEnd);
                    List<WeightEntry> weights = weightEntryRepository.findByUserIdAndEntryDateBetweenOrderByEntryDateAscRecordedAtAsc(userId, effectiveStart, effectiveEnd);

                    Map<LocalDate, List<FoodEntry>> foodByDate = entries.stream()
                            .collect(Collectors.groupingBy(fe -> fe.getDailyLog().getLogDate()));

                    Map<LocalDate, Integer> waterByDate = waters.stream()
                            .collect(Collectors.groupingBy(WaterEntry::getEntryDate, Collectors.summingInt(WaterEntry::getAmountMl)));

                    Map<LocalDate, BigDecimal> weightByDate = weights.stream()
                            .collect(Collectors.toMap(WeightEntry::getEntryDate, WeightEntry::getWeightKg, (a, b) -> b));

                    return csvReportGenerator.generateDailySummariesCsv(logs, foodByDate, waterByDate, weightByDate);
                }
                case HYDRATION -> {
                    List<WaterEntry> waters = waterEntryRepository.findByUserIdAndEntryDateBetweenOrderByEntryDateAscConsumedAtAsc(userId, effectiveStart, effectiveEnd);
                    return csvReportGenerator.generateHydrationCsv(waters);
                }
                case WEIGHT -> {
                    List<WeightEntry> weights = weightEntryRepository.findByUserIdAndEntryDateBetweenOrderByEntryDateAscRecordedAtAsc(userId, effectiveStart, effectiveEnd);
                    return csvReportGenerator.generateWeightCsv(weights);
                }
                default -> throw new BadRequestException("Unsupported CSV export type: " + exportType);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate CSV export: " + e.getMessage(), e);
        }
    }
}
