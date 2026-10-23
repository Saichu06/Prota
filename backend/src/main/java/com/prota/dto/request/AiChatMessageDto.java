package com.prota.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatMessageDto {

    @NotBlank(message = "Role must be 'user' or 'model'")
    private String role; // "user" or "model"

    @NotBlank(message = "Content cannot be empty")
    @Size(max = 4000, message = "Content cannot exceed 4000 characters")
    private String content;
}
