package com.prota.dto.request;

import com.prota.entity.enums.ExperienceLevel;
import com.prota.entity.enums.SplitType;
import com.prota.entity.enums.TrainingLocation;
import com.prota.entity.enums.WorkoutGoal;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutPlanGenerateRequest {

    @Min(value = 14, message = "Age must be at least 14")
    @Max(value = 120, message = "Age must be at most 120")
    private Integer age;

    @Min(value = 80, message = "Height must be at least 80 cm")
    @Max(value = 250, message = "Height must be at most 250 cm")
    private Double heightCm;

    @Min(value = 25, message = "Weight must be at least 25 kg")
    @Max(value = 350, message = "Weight must be at most 350 kg")
    private Double weightKg;

    @NotNull(message = "Experience level is required")
    private ExperienceLevel experienceLevel;

    @NotNull(message = "Primary workout goal is required")
    private WorkoutGoal primaryGoal;

    private WorkoutGoal secondaryGoal;

    @Size(max = 20, message = "Target muscle groups list cannot exceed 20 items")
    private List<String> targetMuscleGroups;

    @NotNull(message = "Training location is required")
    private TrainingLocation trainingLocation;

    @Size(max = 30, message = "Available equipment list cannot exceed 30 items")
    private List<String> availableEquipment;

    @Size(max = 500, message = "Equipment restrictions cannot exceed 500 characters")
    private String equipmentRestrictions;

    @NotNull(message = "Days per week is required")
    @Min(value = 1, message = "Days per week must be between 1 and 7")
    @Max(value = 7, message = "Days per week must be between 1 and 7")
    private Integer daysPerWeek;

    @NotNull(message = "Split type is required")
    private SplitType splitType;

    @NotNull(message = "Session duration is required")
    @Min(value = 15, message = "Session duration must be at least 15 minutes")
    @Max(value = 180, message = "Session duration must be at most 180 minutes")
    private Integer sessionDurationMins;

    private List<String> preferredTrainingDays;

    private List<String> preferredExerciseTypes;

    private List<String> exercisesToAvoid;

    @Size(max = 1000, message = "Injuries or limitations cannot exceed 1000 characters")
    private String injuriesOrLimitations;

    @Size(max = 500, message = "Recovery preferences cannot exceed 500 characters")
    private String recoveryPreferences;
}
