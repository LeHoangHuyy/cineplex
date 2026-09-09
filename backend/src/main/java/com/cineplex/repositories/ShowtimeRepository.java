package com.cineplex.repositories;

import com.cineplex.entities.Showtime;
import com.cineplex.entities.ShowtimeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, UUID> {

    @Query("SELECT s FROM Showtime s WHERE s.movie.id = :movieId " +
           "AND s.startTime >= :startOfDay AND s.startTime < :endOfDay " +
           "AND s.status <> 'CANCELLED' ORDER BY s.startTime ASC")
    List<Showtime> findByMovieAndDate(@Param("movieId") UUID movieId,
                                      @Param("startOfDay") LocalDateTime startOfDay,
                                      @Param("endOfDay") LocalDateTime endOfDay);

    @Query("SELECT s FROM Showtime s WHERE s.room.cinema.id = :cinemaId " +
           "AND s.startTime >= :startOfDay AND s.startTime < :endOfDay " +
           "AND s.status <> 'CANCELLED' ORDER BY s.startTime ASC")
    List<Showtime> findByCinemaAndDate(@Param("cinemaId") UUID cinemaId,
                                       @Param("startOfDay") LocalDateTime startOfDay,
                                       @Param("endOfDay") LocalDateTime endOfDay);

    @Query("SELECT s FROM Showtime s WHERE s.room.id = :roomId " +
           "AND s.status <> 'CANCELLED' " +
           "AND (:startTime < s.endTime AND :endTime > s.startTime) " +
           "AND (:excludeId IS NULL OR s.id <> :excludeId)")
    List<Showtime> findOverlappingShowtimes(@Param("roomId") UUID roomId,
                                            @Param("startTime") LocalDateTime startTime,
                                            @Param("endTime") LocalDateTime endTime,
                                            @Param("excludeId") UUID excludeId);

    List<Showtime> findByRoomCinemaIdOrderByStartTimeDesc(UUID cinemaId);
    List<Showtime> findAllByOrderByStartTimeDesc();
    org.springframework.data.domain.Page<Showtime> findByRoomCinemaIdOrderByStartTimeDesc(UUID cinemaId, org.springframework.data.domain.Pageable pageable);
    org.springframework.data.domain.Page<Showtime> findAllByOrderByStartTimeDesc(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT s FROM Showtime s WHERE " +
           "(:cinemaId IS NULL OR s.room.cinema.id = :cinemaId) AND " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(s.movie.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.room.name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY s.startTime DESC")
    org.springframework.data.domain.Page<Showtime> searchShowtimes(@Param("cinemaId") UUID cinemaId, @Param("search") String search, org.springframework.data.domain.Pageable pageable);
}
