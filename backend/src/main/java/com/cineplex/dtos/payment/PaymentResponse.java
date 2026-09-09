package com.cineplex.dtos.payment;

import com.cineplex.entities.PaymentMethod;
import com.cineplex.entities.PaymentStatus;
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
public class PaymentResponse {
    private UUID id;
    private UUID bookingId;
    private PaymentMethod paymentMethod;
    private String transactionCode;
    private BigDecimal amount;
    private PaymentStatus status;
    private String qrCodeData;
    private String qrCodeBase64;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
}
