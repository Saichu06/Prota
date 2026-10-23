package com.prota.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifiedMetricsDto {

    private ProteinMetricsDto protein;
    private CalorieMetricsDto calories;
    private HydrationMetricsDto hydration;
    private WeightMetricsDto weight;
}
