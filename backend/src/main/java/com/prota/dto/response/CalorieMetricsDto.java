package com.prota.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalorieMetricsDto {

    private BigDecimal averageIntakeKcal;
    private BigDecimal baselineGoalKcal;
    private boolean isHistoricalGoal;
    private int daysOnTarget;
    private int daysBelowGoal;
    private int daysAboveGoal;
    private BigDecimal goalAdherencePercentage;
    private String trendDirection; // BALANCED, DEFICIT, SURPLUS, INSUFFICIENT_DATA
}
