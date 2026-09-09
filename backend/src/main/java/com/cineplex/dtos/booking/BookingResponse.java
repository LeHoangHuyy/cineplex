package com.cineplex.dtos.booking;

import com.cineplex.dtos.payment.PaymentResponse;
import com.cineplex.dtos.showtime.ShowtimeResponse;
import com.cineplex.entities.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
    private UUID id;
    private String bookingCode;
    private UUID userId;
    private String userFullName;
    private String userEmail;
    private String userPhone;
    private ShowtimeResponse showtime;
    private BigDecimal totalAmount;
    private BookingStatus status;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private List<TicketDto> tickets;
    private PaymentResponse payment;
}
