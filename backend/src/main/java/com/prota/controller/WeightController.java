package com.prota.controller;

import com.prota.dto.request.CreateWeightEntryRequest;
import com.prota.dto.response.WeightEntryResponse;
import com.prota.service.WeightService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/weight")
public class WeightController {

    private final WeightService weightService;

    public WeightController(WeightService weightService) {
        this.weightService = weightService;
    }

    @PostMapping
    public ResponseEntity<WeightEntryResponse> createWeightEntry(@Valid @RequestBody CreateWeightEntryRequest request) {
        WeightEntryResponse response = weightService.createWeightEntry(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/daily")
    public ResponseEntity<List<WeightEntryResponse>> getDailyWeightEntries(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<WeightEntryResponse> responses = weightService.getDailyWeightEntries(date);
        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWeightEntry(@PathVariable UUID id) {
        weightService.deleteWeightEntry(id);
        return ResponseEntity.noContent().build();
    }
}
