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
public class DietPlanMealFoodDto {
    private String name;
    private BigDecimal quantity;
    private String quantityUnit;
    private BigDecimal proteinG;
    private BigDecimal caloriesKcal;
    private BigDecimal carbohydratesG;
    private BigDecimal fatG;
    private String notes;
}
