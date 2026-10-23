package com.prota.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedFoodResponse {
    private UUID id;
    private String name;
    private String brand;
    private BigDecimal servingQuantity;
    private String servingUnit;
    private BigDecimal proteinG;
    private BigDecimal caloriesKcal;
    private BigDecimal carbohydratesG;
    private BigDecimal fatG;
    private String externalSource;
    private Instant createdAt;
}
