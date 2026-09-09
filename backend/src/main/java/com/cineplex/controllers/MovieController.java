package com.cineplex.controllers;

import com.cineplex.dtos.common.PageResponse;
import com.cineplex.dtos.movie.MovieResponse;
import com.cineplex.entities.MovieStatus;
import com.cineplex.services.MovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;

    @GetMapping
    public ResponseEntity<PageResponse<MovieResponse>> getAllMovies(
            @RequestParam(required = false) MovieStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(movieService.getAllMovies(status, search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MovieResponse> getMovieById(@PathVariable UUID id) {
        return ResponseEntity.ok(movieService.getMovieById(id));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<MovieResponse> getMovieBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(movieService.getMovieBySlug(slug));
    }
}
