package com.prota.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WaterEntryResponse {
    private UUID id;
    private LocalDate entryDate;
    private Integer amountMl;
    private Instant consumedAt;
    private Instant createdAt;
}
