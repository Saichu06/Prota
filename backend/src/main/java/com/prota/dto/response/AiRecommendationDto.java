package com.prota.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiRecommendationDto {

    private String id;
    private String title;
    private String observation;
    private String practicalAction;
    private String expectedImprovement;
    private String uncertaintyOrLimitation;
    private String category; // PROTEIN, CALORIES, HYDRATION, HABITS
}
