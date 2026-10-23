package com.prota.dto.request;

import com.prota.entity.enums.DietGoal;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DietPlanGenerateRequest {

    @NotNull(message = "Age is required")
    @Min(value = 14, message = "Age must be at least 14")
    @Max(value = 120, message = "Age must be at most 120")
    private Integer age;

    @NotBlank(message = "Gender/Sex is required for metabolic rate calculation")
    private String gender; // MALE, FEMALE, OTHER

    @NotNull(message = "Height is required")
    @DecimalMin(value = "50.0", message = "Height must be at least 50 cm")
    @DecimalMax(value = "260.0", message = "Height must be at most 260 cm")
    private BigDecimal heightCm;

    @NotNull(message = "Current weight is required")
    @DecimalMin(value = "20.0", message = "Current weight must be at least 20 kg")
    @DecimalMax(value = "400.0", message = "Current weight must be at most 400 kg")
    private BigDecimal currentWeightKg;

    @DecimalMin(value = "20.0", message = "Target weight must be at least 20 kg")
    @DecimalMax(value = "400.0", message = "Target weight must be at most 400 kg")
    private BigDecimal targetWeightKg;

    @NotBlank(message = "Activity level is required")
    private String activityLevel; // SEDENTARY, LIGHTLY_ACTIVE, MODERATELY_ACTIVE, VERY_ACTIVE, EXTRA_ACTIVE

    @NotNull(message = "Diet goal is required")
    private DietGoal goal;

    @Min(value = 1, message = "Timeframe must be at least 1 week")
    @Max(value = 104, message = "Timeframe must be at most 104 weeks")
    private Integer timeframeWeeks;

    @Min(value = 0, message = "Training frequency cannot be negative")
    @Max(value = 14, message = "Training frequency cannot exceed 14 sessions per week")
    private Integer trainingFrequencyPerWeek;

    @Min(value = 2, message = "Meal frequency must be between 2 and 6 meals per day")
    @Max(value = 6, message = "Meal frequency must be between 2 and 6 meals per day")
    private Integer mealFrequency;

    private String dietaryPreference; // OMNIVORE, VEGETARIAN, VEGAN, EGGETARIAN

    private List<String> allergies;

    private List<String> dislikedFoods;

    private String preferredCuisine; // Indian, Continental, Mediterranean, Asian, etc.

    private String budget; // BUDGET, MODERATE, PREMIUM

    private String cookingTime; // MINIMAL, MODERATE, ELABORATE

    @Size(max = 500, message = "Medical conditions/notes must not exceed 500 characters")
    private String medicalConditionsOrNotes;
}
