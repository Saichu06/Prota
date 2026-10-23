package com.prota.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDailyPoint {
    private LocalDate date;
    private BigDecimal proteinG;
    private BigDecimal proteinGoalG;
    private BigDecimal caloriesKcal;
    private BigDecimal calorieGoalKcal;
    private Integer waterMl;
    private BigDecimal weightKg;
    private boolean hasData;
    private int foodEntriesCount;
}
