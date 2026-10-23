package com.prota.dto.request;

import com.prota.dto.response.DietPlanDetailDto;
import com.prota.entity.enums.DietGoal;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveDietPlanRequest {

    @NotBlank(message = "Plan title is required")
    @Size(max = 200, message = "Plan title cannot exceed 200 characters")
    private String title;

    @NotNull(message = "Diet goal is required")
    private DietGoal goal;

    @NotNull(message = "Daily calories target is required")
    @DecimalMin(value = "500.0", message = "Daily calories must be at least 500 kcal")
    private BigDecimal dailyCaloriesKcal;

    @NotNull(message = "Daily protein target is required")
    @DecimalMin(value = "10.0", message = "Daily protein must be at least 10g")
    private BigDecimal dailyProteinG;

    private BigDecimal dailyCarbohydratesG;

    private BigDecimal dailyFatG;

    @NotNull(message = "Plan detail content is required")
    private DietPlanDetailDto planDetail;
}
