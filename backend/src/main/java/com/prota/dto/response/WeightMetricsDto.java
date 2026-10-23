package com.prota.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeightMetricsDto {

    private int measurementCount;
    private String weightUnit;
    private BigDecimal startWeight;
    private BigDecimal latestWeight;
    private BigDecimal weightChange;
    private LocalDate startDate;
    private LocalDate latestDate;
    private boolean hasSufficientMeasurements;
    private String trendDirection; // DECREASING, INCREASING, STABLE, INCONCLUSIVE
}
