package com.prota.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiFoodEstimateResponse {
    private UUID estimateId;
    private String status;
    private String errorCode;
    private String message;
    private List<AiFoodItemDto> items;
}
