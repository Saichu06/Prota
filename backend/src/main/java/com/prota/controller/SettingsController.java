package com.prota.controller;

import com.prota.dto.request.UpdateSettingsRequest;
import com.prota.dto.response.SettingsResponse;
import com.prota.service.SettingsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/settings")
public class SettingsController {

    private final SettingsService settingsService;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping
    public ResponseEntity<SettingsResponse> getSettings() {
        SettingsResponse settings = settingsService.getSettings();
        return ResponseEntity.ok(settings);
    }

    @PatchMapping
    public ResponseEntity<SettingsResponse> updateSettings(@Valid @RequestBody UpdateSettingsRequest request) {
        SettingsResponse updated = settingsService.updateSettings(request);
        return ResponseEntity.ok(updated);
    }
}
