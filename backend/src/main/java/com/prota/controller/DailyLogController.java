package com.prota.controller;

import com.prota.dto.request.CreateFoodEntryRequest;
import com.prota.dto.request.UpdateFoodEntryRequest;
import com.prota.dto.response.DailyLogResponse;
import com.prota.dto.response.FoodEntryResponse;
import com.prota.service.DailyFoodLoggingService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/logs/daily")
public class DailyLogController {

    private final DailyFoodLoggingService dailyFoodLoggingService;

    public DailyLogController(DailyFoodLoggingService dailyFoodLoggingService) {
        this.dailyFoodLoggingService = dailyFoodLoggingService;
    }

    @GetMapping
    public ResponseEntity<DailyLogResponse> getDailyLog(
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        DailyLogResponse response = dailyFoodLoggingService.getDailyLog(targetDate);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/range")
    public ResponseEntity<List<DailyLogResponse>> getDailyLogsRange(
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<DailyLogResponse> responses = dailyFoodLoggingService.getDailyLogsRange(from, to);
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/{date}/entries")
    public ResponseEntity<FoodEntryResponse> addFoodEntry(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Valid @RequestBody CreateFoodEntryRequest request) {
        FoodEntryResponse response = dailyFoodLoggingService.addFoodEntry(date, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{date}/entries/batch")
    public ResponseEntity<DailyLogResponse> addBatchFoodEntries(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Valid @RequestBody List<CreateFoodEntryRequest> requests) {
        DailyLogResponse response = dailyFoodLoggingService.addBatchFoodEntries(date, requests);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/entries/{id}")
    public ResponseEntity<FoodEntryResponse> getFoodEntry(@PathVariable UUID id) {
        FoodEntryResponse response = dailyFoodLoggingService.getFoodEntry(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/entries/{id}")
    public ResponseEntity<FoodEntryResponse> updateFoodEntry(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateFoodEntryRequest request) {
        FoodEntryResponse response = dailyFoodLoggingService.updateFoodEntry(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/entries/{id}")
    public ResponseEntity<Void> deleteFoodEntry(@PathVariable UUID id) {
        dailyFoodLoggingService.deleteFoodEntry(id);
        return ResponseEntity.noContent().build();
    }
}
