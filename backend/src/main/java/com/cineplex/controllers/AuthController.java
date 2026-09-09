package com.cineplex.controllers;

import com.cineplex.dtos.auth.AuthResponse;
import com.cineplex.dtos.auth.LoginRequest;
import com.cineplex.dtos.auth.RegisterRequest;
import com.cineplex.dtos.auth.UpdateProfileRequest;
import com.cineplex.entities.User;
import com.cineplex.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(AuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .build());
    }

    @PutMapping("/profile")
    public ResponseEntity<AuthResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(authService.updateProfile(request));
    }
}
