package com.prota.controller;

import com.prota.ai.service.AiChatService;
import com.prota.dto.request.AiChatRequest;
import com.prota.dto.response.AiChatResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ai/chat")
public class AiChatController {

    private final AiChatService aiChatService;

    public AiChatController(AiChatService aiChatService) {
        this.aiChatService = aiChatService;
    }

    @PostMapping
    public ResponseEntity<AiChatResponse> chat(@Valid @RequestBody AiChatRequest request) {
        AiChatResponse response = aiChatService.processChat(request);
        return ResponseEntity.ok(response);
    }
}
