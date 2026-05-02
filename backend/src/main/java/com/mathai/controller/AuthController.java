package com.mathai.controller;

import com.mathai.dto.AuthResponse;
import com.mathai.dto.LoginRequest;
import com.mathai.dto.MeResponse;
import com.mathai.dto.RegisterRequest;
import com.mathai.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(userService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(userService.login(req));
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(org.springframework.security.core.Authentication auth) {
        return ResponseEntity.ok(userService.me(auth.getName()));
    }
}
