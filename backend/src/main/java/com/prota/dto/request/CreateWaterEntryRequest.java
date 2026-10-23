package com.prota.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWaterEntryRequest {

    @NotNull(message = "Amount is required")
    @Min(value = 1, message = "Amount must be at least 1 ml")
    @Max(value = 20000, message = "Amount cannot exceed 20,000 ml")
    private Integer amountMl;

    @NotNull(message = "Entry date is required")
    private LocalDate entryDate;

    private Instant consumedAt;
}
