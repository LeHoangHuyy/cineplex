package com.cineplex.dtos.admin;

import com.cineplex.entities.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserStatusRequest {
    @NotNull(message = "Trạng thái không được để trống")
    private UserStatus status;
}
