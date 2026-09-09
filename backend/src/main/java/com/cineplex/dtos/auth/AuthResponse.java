package com.cineplex.dtos.auth;

import com.cineplex.entities.Role;
import com.cineplex.entities.UserStatus;
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
}
