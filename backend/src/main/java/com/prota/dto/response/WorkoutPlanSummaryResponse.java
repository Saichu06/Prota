package com.prota.dto.response;

import com.prota.entity.enums.ExperienceLevel;
import com.prota.entity.enums.SplitType;
import com.prota.entity.enums.TrainingLocation;
import com.prota.entity.enums.WorkoutGoal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutPlanSummaryResponse {
    private UUID id;
    private String title;
    private WorkoutGoal primaryGoal;
    private TrainingLocation trainingLocation;
    private SplitType splitType;
    private Integer daysPerWeek;
    private Integer sessionDurationMins;
    private ExperienceLevel experienceLevel;
    private Instant createdAt;
    private Instant updatedAt;
}
