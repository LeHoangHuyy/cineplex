package com.cineplex.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    @JsonIgnore
    private Booking booking;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "showtime_seat_id", nullable = false)
    private ShowtimeSeat showtimeSeat;

    @Column(nullable = false, unique = true, length = 32)
    private String ticketCode; // TKT-XXXX-XXXX

    @Column(columnDefinition = "TEXT")
    private String qrCodeBase64;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;
}
