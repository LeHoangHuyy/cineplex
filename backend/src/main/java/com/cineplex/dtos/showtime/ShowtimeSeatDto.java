package com.cineplex.dtos.showtime;

import com.cineplex.entities.SeatType;
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
public class ShowtimeSeatDto {
    private UUID showtimeSeatId;
    private UUID seatId;
    private String seatRow;
    private Integer seatNumber;
    private String seatCode;
    private SeatType seatType;
    private Integer rowIndex;
    private Integer colIndex;
    private BigDecimal price;
    private String status; // "AVAILABLE", "HOLDING", "BOOKED"
    private boolean isHeldByCurrentUser;
}
