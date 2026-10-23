package com.prota.dto.response;

import com.prota.entity.enums.ExperienceLevel;
import com.prota.entity.enums.SplitType;
import com.prota.entity.enums.TrainingLocation;
import com.prota.entity.enums.WorkoutGoal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutPlanDetailDto {
    private String title;
    private WorkoutGoal primaryGoal;
    private TrainingLocation trainingLocation;
    private ExperienceLevel experienceLevel;
    private SplitType splitType;
    private Integer daysPerWeek;
    private Integer sessionDurationMins;
    private String creationDate;
    private Map<String, Object> userAssumptions;
    private List<WorkoutSessionDto> sessions;
    private List<String> progressionTips;
    private List<String> recoveryAndDeloadTips;
    private List<String> safetyNotes;
    private String disclaimer;
}
