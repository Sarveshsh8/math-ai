package com.mathai.service;

import com.mathai.dto.AuthResponse;
import com.mathai.dto.LoginRequest;
import com.mathai.dto.MeResponse;
import com.mathai.dto.RegisterRequest;
import com.mathai.model.User;
import com.mathai.repository.UserRepository;
import com.mathai.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Registration failed");
        }
        User user = new User(email, passwordEncoder.encode(req.password()), req.displayName().trim());
        userRepository.save(user);
        String token = jwtUtil.generate(user.getEmail(), user.getId());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getDisplayName());
    }

    public MeResponse me(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return new MeResponse(user.getId(), user.getEmail(), user.getDisplayName(),
            user.isSubscribed(), user.hasAccess(), user.getTrialEndsAt());
    }

    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String token = jwtUtil.generate(user.getEmail(), user.getId());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getDisplayName());
    }
}
