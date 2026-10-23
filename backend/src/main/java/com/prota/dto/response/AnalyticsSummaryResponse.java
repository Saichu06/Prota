package com.prota.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsSummaryResponse {
    private LocalDate fromDate;
    private LocalDate toDate;
    private int totalDaysInRange;
    private int trackedDaysCount;
    private BigDecimal averageProteinG;
    private BigDecimal averageCaloriesKcal;
    private BigDecimal proteinGoalAdherencePercentage;
    private BigDecimal calorieGoalAdherencePercentage;
    private int totalWaterMl;
    private Integer averageWaterMl;
    private BigDecimal startWeightKg;
    private BigDecimal latestWeightKg;
    private BigDecimal weightChangeKg;
    private List<AnalyticsDailyPoint> dailyData;
    private List<String> insights;
}
