package com.prota.dto.request;

import com.prota.entity.enums.MealType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateFoodEntryRequest {

    @NotBlank(message = "Food name is required")
    @Size(max = 200, message = "Food name must not exceed 200 characters")
    private String foodName;

    @NotNull(message = "Meal type is required")
    private MealType mealType;

    @Size(max = 40, message = "Category must not exceed 40 characters")
    private String category;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.001", message = "Quantity must be positive")
    private BigDecimal quantity;

    @NotBlank(message = "Quantity unit is required")
    @Size(max = 20, message = "Quantity unit must not exceed 20 characters")
    private String quantityUnit;

    @NotNull(message = "Protein is required")
    @DecimalMin(value = "0.00", message = "Protein must be non-negative")
    private BigDecimal proteinG;

    @DecimalMin(value = "0.00", message = "Calories must be non-negative")
    private BigDecimal caloriesKcal;

    @DecimalMin(value = "0.00", message = "Carbohydrates must be non-negative")
    private BigDecimal carbohydratesG;

    @DecimalMin(value = "0.00", message = "Fat must be non-negative")
    private BigDecimal fatG;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;

    @NotNull(message = "Consumption time is required")
    private Instant consumedAt;
}
