package com.cineplex.controllers;

import com.cineplex.dtos.booking.TicketDto;
import com.cineplex.entities.Ticket;
import com.cineplex.exceptions.ResourceNotFoundException;
import com.cineplex.repositories.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketRepository ticketRepository;

    @GetMapping("/verify/{ticketCode}")
    public ResponseEntity<Map<String, Object>> verifyTicket(@PathVariable String ticketCode) {
        Ticket ticket = ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new ResourceNotFoundException("Vé không tồn tại hoặc không hợp lệ: " + ticketCode));

        return ResponseEntity.ok(Map.of(
                "valid", true,
                "ticketCode", ticket.getTicketCode(),
                "movie", ticket.getBooking().getShowtime().getMovie().getTitle(),
                "cinema", ticket.getBooking().getShowtime().getRoom().getCinema().getName(),
                "room", ticket.getBooking().getShowtime().getRoom().getName(),
                "seat", ticket.getShowtimeSeat().getSeat().getSeatCode(),
                "seatType", ticket.getShowtimeSeat().getSeat().getSeatType().name(),
                "startTime", ticket.getBooking().getShowtime().getStartTime().toString(),
                "customerName", ticket.getBooking().getUser().getFullName(),
                "status", ticket.getBooking().getStatus().name()
        ));
    }
}
