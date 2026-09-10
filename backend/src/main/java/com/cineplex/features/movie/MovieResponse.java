package com.cineplex.features.movie;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovieResponse {
    private UUID id;
    private String title;
    private String slug;
    private String description;
    private Integer durationMinutes;
    private String genre;
    private String director;
    private String castMembers;
    private String posterUrl;
    private String bannerUrl;
    private String trailerUrl;
    private AgeRating ageRating;
    private LocalDate releaseDate;
    private LocalDate endDate;
    private MovieStatus status;
    private LocalDateTime createdAt;
}

