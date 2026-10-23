package com.prota.controller;

import com.prota.dto.request.CreateSavedFoodRequest;
import com.prota.dto.response.SavedFoodResponse;
import com.prota.service.SavedFoodService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/saved-foods")
public class SavedFoodController {

    private final SavedFoodService savedFoodService;

    public SavedFoodController(SavedFoodService savedFoodService) {
        this.savedFoodService = savedFoodService;
    }

    @PostMapping
    public ResponseEntity<SavedFoodResponse> createSavedFood(@Valid @RequestBody CreateSavedFoodRequest request) {
        SavedFoodResponse response = savedFoodService.createSavedFood(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<SavedFoodResponse>> searchSavedFoods(
            @RequestParam(value = "query", required = false) String query) {
        List<SavedFoodResponse> responses = savedFoodService.searchSavedFoods(query);
        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSavedFood(@PathVariable UUID id) {
        savedFoodService.deleteSavedFood(id);
        return ResponseEntity.noContent().build();
    }
}
