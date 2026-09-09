package com.cineplex.dtos.movie;

import com.cineplex.entities.AgeRating;
import com.cineplex.entities.MovieStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class MovieRequest {
    @NotBlank(message = "Tên phim không được để trống")
    private String title;

    private String description;

    @NotNull(message = "Thời lượng phim không được để trống")
    @Min(value = 1, message = "Thời lượng phim phải lớn hơn 0")
    private Integer durationMinutes;

    @NotBlank(message = "Thể loại không được để trống")
    private String genre;

    private String director;
    private String castMembers;

    @NotBlank(message = "Poster URL không được để trống")
    private String posterUrl;

    private String bannerUrl;
    private String trailerUrl;

    @NotNull(message = "Độ tuổi quy định không được để trống")
    private AgeRating ageRating;

    @NotNull(message = "Ngày khởi chiếu không được để trống")
    private LocalDate releaseDate;

    private LocalDate endDate;

    @NotNull(message = "Trạng thái phim không được để trống")
    private MovieStatus status;
}
