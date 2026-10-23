package com.prota.ai.service;

import com.prota.ai.client.GeminiClient;
import com.prota.dto.request.AiChatMessageDto;
import com.prota.dto.request.AiChatRequest;
import com.prota.dto.response.AiChatResponse;
import com.prota.dto.response.GroundedNutritionSummaryDto;
import com.prota.exception.AiQuotaExceededException;
import com.prota.exception.AiServiceException;
import com.prota.exception.AiServiceUnavailableException;
import com.prota.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class AiChatService {

    private static final Logger log = LoggerFactory.getLogger(AiChatService.class);

    private final GeminiClient geminiClient;
    private final GroundedNutritionContextService contextService;

    public AiChatService(GeminiClient geminiClient, GroundedNutritionContextService contextService) {
        this.geminiClient = geminiClient;
        this.contextService = contextService;
    }

    public AiChatResponse processChat(AiChatRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();

        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return AiChatResponse.builder()
                    .status("ERROR")
                    .errorCode("INVALID_INPUT")
                    .message("Message cannot be empty.")
                    .timestamp(Instant.now())
                    .build();
        }

        String sanitizedQuery = contextService.sanitizeUntrustedText(request.getMessage().trim());

        // Build authoritative grounded context for this user
        GroundedNutritionContextService.GroundedContextResult contextResult =
                contextService.buildGroundedContext(userId, request.getContextDate(), sanitizedQuery);

        GroundedNutritionSummaryDto summary = contextResult.summaryDto();

        // Check if Gemini is configured
        if (!geminiClient.isConfigured()) {
            return AiChatResponse.builder()
                    .status("UNAVAILABLE")
                    .errorCode("AI_NOT_CONFIGURED")
                    .message("The AI Nutrition Assistant is currently unconfigured because no GEMINI_API_KEY environment variable is set on the server. Your factual dashboard metrics remain fully operational.")
                    .groundedSummary(summary)
                    .suggestions(generateFallbackSuggestions(summary))
                    .timestamp(Instant.now())
                    .build();
        }

        try {
            // Defend conversation history against prompt injection delimiters
            List<AiChatMessageDto> sanitizedHistory = new ArrayList<>();
            if (request.getConversationHistory() != null) {
                for (AiChatMessageDto msg : request.getConversationHistory()) {
                    if (msg.getContent() != null && !msg.getContent().isBlank()) {
                        sanitizedHistory.add(AiChatMessageDto.builder()
                                .role(msg.getRole())
                                .content(contextService.sanitizeUntrustedText(msg.getContent()))
                                .build());
                    }
                }
            }

            String aiReply = geminiClient.generateChatCompletion(
                    contextResult.systemInstruction(),
                    sanitizedHistory,
                    sanitizedQuery
            );

            return AiChatResponse.builder()
                    .reply(aiReply)
                    .status("SUCCESS")
                    .groundedSummary(summary)
                    .suggestions(generateContextualSuggestions(summary))
                    .timestamp(Instant.now())
                    .build();

        } catch (AiQuotaExceededException e) {
            log.warn("Gemini quota reached for user {}", userId);
            return AiChatResponse.builder()
                    .status("RATE_LIMITED")
                    .errorCode("AI_QUOTA_EXCEEDED")
                    .message(e.getMessage())
                    .groundedSummary(summary)
                    .suggestions(generateFallbackSuggestions(summary))
                    .timestamp(Instant.now())
                    .build();
        } catch (AiServiceUnavailableException e) {
            return AiChatResponse.builder()
                    .status("UNAVAILABLE")
                    .errorCode(e.getErrorCode())
                    .message(e.getMessage())
                    .groundedSummary(summary)
                    .timestamp(Instant.now())
                    .build();
        } catch (AiServiceException e) {
            log.error("AI service error for user {}: {}", userId, e.getMessage());
            return AiChatResponse.builder()
                    .status("ERROR")
                    .errorCode(e.getErrorCode())
                    .message(e.getMessage())
                    .groundedSummary(summary)
                    .timestamp(Instant.now())
                    .build();
        } catch (Exception e) {
            log.error("Unexpected error in AI chat service: {}", e.getMessage());
            return AiChatResponse.builder()
                    .status("ERROR")
                    .errorCode("INTERNAL_AI_ERROR")
                    .message("An unexpected error occurred while communicating with the AI assistant.")
                    .groundedSummary(summary)
                    .timestamp(Instant.now())
                    .build();
        }
    }

    private List<String> generateContextualSuggestions(GroundedNutritionSummaryDto summary) {
        List<String> suggestions = new ArrayList<>();
        if (summary != null) {
            if (summary.getProteinRemainingG() != null && summary.getProteinRemainingG() > 0) {
                suggestions.add(String.format("What can I eat to get my remaining %dg of protein?", summary.getProteinRemainingG()));
            } else {
                suggestions.add("How does my protein intake compare to my goal?");
            }
            suggestions.add("Summarize my nutrition over the last seven days.");
            suggestions.add("What does my hydration history show?");
        } else {
            suggestions.add("How much protein have I consumed today?");
            suggestions.add("What could I eat to reach my protein goal?");
            suggestions.add("Summarize my nutrition over the last seven days.");
        }
        return suggestions;
    }

    private List<String> generateFallbackSuggestions(GroundedNutritionSummaryDto summary) {
        return List.of(
                "How much protein have I consumed today?",
                "What could I eat to reach my protein goal?",
                "Summarize my nutrition over the last seven days."
        );
    }
}
