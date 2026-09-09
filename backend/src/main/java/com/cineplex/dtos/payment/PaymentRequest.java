package com.cineplex.dtos.payment;

import com.cineplex.entities.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class PaymentRequest {
    @NotNull(message = "Booking ID không được để trống")
    private UUID bookingId;

    @NotNull(message = "Phương thức thanh toán không được để trống")
    private PaymentMethod paymentMethod;
}
