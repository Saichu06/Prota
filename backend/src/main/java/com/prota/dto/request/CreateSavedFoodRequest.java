package com.prota.dto.request;

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

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSavedFoodRequest {

    @NotBlank(message = "Food name is required")
    @Size(max = 200, message = "Food name cannot exceed 200 characters")
    private String name;

    @Size(max = 120, message = "Brand cannot exceed 120 characters")
    private String brand;

    @NotNull(message = "Serving quantity is required")
    @DecimalMin(value = "0.001", message = "Serving quantity must be greater than zero")
    private BigDecimal servingQuantity;

    @NotBlank(message = "Serving unit is required")
    @Size(max = 20, message = "Serving unit cannot exceed 20 characters")
    private String servingUnit;

    @NotNull(message = "Protein is required")
    @DecimalMin(value = "0.00", message = "Protein must be non-negative")
    private BigDecimal proteinG;

    @DecimalMin(value = "0.00", message = "Calories must be non-negative")
    private BigDecimal caloriesKcal;

    @DecimalMin(value = "0.00", message = "Carbohydrates must be non-negative")
    private BigDecimal carbohydratesG;

    @DecimalMin(value = "0.00", message = "Fat must be non-negative")
    private BigDecimal fatG;
}
