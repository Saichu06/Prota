package com.prota.dto.request;

import com.prota.entity.enums.MealType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiTextEstimateRequest {

    @NotBlank(message = "Meal description cannot be empty")
    @Size(max = 1000, message = "Meal description must not exceed 1000 characters")
    private String description;

    private MealType mealType;

    private LocalDate date;
}
