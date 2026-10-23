package com.prota.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressImprovementResponse {

    private LocalDate fromDate;
    private LocalDate toDate;
    private int totalDaysInRange;
    private DataCoverageDto dataCoverage;
    private VerifiedMetricsDto verifiedMetrics;

    @Builder.Default
    private List<AnalyticsDailyPoint> dailyTrends = new ArrayList<>();

    @Builder.Default
    private List<DetectedPatternDto> detectedPatterns = new ArrayList<>();

    private AiImprovementSummaryDto aiSummary;
}
