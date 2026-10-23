package com.prota.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportPreviewResponse {
    private ReportType reportType;
    private LocalDate startDate;
    private LocalDate endDate;
    private int totalDays;
    private int recordedDays;
    private int totalFoodEntries;
    private BigDecimal averageDailyProteinG;
    private BigDecimal averageDailyCaloriesKcal;
    private Integer totalHydrationMl;
    private int weightMeasurementsCount;
    private BigDecimal weightChangeKg;
    private String weightTrendNote;
    private boolean canGenerate;
    private String summaryMessage;
    private List<PlanSummaryItem> availableDietPlans;
    private List<PlanSummaryItem> availableWorkoutPlans;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanSummaryItem {
        private UUID id;
        private String title;
        private String createdAt;
        private String details;
    }
}
