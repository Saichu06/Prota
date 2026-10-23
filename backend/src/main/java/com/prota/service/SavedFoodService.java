package com.prota.service;

import com.prota.dto.request.CreateSavedFoodRequest;
import com.prota.dto.response.SavedFoodResponse;
import com.prota.entity.SavedFood;
import com.prota.entity.User;
import com.prota.exception.ResourceNotFoundException;
import com.prota.repo.SavedFoodRepository;
import com.prota.repo.UserRepository;
import com.prota.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class SavedFoodService {

    private final SavedFoodRepository savedFoodRepository;
    private final UserRepository userRepository;

    public SavedFoodService(SavedFoodRepository savedFoodRepository, UserRepository userRepository) {
        this.savedFoodRepository = savedFoodRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public SavedFoodResponse createSavedFood(CreateSavedFoodRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        SavedFood food = SavedFood.builder()
                .user(user)
                .name(request.getName().trim())
                .brand(request.getBrand() != null ? request.getBrand().trim() : null)
                .servingQuantity(request.getServingQuantity())
                .servingUnit(request.getServingUnit().trim())
                .proteinG(request.getProteinG())
                .caloriesKcal(request.getCaloriesKcal())
                .carbohydratesG(request.getCarbohydratesG())
                .fatG(request.getFatG())
                .externalSource("MANUAL")
                .build();

        SavedFood saved = savedFoodRepository.save(food);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<SavedFoodResponse> searchSavedFoods(String query) {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<SavedFood> foods;
        if (query != null && !query.trim().isEmpty()) {
            foods = savedFoodRepository.findByUserIdAndNameContainingIgnoreCaseOrderByNameAsc(userId, query.trim());
        } else {
            foods = savedFoodRepository.findByUserIdOrderByNameAsc(userId);
        }

        return foods.stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public void deleteSavedFood(UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        SavedFood food = savedFoodRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Saved food not found with id: " + id));

        savedFoodRepository.delete(food);
    }

    private SavedFoodResponse mapToResponse(SavedFood food) {
        return SavedFoodResponse.builder()
                .id(food.getId())
                .name(food.getName())
                .brand(food.getBrand())
                .servingQuantity(food.getServingQuantity())
                .servingUnit(food.getServingUnit())
                .proteinG(food.getProteinG())
                .caloriesKcal(food.getCaloriesKcal())
                .carbohydratesG(food.getCarbohydratesG())
                .fatG(food.getFatG())
                .externalSource(food.getExternalSource())
                .createdAt(food.getCreatedAt())
                .build();
    }
}
