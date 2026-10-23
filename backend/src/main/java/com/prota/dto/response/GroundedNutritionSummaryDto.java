package com.prota.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroundedNutritionSummaryDto {
    private String date;
    private Integer proteinGoalG;
    private Integer calorieGoalKcal;
    private Integer waterGoalMl;
    private String weightUnit;
    private BigDecimal consumedProteinG;
    private BigDecimal consumedCaloriesKcal;
    private Integer consumedWaterMl;
    private BigDecimal recordedWeightKg;
    private Integer proteinRemainingG;
    private Double proteinCompletionPercentage;
    private List<String> loggedFoodItems;
    private boolean hasRecords;
}
