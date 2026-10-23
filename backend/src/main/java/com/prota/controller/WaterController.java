package com.prota.controller;

import com.prota.dto.request.CreateWaterEntryRequest;
import com.prota.dto.response.WaterEntryResponse;
import com.prota.service.WaterService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/water")
public class WaterController {

    private final WaterService waterService;

    public WaterController(WaterService waterService) {
        this.waterService = waterService;
    }

    @PostMapping
    public ResponseEntity<WaterEntryResponse> createWaterEntry(@Valid @RequestBody CreateWaterEntryRequest request) {
        WaterEntryResponse response = waterService.createWaterEntry(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/daily")
    public ResponseEntity<List<WaterEntryResponse>> getDailyWaterEntries(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<WaterEntryResponse> responses = waterService.getDailyWaterEntries(date);
        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWaterEntry(@PathVariable UUID id) {
        waterService.deleteWaterEntry(id);
        return ResponseEntity.noContent().build();
    }
}
