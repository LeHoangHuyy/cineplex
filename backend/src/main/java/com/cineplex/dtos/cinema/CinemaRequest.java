package com.cineplex.dtos.cinema;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CinemaRequest {
    @NotBlank(message = "Tên rạp không được để trống")
    private String name;

    @NotBlank(message = "Địa chỉ rạp không được để trống")
    private String address;

    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    private String city;

    private String phone;
    private String imageUrl;
}
