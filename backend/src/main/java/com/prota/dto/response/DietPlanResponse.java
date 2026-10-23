package com.prota.dto.response;

import com.prota.entity.enums.DietGoal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DietPlanResponse {
    private UUID id;
    private String title;
    private DietGoal goal;
    private BigDecimal dailyCaloriesKcal;
    private BigDecimal dailyProteinG;
    private BigDecimal dailyCarbohydratesG;
    private BigDecimal dailyFatG;
    private DietPlanDetailDto planDetail;
    private Instant createdAt;
    private Instant updatedAt;
}
