package com.mathai.service;

import com.mathai.dto.AuthResponse;
import com.mathai.dto.LoginRequest;
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
        if (userRepository.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }
        User user = new User(req.email(), passwordEncoder.encode(req.password()), req.displayName());
        userRepository.save(user);
        String token = jwtUtil.generate(user.getEmail(), user.getId());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getDisplayName());
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String token = jwtUtil.generate(user.getEmail(), user.getId());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getDisplayName());
    }
}
