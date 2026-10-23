package com.prota.dto.response;

import com.prota.entity.enums.DietGoal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DietPlanDetailDto {
    private String title;
    private DietGoal goal;
    private String creationDate;
    private Map<String, Object> userAssumptions;
    private BigDecimal dailyCaloriesKcal;
    private BigDecimal dailyProteinG;
    private BigDecimal dailyCarbohydratesG;
    private BigDecimal dailyFatG;
    private List<DietPlanMealDto> meals;
    private List<DietPlanSubstitutionDto> practicalSubstitutions;
    private List<DietPlanShoppingCategoryDto> shoppingList;
    private List<String> mealPrepTips;
    private String hydrationGuidance;
    private List<String> safetyNotes;
    private String disclaimer;
}
