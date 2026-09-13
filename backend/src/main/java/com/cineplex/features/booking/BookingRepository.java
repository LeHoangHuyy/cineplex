package com.cineplex.features.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findByUserIdOrderByCreatedAtDesc(UUID userId);
    org.springframework.data.domain.Page<Booking> findByUserIdOrderByCreatedAtDesc(UUID userId, org.springframework.data.domain.Pageable pageable);
    Optional<Booking> findByBookingCode(String bookingCode);
    List<Booking> findByStatusAndExpiresAtBefore(BookingStatus status, LocalDateTime dateTime);
    List<Booking> findByUserIdAndShowtimeIdAndStatus(UUID userId, UUID showtimeId, BookingStatus status);
    List<Booking> findAllByOrderByCreatedAtDesc();
    org.springframework.data.domain.Page<Booking> findAllByOrderByCreatedAtDesc(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT b FROM Booking b WHERE " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(b.bookingCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(b.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(b.user.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(b.showtime.movie.title) LIKE LOWER(CONCAT('%', :search, '%')))")
    org.springframework.data.domain.Page<Booking> searchBookings(@Param("status") BookingStatus status, @Param("search") String search, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = 'CONFIRMED'")
    long countConfirmedBookings();

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b WHERE b.status = 'CONFIRMED'")
    BigDecimal calculateTotalRevenue();

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b WHERE b.status = 'CONFIRMED' AND b.createdAt >= :startDate AND b.createdAt <= :endDate")
    BigDecimal calculateRevenueBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}

