package com.prota.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResponse {
    private String reply;
    private String status; // "SUCCESS", "UNAVAILABLE", "ERROR", "RATE_LIMITED"
    private String errorCode;
    private String message;
    private GroundedNutritionSummaryDto groundedSummary;
    private List<String> suggestions;
    @Builder.Default
    private String disclaimer = "General nutritional guidance only. Not medical advice. Consult a registered dietitian or physician for medical concerns.";
    private Instant timestamp;
}
