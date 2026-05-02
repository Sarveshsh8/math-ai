package com.mathai.dto;

import java.time.Instant;

public record MeResponse(
    String id,
    String email,
    String displayName,
    boolean subscribed,
    boolean hasAccess,
    Instant trialEndsAt
) {}
