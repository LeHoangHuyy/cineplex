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
public class RoomResponse {
    private UUID id;
    private UUID cinemaId;
    private String cinemaName;
    private String name;
    private Integer totalRows;
    private Integer totalCols;
    private RoomType roomType;
    private Integer totalSeats;
}

