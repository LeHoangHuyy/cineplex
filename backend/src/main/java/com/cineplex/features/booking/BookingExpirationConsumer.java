package com.cineplex.features.booking;

import com.cineplex.common.config.RabbitMQConfig;
import com.cineplex.features.showtime.Showtime;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingExpirationConsumer {

    private final BookingRepository bookingRepository;
    private final SeatLockService seatLockService;

    @RabbitListener(queues = RabbitMQConfig.BOOKING_EXPIRED_QUEUE)
    @Transactional
    public void handleBookingExpired(Map<String, Object> message) {
        try {
            String bookingIdStr = (String) message.get("bookingId");
            if (bookingIdStr == null) return;

            UUID bookingId = UUID.fromString(bookingIdStr);
            expireBooking(bookingId);
        } catch (Exception e) {
            log.error("Error processing expired booking message: {}", e.getMessage());
        }
    }

    /**
     * Fallback scheduled task every 60 seconds to clean up any overdue pending bookings
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void cleanupOverdueBookings() {
        LocalDateTime now = LocalDateTime.now();
        List<Booking> overdueBookings = bookingRepository.findByStatusAndExpiresAtBefore(BookingStatus.PENDING, now);
        for (Booking booking : overdueBookings) {
            expireBooking(booking.getId());
        }
    }

    private void expireBooking(UUID bookingId) {
        bookingRepository.findById(bookingId).ifPresent(booking -> {
            if (booking.getStatus() == BookingStatus.PENDING) {
                log.info("Expiring booking: {} (Showtime: {})", booking.getBookingCode(), booking.getShowtime().getId());
                booking.setStatus(BookingStatus.EXPIRED);
                bookingRepository.save(booking);

                // Release Redis seat locks
                List<UUID> seatIds = booking.getTickets().stream()
                        .map(t -> t.getShowtimeSeat().getSeat().getId())
                        .collect(Collectors.toList());

                seatLockService.releaseSeats(booking.getShowtime().getId(), seatIds);
            }
        });
    }
}

