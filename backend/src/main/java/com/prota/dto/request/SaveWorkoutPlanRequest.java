package com.prota.dto.request;

import com.prota.dto.response.WorkoutPlanDetailDto;
import com.prota.entity.enums.ExperienceLevel;
import com.prota.entity.enums.SplitType;
import com.prota.entity.enums.TrainingLocation;
import com.prota.entity.enums.WorkoutGoal;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveWorkoutPlanRequest {

    @NotBlank(message = "Plan title is required")
    @Size(max = 200, message = "Plan title cannot exceed 200 characters")
    private String title;

    @NotNull(message = "Primary goal is required")
    private WorkoutGoal primaryGoal;

    @NotNull(message = "Training location is required")
    private TrainingLocation trainingLocation;

    @NotNull(message = "Split type is required")
    private SplitType splitType;

    @NotNull(message = "Days per week is required")
    @Min(value = 1, message = "Days per week must be between 1 and 7")
    @Max(value = 7, message = "Days per week must be between 1 and 7")
    private Integer daysPerWeek;

    @NotNull(message = "Session duration is required")
    @Min(value = 15, message = "Session duration must be at least 15 minutes")
    @Max(value = 180, message = "Session duration must be at most 180 minutes")
    private Integer sessionDurationMins;

    @NotNull(message = "Experience level is required")
    private ExperienceLevel experienceLevel;

    @NotNull(message = "Plan detail is required")
    private WorkoutPlanDetailDto planDetail;
}
