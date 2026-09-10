package com.cineplex.features.auth;

import com.cineplex.features.user.Role;
import com.cineplex.features.user.UserStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    @Builder.Default
    private String type = "Bearer";
    private UUID id;
    private String email;
    private String fullName;
    private String phone;
    private Role role;
    private UserStatus status;
    private java.time.LocalDateTime createdAt;
}

