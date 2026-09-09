package com.cineplex.repositories;

import com.cineplex.entities.Cinema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CinemaRepository extends JpaRepository<Cinema, UUID> {
    List<Cinema> findByCity(String city);
}
