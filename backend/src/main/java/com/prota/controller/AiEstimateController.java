package com.prota.controller;

import com.prota.dto.request.AiTextEstimateRequest;
import com.prota.dto.response.AiFoodEstimateResponse;
import com.prota.service.AiEstimateService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/ai/estimate")
public class AiEstimateController {

    private final AiEstimateService aiEstimateService;

    public AiEstimateController(AiEstimateService aiEstimateService) {
        this.aiEstimateService = aiEstimateService;
    }

    @PostMapping("/text")
    public ResponseEntity<AiFoodEstimateResponse> estimateFromText(@Valid @RequestBody AiTextEstimateRequest request) {
        AiFoodEstimateResponse response = aiEstimateService.estimateFromText(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/image")
    public ResponseEntity<AiFoodEstimateResponse> estimateFromImage(@RequestParam("image") MultipartFile image) {
        AiFoodEstimateResponse response = aiEstimateService.estimateFromImage(image);
        return ResponseEntity.ok(response);
    }
}
