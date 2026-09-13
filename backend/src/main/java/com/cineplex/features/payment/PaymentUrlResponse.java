package com.cineplex.features.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentUrlResponse {
    private String paymentUrl;
    private PaymentMethod paymentMethod;
}
