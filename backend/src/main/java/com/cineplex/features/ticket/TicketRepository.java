package com.cineplex.features.ticket;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    Optional<Ticket> findByTicketCode(String ticketCode);
    List<Ticket> findByBookingId(UUID bookingId);

    @Query("SELECT COUNT(t) FROM Ticket t JOIN t.booking b WHERE b.status = 'CONFIRMED'")
    long countSoldTickets();
}

