package com.prota.dto.request;

import com.prota.entity.enums.ThemePreference;
import com.prota.entity.enums.WeightUnit;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateSettingsRequest {

    @NotNull(message = "Protein goal is required")
    @DecimalMin(value = "1.00", message = "Protein goal must be at least 1 gram")
    private BigDecimal proteinGoalG;

    @Positive(message = "Calorie goal must be positive if provided")
    private BigDecimal calorieGoalKcal;

    @Positive(message = "Water goal must be positive if provided")
    private Integer waterGoalMl;

    @NotNull(message = "Weight unit is required")
    private WeightUnit weightUnit;

    private String timezone;

    @NotNull(message = "Theme preference is required")
    private ThemePreference theme;
}
