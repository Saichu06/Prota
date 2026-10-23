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
public class WorkoutExerciseDto {
    private String name;
    private String primaryTarget;
    private List<String> secondaryTargets;
    private Integer sets;
    private String repsOrDuration;
    private Integer restSeconds;
    private String equipment;
    private String instructions;
    private String alternativeExercise;
}
