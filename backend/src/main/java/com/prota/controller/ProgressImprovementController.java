package com.prota.controller;

import com.prota.dto.response.ProgressImprovementResponse;
import com.prota.service.ProgressImprovementService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
public class ProgressImprovementController {

    private final ProgressImprovementService progressImprovementService;

    public ProgressImprovementController(ProgressImprovementService progressImprovementService) {
        this.progressImprovementService = progressImprovementService;
    }

    @GetMapping({"/progress/improvement", "/analytics/improve-progress"})
    public ResponseEntity<ProgressImprovementResponse> getProgressImprovement(
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        ProgressImprovementResponse response = progressImprovementService.analyzeProgress(from, to);
        return ResponseEntity.ok(response);
    }
}
