package com.cineplex.features.ticket;

import com.cineplex.common.exceptions.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketRepository ticketRepository;

    @GetMapping("/verify/{ticketCode}")
    @PreAuthorize("hasRole('ADMIN')")
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

