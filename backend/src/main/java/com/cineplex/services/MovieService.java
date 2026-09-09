package com.cineplex.services;

import com.cineplex.dtos.movie.MovieRequest;
import com.cineplex.dtos.movie.MovieResponse;
import com.cineplex.entities.Movie;
import com.cineplex.entities.MovieStatus;
import com.cineplex.exceptions.BadRequestException;
import com.cineplex.exceptions.ResourceNotFoundException;
import com.cineplex.repositories.MovieRepository;
import com.cineplex.utils.SlugUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cineplex.dtos.common.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;

    @Transactional(readOnly = true)
    public PageResponse<MovieResponse> getAllMovies(MovieStatus status, String search, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        Page<Movie> moviePage = movieRepository.searchMovies(status, cleanSearch, pageable);
        List<MovieResponse> content = moviePage.getContent().stream().map(this::mapToResponse).collect(Collectors.toList());
        return PageResponse.of(moviePage, content);
    }

    @Transactional(readOnly = true)
    public PageResponse<MovieResponse> getAllMovies(MovieStatus status, Pageable pageable) {
        return getAllMovies(status, null, pageable);
    }

    @Transactional(readOnly = true)
    public List<MovieResponse> getAllMovies(MovieStatus status) {
        List<Movie> movies;
        if (status != null) {
            movies = movieRepository.findByStatus(status);
        } else {
            movies = movieRepository.findAll();
        }
        return movies.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MovieResponse getMovieById(UUID id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phim với ID: " + id));
        return mapToResponse(movie);
    }

    @Transactional(readOnly = true)
    public MovieResponse getMovieBySlug(String slug) {
        Movie movie = movieRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phim: " + slug));
        return mapToResponse(movie);
    }

    @Transactional
    public MovieResponse createMovie(MovieRequest request) {
        String baseSlug = SlugUtils.toSlug(request.getTitle());
        String slug = baseSlug;
        int count = 1;
        while (movieRepository.findBySlug(slug).isPresent()) {
            slug = baseSlug + "-" + count++;
        }

        Movie movie = Movie.builder()
                .title(request.getTitle())
                .slug(slug)
                .description(request.getDescription())
                .durationMinutes(request.getDurationMinutes())
                .genre(request.getGenre())
                .director(request.getDirector())
                .castMembers(request.getCastMembers())
                .posterUrl(request.getPosterUrl())
                .bannerUrl(request.getBannerUrl() != null ? request.getBannerUrl() : request.getPosterUrl())
                .trailerUrl(request.getTrailerUrl())
                .ageRating(request.getAgeRating())
                .releaseDate(request.getReleaseDate())
                .endDate(request.getEndDate())
                .status(request.getStatus())
                .build();

        movie = movieRepository.save(movie);
        return mapToResponse(movie);
    }

    @Transactional
    public MovieResponse updateMovie(UUID id, MovieRequest request) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phim với ID: " + id));

        if (!movie.getTitle().equalsIgnoreCase(request.getTitle())) {
            String baseSlug = SlugUtils.toSlug(request.getTitle());
            String slug = baseSlug;
            int count = 1;
            while (movieRepository.findBySlug(slug).filter(m -> !m.getId().equals(id)).isPresent()) {
                slug = baseSlug + "-" + count++;
            }
            movie.setSlug(slug);
        }

        movie.setTitle(request.getTitle());
        movie.setDescription(request.getDescription());
        movie.setDurationMinutes(request.getDurationMinutes());
        movie.setGenre(request.getGenre());
        movie.setDirector(request.getDirector());
        movie.setCastMembers(request.getCastMembers());
        movie.setPosterUrl(request.getPosterUrl());
        movie.setBannerUrl(request.getBannerUrl() != null ? request.getBannerUrl() : request.getPosterUrl());
        movie.setTrailerUrl(request.getTrailerUrl());
        movie.setAgeRating(request.getAgeRating());
        movie.setReleaseDate(request.getReleaseDate());
        movie.setEndDate(request.getEndDate());
        movie.setStatus(request.getStatus());

        movie = movieRepository.save(movie);
        return mapToResponse(movie);
    }

    @Transactional
    public void deleteMovie(UUID id) {
        if (!movieRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy phim với ID: " + id);
        }
        movieRepository.deleteById(id);
    }

    public MovieResponse mapToResponse(Movie movie) {
        return MovieResponse.builder()
                .id(movie.getId())
                .title(movie.getTitle())
                .slug(movie.getSlug())
                .description(movie.getDescription())
                .durationMinutes(movie.getDurationMinutes())
                .genre(movie.getGenre())
                .director(movie.getDirector())
                .castMembers(movie.getCastMembers())
                .posterUrl(movie.getPosterUrl())
                .bannerUrl(movie.getBannerUrl())
                .trailerUrl(movie.getTrailerUrl())
                .ageRating(movie.getAgeRating())
                .releaseDate(movie.getReleaseDate())
                .endDate(movie.getEndDate())
                .status(movie.getStatus())
                .createdAt(movie.getCreatedAt())
                .build();
    }
}
