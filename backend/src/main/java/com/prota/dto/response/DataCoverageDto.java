package com.prota.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataCoverageDto {

    private int totalCalendarDays;
    private int foodTrackedDays;
    private int waterTrackedDays;
    private int weightRecordedDays;
    private BigDecimal trackingConsistencyPercentage;
    private boolean hasSufficientData;
    private String limitationsNote;
}
