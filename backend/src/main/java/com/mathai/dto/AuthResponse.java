package com.mathai.dto;

public record AuthResponse(
    String token,
    String userId,
    String email,
    String displayName
) {}
