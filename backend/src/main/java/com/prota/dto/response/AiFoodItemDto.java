package com.prota.dto.response;

import com.prota.entity.enums.MealType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiFoodItemDto {
    private String foodName;
    private MealType mealType;
    private BigDecimal quantity;
    private String quantityUnit;
    private BigDecimal proteinG;
    private BigDecimal caloriesKcal;
    private BigDecimal carbohydratesG;
    private BigDecimal fatG;
    private Double confidence;
    private String notes;
}
