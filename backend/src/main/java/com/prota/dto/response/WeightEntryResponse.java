package com.prota.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeightEntryResponse {
    private UUID id;
    private BigDecimal weightKg;
    private LocalDate entryDate;
    private String notes;
    private Instant recordedAt;
    private Instant createdAt;
}
