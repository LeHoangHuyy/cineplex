package com.cineplex.features.admin;

import com.cineplex.common.dto.PageResponse;
import com.cineplex.features.auth.AuthResponse;
import com.cineplex.features.booking.Booking;
import com.cineplex.features.booking.BookingResponse;
import com.cineplex.features.booking.BookingService;
import com.cineplex.features.booking.BookingStatus;
import com.cineplex.features.cinema.Cinema;
import com.cineplex.features.cinema.CinemaRequest;
import com.cineplex.features.cinema.CinemaResponse;
import com.cineplex.features.cinema.CinemaService;
import com.cineplex.features.cinema.Room;
import com.cineplex.features.cinema.RoomRequest;
import com.cineplex.features.cinema.RoomResponse;
import com.cineplex.features.cinema.SeatDto;
import com.cineplex.features.cinema.SeatLayoutRequest;
import com.cineplex.features.movie.Movie;
import com.cineplex.features.movie.MovieRequest;
import com.cineplex.features.movie.MovieResponse;
import com.cineplex.features.movie.MovieService;
import com.cineplex.features.showtime.Showtime;
import com.cineplex.features.showtime.ShowtimeRequest;
import com.cineplex.features.showtime.ShowtimeResponse;
import com.cineplex.features.showtime.ShowtimeService;
import com.cineplex.features.user.User;
import com.cineplex.features.user.UserService;
import com.cineplex.features.user.UserStatusRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final DashboardService dashboardService;
    private final MovieService movieService;
    private final CinemaService cinemaService;
    private final ShowtimeService showtimeService;
    private final BookingService bookingService;
    private final UserService userService;

    // --- Dashboard ---
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats() {
        return ResponseEntity.ok(dashboardService.getDashboardStats());
    }

    // --- Movie Management ---
    @PostMapping("/movies")
    public ResponseEntity<MovieResponse> createMovie(@Valid @RequestBody MovieRequest request) {
        return ResponseEntity.ok(movieService.createMovie(request));
    }

    @PutMapping("/movies/{id}")
    public ResponseEntity<MovieResponse> updateMovie(@PathVariable UUID id, @Valid @RequestBody MovieRequest request) {
        return ResponseEntity.ok(movieService.updateMovie(id, request));
    }

    @DeleteMapping("/movies/{id}")
    public ResponseEntity<Map<String, String>> deleteMovie(@PathVariable UUID id) {
        movieService.deleteMovie(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa phim thành công"));
    }

    // --- Cinema & Room Management ---
    @PostMapping("/cinemas")
    public ResponseEntity<CinemaResponse> createCinema(@Valid @RequestBody CinemaRequest request) {
        return ResponseEntity.ok(cinemaService.createCinema(request));
    }

    @PutMapping("/cinemas/{id}")
    public ResponseEntity<CinemaResponse> updateCinema(@PathVariable UUID id, @Valid @RequestBody CinemaRequest request) {
        return ResponseEntity.ok(cinemaService.updateCinema(id, request));
    }

    @DeleteMapping("/cinemas/{id}")
    public ResponseEntity<Map<String, String>> deleteCinema(@PathVariable UUID id) {
        cinemaService.deleteCinema(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa rạp thành công"));
    }

    @PostMapping("/rooms")
    public ResponseEntity<RoomResponse> createRoom(@Valid @RequestBody RoomRequest request) {
        return ResponseEntity.ok(cinemaService.createRoom(request));
    }

    @PutMapping("/rooms/{id}")
    public ResponseEntity<RoomResponse> updateRoom(@PathVariable UUID id, @Valid @RequestBody RoomRequest request) {
        return ResponseEntity.ok(cinemaService.updateRoom(id, request));
    }

    @DeleteMapping("/rooms/{id}")
    public ResponseEntity<Map<String, String>> deleteRoom(@PathVariable UUID id) {
        cinemaService.deleteRoom(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa phòng chiếu thành công"));
    }

    @GetMapping("/rooms/{roomId}/seats")
    public ResponseEntity<List<SeatDto>> getSeatsByRoom(@PathVariable UUID roomId) {
        return ResponseEntity.ok(cinemaService.getSeatsByRoom(roomId));
    }

    @PutMapping("/rooms/seats")
    public ResponseEntity<List<SeatDto>> updateSeatLayout(@Valid @RequestBody SeatLayoutRequest request) {
        return ResponseEntity.ok(cinemaService.updateSeatLayout(request));
    }

    // --- Showtime Management ---
    @GetMapping("/showtimes")
    public ResponseEntity<PageResponse<ShowtimeResponse>> getAllShowtimes(
            @RequestParam(required = false) UUID cinemaId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(showtimeService.getAllShowtimes(cinemaId, search, pageable));
    }

    @PostMapping("/showtimes")
    public ResponseEntity<ShowtimeResponse> createShowtime(@Valid @RequestBody ShowtimeRequest request) {
        return ResponseEntity.ok(showtimeService.createShowtime(request));
    }

    @PutMapping("/showtimes/{id}")
    public ResponseEntity<ShowtimeResponse> updateShowtime(@PathVariable UUID id, @Valid @RequestBody ShowtimeRequest request) {
        return ResponseEntity.ok(showtimeService.updateShowtime(id, request));
    }

    @DeleteMapping("/showtimes/{id}")
    public ResponseEntity<Map<String, String>> deleteShowtime(@PathVariable UUID id) {
        showtimeService.deleteShowtime(id);
        return ResponseEntity.ok(Map.of("message", "Đã hủy suất chiếu thành công"));
    }

    // --- Booking Management ---
    @GetMapping("/bookings")
    public ResponseEntity<PageResponse<BookingResponse>> getAllBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String validSortBy = switch (sortBy) {
            case "totalAmount", "bookingCode" -> sortBy;
            default -> "createdAt";
        };
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, validSortBy));
        return ResponseEntity.ok(bookingService.getAllBookings(status, search, pageable));
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<BookingResponse> getBookingDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    // --- User Management ---
    @GetMapping("/users")
    public ResponseEntity<PageResponse<AuthResponse>> getAllUsers(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String validSortBy = switch (sortBy) {
            case "fullName", "email" -> sortBy;
            default -> "createdAt";
        };
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, validSortBy));
        return ResponseEntity.ok(userService.getAllUsers(status, search, pageable));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<AuthResponse> updateUserStatus(@PathVariable UUID id, @Valid @RequestBody UserStatusRequest request) {
        return ResponseEntity.ok(userService.updateUserStatus(id, request.getStatus()));
    }
}

