package com.cineplex.features.showtime;

import com.cineplex.features.cinema.Room;
import com.cineplex.features.movie.Movie;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ShowtimeRequest {
    @NotNull(message = "Movie ID không được để trống")
    private UUID movieId;

    @NotNull(message = "Room ID không được để trống")
    private UUID roomId;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private LocalDateTime startTime;

    @NotNull(message = "Giá vé cơ sở không được để trống")
    @DecimalMin(value = "1000.00", message = "Giá vé tối thiểu 1.000 VNĐ")
    private BigDecimal basePrice;

    private ShowtimeStatus status;
}

