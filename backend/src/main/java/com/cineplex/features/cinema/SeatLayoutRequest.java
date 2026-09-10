package com.cineplex.features.cinema;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class SeatLayoutRequest {
    @NotNull(message = "Room ID không được để trống")
    private UUID roomId;

    @NotEmpty(message = "Danh sách ghế không được để trống")
    @Valid
    private List<SeatDto> seats;
}

