package com.cineplex.features.cinema;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CinemaRequest {
    @NotBlank(message = "Tên rạp không được để trống")
    private String name;

    @NotBlank(message = "Địa chỉ rạp không được để trống")
    private String address;

    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    private String city;

    @NotBlank(message = "Số điện thoại rạp không được để trống")
    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    @Pattern(
        regexp = "^\\s*(?:(?:\\+?84|0)[\\s.-]?[235789](?:[\\s.-]?[0-9]){7,10}|\\(0[235789]\\d{1,2}\\)[\\s.-]?(?:[\\s.-]?[0-9]){7,8}|1[89]00(?:[\\s.-]?[0-9]){4,6})\\s*$",
        message = "Số điện thoại không đúng định dạng (VD: 028.3636.8181, 0901234567 hoặc 1900xxxx)"
    )
    private String phone;

    private String imageUrl;
}

