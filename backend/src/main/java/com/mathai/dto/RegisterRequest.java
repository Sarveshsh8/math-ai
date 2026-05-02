package com.mathai.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @Email(message = "Invalid email")
    @NotBlank
    @Size(max = 254)
    String email,

    @NotBlank
    @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
    String password,

    @NotBlank
    @Size(min = 1, max = 80)
    String displayName
) {}
