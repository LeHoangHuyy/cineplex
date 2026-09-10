package com.cineplex.features.cinema;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "seats", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"room_id", "seat_row", "seat_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    @JsonIgnore
    private Room room;

    @Column(name = "seat_row", nullable = false, length = 5)
    private String seatRow; // A, B, C, D...

    @Column(name = "seat_number", nullable = false)
    private Integer seatNumber; // 1, 2, 3...

    @Column(name = "seat_code", nullable = false, length = 10)
    private String seatCode; // A01, E10...

    @Enumerated(EnumType.STRING)
    @Column(name = "seat_type", nullable = false)
    @Builder.Default
    private SeatType seatType = SeatType.REGULAR;

    @Column(nullable = false)
    @Builder.Default
    private Integer rowIndex = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer colIndex = 0;
}

