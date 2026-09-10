package com.cineplex.features.cinema;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface SeatRepository extends JpaRepository<Seat, UUID> {
    List<Seat> findByRoomIdOrderByRowIndexAscColIndexAsc(UUID roomId);
    void deleteByRoomId(UUID roomId);
}

