package com.cineplex.repositories;

import com.cineplex.entities.ShowtimeSeat;
import com.cineplex.entities.ShowtimeSeatStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShowtimeSeatRepository extends JpaRepository<ShowtimeSeat, UUID> {
    List<ShowtimeSeat> findByShowtimeId(UUID showtimeId);

    @Query("SELECT ss FROM ShowtimeSeat ss JOIN FETCH ss.seat " +
           "WHERE ss.showtime.id = :showtimeId ORDER BY ss.seat.rowIndex ASC, ss.seat.colIndex ASC")
    List<ShowtimeSeat> findByShowtimeIdWithSeatOrderByPosition(@Param("showtimeId") UUID showtimeId);

    Optional<ShowtimeSeat> findByShowtimeIdAndSeatId(UUID showtimeId, UUID seatId);

    List<ShowtimeSeat> findByShowtimeIdAndSeatIdIn(UUID showtimeId, List<UUID> seatIds);
}
