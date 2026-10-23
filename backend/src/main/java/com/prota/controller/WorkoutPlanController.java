package com.prota.controller;

import com.prota.dto.request.SaveWorkoutPlanRequest;
import com.prota.dto.request.WorkoutPlanGenerateRequest;
import com.prota.dto.response.WorkoutPlanDetailDto;
import com.prota.dto.response.WorkoutPlanResponse;
import com.prota.dto.response.WorkoutPlanSummaryResponse;
import com.prota.service.WorkoutPlanService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/workout-plans")
public class WorkoutPlanController {

    private final WorkoutPlanService workoutPlanService;

    public WorkoutPlanController(WorkoutPlanService workoutPlanService) {
        this.workoutPlanService = workoutPlanService;
    }

    @PostMapping("/generate")
    public ResponseEntity<WorkoutPlanDetailDto> generatePlan(@Valid @RequestBody WorkoutPlanGenerateRequest request) {
        WorkoutPlanDetailDto planDraft = workoutPlanService.generatePlan(request);
        return ResponseEntity.ok(planDraft);
    }

    @PostMapping
    public ResponseEntity<WorkoutPlanResponse> savePlan(@Valid @RequestBody SaveWorkoutPlanRequest request) {
        WorkoutPlanResponse saved = workoutPlanService.savePlan(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<WorkoutPlanSummaryResponse>> getSavedPlans() {
        List<WorkoutPlanSummaryResponse> plans = workoutPlanService.getSavedPlans();
        return ResponseEntity.ok(plans);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkoutPlanResponse> getSavedPlanById(@PathVariable UUID id) {
        WorkoutPlanResponse plan = workoutPlanService.getSavedPlanById(id);
        return ResponseEntity.ok(plan);
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkoutPlanResponse> updateSavedPlan(
            @PathVariable UUID id,
            @Valid @RequestBody SaveWorkoutPlanRequest request) {
        WorkoutPlanResponse updated = workoutPlanService.updateSavedPlan(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSavedPlan(@PathVariable UUID id) {
        workoutPlanService.deleteSavedPlan(id);
        return ResponseEntity.noContent().build();
    }
}
