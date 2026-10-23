package com.prota.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    @com.fasterxml.jackson.annotation.JsonSetter
    public void setEmail(String email) {
        this.email = email != null ? email.trim() : null;
    }

    public static class LoginRequestBuilder {
        public LoginRequestBuilder email(String email) {
            this.email = email != null ? email.trim() : null;
            return this;
        }
    }
}
