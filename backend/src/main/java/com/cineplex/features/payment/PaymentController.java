package com.cineplex.features.payment;

import com.cineplex.features.booking.Booking;
import com.cineplex.features.booking.BookingResponse;
import com.cineplex.features.booking.BookingService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final BookingService bookingService;
    private final PaymentRepository paymentRepository;

    @PostMapping("/confirm/{bookingId}")
    public ResponseEntity<BookingResponse> confirmPayment(@PathVariable UUID bookingId) {
        Booking confirmedBooking = paymentService.confirmPaymentSuccess(bookingId);
        return ResponseEntity.ok(bookingService.mapToBookingResponse(confirmedBooking));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<PaymentResponse> getPaymentByBooking(@PathVariable UUID bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElse(null);
        return ResponseEntity.ok(paymentService.mapToPaymentResponse(payment));
    }
}

