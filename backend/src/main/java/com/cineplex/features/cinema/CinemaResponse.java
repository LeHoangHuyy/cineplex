package com.cineplex.features.cinema;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CinemaResponse {
    private UUID id;
    private String name;
    private String address;
    private String city;
    private String phone;
    private String imageUrl;
    private List<RoomResponse> rooms;
}

