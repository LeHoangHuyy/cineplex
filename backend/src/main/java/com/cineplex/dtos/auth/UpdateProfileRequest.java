package com.cineplex.dtos.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;
    private String phone;
    private String currentPassword;
    private String newPassword;
}
