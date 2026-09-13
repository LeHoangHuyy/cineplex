package com.cineplex.features.showtime;

import com.cineplex.common.security.UserDetailsImpl;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/showtimes")
@RequiredArgsConstructor
public class ShowtimeController {

    public static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ShowtimeService showtimeService;

    @GetMapping("/movie/{movieId}")
    public ResponseEntity<List<ShowtimeResponse>> getShowtimesByMovieAndDate(
            @PathVariable UUID movieId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate queryDate = (date != null) ? date : LocalDate.now(VIETNAM_ZONE);
        return ResponseEntity.ok(showtimeService.getShowtimesByMovieAndDate(movieId, queryDate));
    }

    @GetMapping("/cinema/{cinemaId}")
    public ResponseEntity<List<ShowtimeResponse>> getShowtimesByCinemaAndDate(
            @PathVariable UUID cinemaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false, defaultValue = "false") boolean includePast) {
        LocalDate queryDate = (date != null) ? date : LocalDate.now(VIETNAM_ZONE);
        return ResponseEntity.ok(showtimeService.getShowtimesByCinemaAndDate(cinemaId, queryDate, includePast));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShowtimeResponse> getShowtimeById(@PathVariable UUID id) {
        return ResponseEntity.ok(showtimeService.getShowtimeById(id));
    }

    @GetMapping("/{id}/seats")
    public ResponseEntity<List<ShowtimeSeatDto>> getShowtimeSeats(@PathVariable UUID id) {
        UUID currentUserId = null;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl userDetails) {
            currentUserId = userDetails.getId();
        }

        return ResponseEntity.ok(showtimeService.getShowtimeSeats(id, currentUserId));
    }
}

