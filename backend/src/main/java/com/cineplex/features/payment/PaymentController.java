package com.cineplex.features.payment;

import com.cineplex.features.booking.Booking;
import com.cineplex.features.booking.BookingRepository;
import com.cineplex.features.booking.BookingResponse;
import com.cineplex.features.booking.BookingService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final BookingService bookingService;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;

    @PostMapping("/create-url/{bookingId}")
    public ResponseEntity<PaymentUrlResponse> createPaymentUrl(
            @PathVariable UUID bookingId,
            @RequestParam PaymentMethod method,
            HttpServletRequest request) {
        PaymentUrlResponse response = paymentService.createPaymentUrl(bookingId, method, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/callback")
    public ResponseEntity<PaymentCallbackResult> handleCallback(@RequestParam Map<String, String> params) {
        PaymentCallbackResult result = paymentService.handlePaymentCallback(params);
        if (result.getBookingId() != null) {
            try {
                result.setBooking(bookingService.getBookingById(result.getBookingId()));
            } catch (Exception e) {
                bookingRepository.findById(result.getBookingId()).ifPresent(booking ->
                        result.setBooking(bookingService.mapToBookingResponse(booking))
                );
            }
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/confirm/{bookingId}")
    public ResponseEntity<BookingResponse> confirmPayment(@PathVariable UUID bookingId) {
        Booking confirmedBooking = paymentService.confirmPaymentSuccess(bookingId);
        return ResponseEntity.ok(bookingService.getBookingById(confirmedBooking.getId()));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<PaymentResponse> getPaymentByBooking(@PathVariable UUID bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElse(null);
        return ResponseEntity.ok(paymentService.mapToPaymentResponse(payment));
    }

    @PutMapping("/method/{bookingId}")
    public ResponseEntity<PaymentResponse> updatePaymentMethod(
            @PathVariable UUID bookingId,
            @RequestParam PaymentMethod method) {
        Payment payment = paymentService.updatePaymentMethod(bookingId, method);
        return ResponseEntity.ok(paymentService.mapToPaymentResponse(payment));
    }
}
