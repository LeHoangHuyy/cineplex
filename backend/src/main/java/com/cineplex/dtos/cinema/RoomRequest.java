package com.cineplex.dtos.cinema;

import com.cineplex.entities.RoomType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class RoomRequest {
    @NotNull(message = "Cinema ID không được để trống")
    private UUID cinemaId;

    @NotBlank(message = "Tên phòng chiếu không được để trống")
    private String name;

    @NotNull(message = "Số hàng ghế không được để trống")
    @Min(value = 1, message = "Số hàng ghế phải lớn hơn 0")
    private Integer totalRows;

    @NotNull(message = "Số cột ghế không được để trống")
    @Min(value = 1, message = "Số cột ghế phải lớn hơn 0")
    private Integer totalCols;

    @NotNull(message = "Loại phòng chiếu không được để trống")
    private RoomType roomType;
}
