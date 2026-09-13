package com.cineplex.features.payment;

import com.cineplex.features.booking.BookingResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentCallbackResult {
    private boolean success;
    private String message;
    private UUID bookingId;
    private BookingResponse booking;
}
