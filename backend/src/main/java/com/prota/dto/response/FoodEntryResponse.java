package com.prota.dto.response;

import com.prota.entity.enums.MealType;
import com.prota.entity.enums.NutritionSource;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoodEntryResponse {
    private UUID id;
    private UUID dailyLogId;
    private UUID savedFoodId;
    private UUID aiEstimateId;
    private String foodName;
    private MealType mealType;
    private String category;
    private BigDecimal quantity;
    private String quantityUnit;
    private BigDecimal proteinG;
    private BigDecimal caloriesKcal;
    private BigDecimal carbohydratesG;
    private BigDecimal fatG;
    private NutritionSource nutritionSource;
    private String notes;
    private Instant consumedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
