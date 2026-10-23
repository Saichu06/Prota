package com.prota.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWeightEntryRequest {

    @NotNull(message = "Weight is required")
    @DecimalMin(value = "0.100", message = "Weight must be greater than 0")
    @DecimalMax(value = "700.000", message = "Weight cannot exceed 700 kg")
    private BigDecimal weightKg;

    @NotNull(message = "Entry date is required")
    private LocalDate entryDate;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    private Instant recordedAt;
}
