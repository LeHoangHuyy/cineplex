package com.cineplex.controllers;

import com.cineplex.dtos.booking.BookingResponse;
import com.cineplex.dtos.booking.CreateBookingRequest;
import com.cineplex.dtos.booking.HoldSeatsRequest;
import com.cineplex.dtos.common.PageResponse;
import com.cineplex.entities.User;
import com.cineplex.services.AuthService;
import com.cineplex.services.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final AuthService authService;

    @PostMapping("/hold-seats")
    public ResponseEntity<Map<String, Object>> holdSeats(@Valid @RequestBody HoldSeatsRequest request) {
        User user = authService.getCurrentUser();
        bookingService.holdSeats(request, user);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Giữ ghế thành công trong 5 phút"
        ));
    }

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(bookingService.createBooking(request, user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable UUID id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    @GetMapping("/code/{bookingCode}")
    public ResponseEntity<BookingResponse> getBookingByCode(@PathVariable String bookingCode) {
        return ResponseEntity.ok(bookingService.getBookingByCode(bookingCode));
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<PageResponse<BookingResponse>> getMyBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        User user = authService.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(bookingService.getUserBookings(user.getId(), pageable));
    }
}
