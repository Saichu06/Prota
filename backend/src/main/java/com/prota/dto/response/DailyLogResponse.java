package com.prota.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyLogResponse {
    private UUID id;
    private LocalDate logDate;
    private String timezone;
    private BigDecimal proteinGoalG;
    private BigDecimal calorieGoalKcal;
    private Integer waterGoalMl;
    private BigDecimal consumedProteinG;
    private BigDecimal consumedCaloriesKcal;
    private BigDecimal consumedCarbohydratesG;
    private BigDecimal consumedFatG;
    private boolean hasIncompleteCalories;
    private BigDecimal proteinRemainingG;
    private BigDecimal proteinCompletionPercentage;
    private Integer consumedWaterMl;
    private BigDecimal recordedWeightKg;
    private List<FoodEntryResponse> foodEntries;
}
