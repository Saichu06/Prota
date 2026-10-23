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
public class DietPlanMealDto {
    private String mealName;
    private String timing;
    private List<DietPlanMealFoodDto> foods;
    private BigDecimal totalCaloriesKcal;
    private BigDecimal totalProteinG;
    private BigDecimal totalCarbohydratesG;
    private BigDecimal totalFatG;
}
