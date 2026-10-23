package com.prota.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetectedPatternDto {

    private String id;
    private String category; // PROTEIN, CALORIES, HYDRATION, WEIGHT, CONSISTENCY
    private String type;     // POSITIVE, OPPORTUNITY, OBSERVATION
    private String title;
    private String description;
    private String dateRange;
    private String supportingMetric;
    private int recordedDaysCount;
    private String limitations;
}
