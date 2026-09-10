package com.cineplex.features.cinema;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/cinemas")
@RequiredArgsConstructor
public class CinemaController {

    private final CinemaService cinemaService;

    @GetMapping
    public ResponseEntity<List<CinemaResponse>> getAllCinemas(@RequestParam(required = false) String city) {
        return ResponseEntity.ok(cinemaService.getAllCinemas(city));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CinemaResponse> getCinemaById(@PathVariable UUID id) {
        return ResponseEntity.ok(cinemaService.getCinemaById(id));
    }

    @GetMapping("/{id}/rooms")
    public ResponseEntity<List<RoomResponse>> getRoomsByCinema(@PathVariable UUID id) {
        return ResponseEntity.ok(cinemaService.getRoomsByCinema(id));
    }
}

