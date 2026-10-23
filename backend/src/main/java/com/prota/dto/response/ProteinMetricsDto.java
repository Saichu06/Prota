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
public class ProteinMetricsDto {

    private BigDecimal averageIntakeG;
    private BigDecimal baselineGoalG;
    private boolean isHistoricalGoal;
    private int daysMeetingGoal;
    private int daysBelowGoal;
    private int daysAboveGoal;
    private BigDecimal goalAdherencePercentage;
    private String trendDirection; // IMPROVING, DECLINING, STABLE, INSUFFICIENT_DATA
}
