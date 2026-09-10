package com.cineplex.features.booking;

import com.cineplex.features.payment.PaymentMethod;
import com.cineplex.features.showtime.Showtime;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class CreateBookingRequest {
    @NotNull(message = "Showtime ID không được để trống")
    private UUID showtimeId;

    @NotEmpty(message = "Danh sách ghế không được để trống")
    private List<UUID> seatIds;

    @NotNull(message = "Phương thức thanh toán không được để trống")
    private PaymentMethod paymentMethod;
}

