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
public class HydrationMetricsDto {

    private Integer averageWaterMl;
    private Integer baselineGoalMl;
    private boolean isHistoricalGoal;
    private int daysMeetingGoal;
    private int daysTracked;
    private BigDecimal goalAdherencePercentage;
    private String status; // OPTIMAL, DEFICIT, INSUFFICIENT_DATA
}
