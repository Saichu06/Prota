package com.prota.dto.response;

import com.prota.entity.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String fullName;
    private String email;
    private UserStatus status;
    private Instant emailVerifiedAt;
    private String profilePictureUrl;
    private Instant createdAt;
}
