package com.prota.controller;

import com.prota.dto.request.DietPlanGenerateRequest;
import com.prota.dto.request.SaveDietPlanRequest;
import com.prota.dto.response.DietPlanDetailDto;
import com.prota.dto.response.DietPlanResponse;
import com.prota.dto.response.DietPlanSummaryResponse;
import com.prota.service.DietPlanService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/diet-plans")
public class DietPlanController {

    private final DietPlanService dietPlanService;

    public DietPlanController(DietPlanService dietPlanService) {
        this.dietPlanService = dietPlanService;
    }

    @PostMapping("/generate")
    public ResponseEntity<DietPlanDetailDto> generatePlan(@Valid @RequestBody DietPlanGenerateRequest request) {
        DietPlanDetailDto planDraft = dietPlanService.generatePlan(request);
        return ResponseEntity.ok(planDraft);
    }

    @PostMapping
    public ResponseEntity<DietPlanResponse> savePlan(@Valid @RequestBody SaveDietPlanRequest request) {
        DietPlanResponse saved = dietPlanService.savePlan(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<DietPlanSummaryResponse>> getSavedPlans() {
        List<DietPlanSummaryResponse> plans = dietPlanService.getSavedPlans();
        return ResponseEntity.ok(plans);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DietPlanResponse> getSavedPlanById(@PathVariable UUID id) {
        DietPlanResponse plan = dietPlanService.getSavedPlanById(id);
        return ResponseEntity.ok(plan);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSavedPlan(@PathVariable UUID id) {
        dietPlanService.deleteSavedPlan(id);
        return ResponseEntity.noContent().build();
    }
}
