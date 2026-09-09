package com.cineplex.repositories;

import com.cineplex.entities.Movie;
import com.cineplex.entities.MovieStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MovieRepository extends JpaRepository<Movie, UUID> {
    Optional<Movie> findBySlug(String slug);
    List<Movie> findByStatus(MovieStatus status);
    Page<Movie> findByStatus(MovieStatus status, Pageable pageable);

    @Query("SELECT m FROM Movie m WHERE " +
           "(:status IS NULL OR m.status = :status) AND " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(m.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.genre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.director) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.castMembers) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Movie> searchMovies(@Param("status") MovieStatus status, @Param("search") String search, Pageable pageable);
}

