package com.prota.exception;

public class AiServiceUnavailableException extends AiServiceException {
    public AiServiceUnavailableException(String message) {
        super("AI_NOT_CONFIGURED", message);
    }

    public AiServiceUnavailableException(String errorCode, String message) {
        super(errorCode, message);
    }
}
