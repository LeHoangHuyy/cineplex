package com.cineplex.features.cinema;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatDto {
    private UUID id;
    private String seatRow;
    private Integer seatNumber;
    private String seatCode;
    private SeatType seatType;
    private Integer rowIndex;
    private Integer colIndex;
}

