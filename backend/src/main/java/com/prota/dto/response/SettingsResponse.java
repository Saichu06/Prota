package com.prota.dto.response;

import com.prota.entity.enums.ThemePreference;
import com.prota.entity.enums.WeightUnit;
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
public class SettingsResponse {
    private UUID userId;
    private BigDecimal proteinGoalG;
    private BigDecimal calorieGoalKcal;
    private Integer waterGoalMl;
    private WeightUnit weightUnit;
    private String timezone;
    private ThemePreference theme;
    private Instant updatedAt;
}
