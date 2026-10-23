package com.prota.exception;

public class AiQuotaExceededException extends AiServiceException {
    public AiQuotaExceededException(String message) {
        super("AI_QUOTA_EXCEEDED", message);
    }
}
