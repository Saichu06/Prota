package com.prota.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutSessionDto {
    private Integer dayNumber;
    private String dayName;
    private String sessionTitle;
    private Boolean isRestDay;
    private List<String> muscleGroupsEmphasized;
    private String warmupGuidance;
    private String cooldownGuidance;
    private List<WorkoutExerciseDto> exercises;
}
