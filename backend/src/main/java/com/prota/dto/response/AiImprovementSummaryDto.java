package com.prota.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiImprovementSummaryDto {

    private String status; // SUCCESS, UNAVAILABLE, ERROR, INSUFFICIENT_DATA
    private String statusMessage;
    private String executiveSummary;

    @Builder.Default
    private List<String> doingWellHighlights = new ArrayList<>();

    @Builder.Default
    private List<AiRecommendationDto> recommendations = new ArrayList<>();

    private String fitnessContextNote;
    private String safetyDisclaimer;
}
