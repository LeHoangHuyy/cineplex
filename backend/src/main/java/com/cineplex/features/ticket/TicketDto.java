package com.cineplex.features.ticket;

import com.cineplex.features.cinema.SeatType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketDto {
    private UUID id;
    private String ticketCode;
    private String seatCode;
    private String seatRow;
    private Integer seatNumber;
    private SeatType seatType;
    private BigDecimal price;
    private String qrCodeBase64;
}

