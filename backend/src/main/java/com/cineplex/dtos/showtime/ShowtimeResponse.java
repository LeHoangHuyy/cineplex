package com.cineplex.dtos.showtime;

import com.cineplex.dtos.cinema.CinemaResponse;
import com.cineplex.dtos.cinema.RoomResponse;
import com.cineplex.dtos.movie.MovieResponse;
import com.cineplex.entities.ShowtimeStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShowtimeResponse {
    private UUID id;
    private MovieResponse movie;
    private RoomResponse room;
    private CinemaResponse cinema;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal basePrice;
    private ShowtimeStatus status;
    private Integer availableSeatsCount;
    private Integer totalSeatsCount;
}
