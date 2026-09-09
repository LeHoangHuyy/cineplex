package com.cineplex.services;

import com.cineplex.dtos.booking.BookingResponse;
import com.cineplex.dtos.booking.CreateBookingRequest;
import com.cineplex.dtos.booking.HoldSeatsRequest;
import com.cineplex.dtos.booking.TicketDto;
import com.cineplex.entities.*;
import com.cineplex.exceptions.BadRequestException;
import com.cineplex.exceptions.ResourceNotFoundException;
import com.cineplex.exceptions.SeatLockConflictException;
import com.cineplex.mq.RabbitMQProducer;
import com.cineplex.repositories.BookingRepository;
import com.cineplex.repositories.ShowtimeRepository;
import com.cineplex.repositories.ShowtimeSeatRepository;
import com.cineplex.repositories.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ShowtimeRepository showtimeRepository;
    private final ShowtimeSeatRepository showtimeSeatRepository;
    private final TicketRepository ticketRepository;
    private final SeatLockService seatLockService;
    private final PaymentService paymentService;
    private final ShowtimeService showtimeService;
    private final RabbitMQProducer rabbitMQProducer;

    @Value("${app.booking.seat-hold-duration-seconds:300}")
    private long seatHoldDurationSeconds;

    @Transactional
    public void holdSeats(HoldSeatsRequest request, User user) {
        UUID showtimeId = request.getShowtimeId();
        List<UUID> seatIds = request.getSeatIds();

        // 1. Verify showtime exists
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy suất chiếu"));

        // 2. Verify all seats are available in DB
        List<ShowtimeSeat> showtimeSeats = showtimeSeatRepository.findByShowtimeIdAndSeatIdIn(showtimeId, seatIds);
        if (showtimeSeats.size() != seatIds.size()) {
            throw new BadRequestException("Một số ghế không tồn tại trong suất chiếu này");
        }

        for (ShowtimeSeat ss : showtimeSeats) {
            if (ss.getStatus() == ShowtimeSeatStatus.BOOKED) {
                throw new SeatLockConflictException("Ghế " + ss.getSeat().getSeatCode() + " đã được người khác đặt mua!");
            }
        }

        // 3. Atomically acquire lock in Redis
        boolean locked = seatLockService.tryHoldSeats(showtimeId, seatIds, user.getId(), seatHoldDurationSeconds);
        if (!locked) {
            throw new SeatLockConflictException("Một hoặc nhiều ghế đang được khách hàng khác giữ chỗ. Vui lòng chọn ghế khác!");
        }
    }

    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request, User user) {
        UUID showtimeId = request.getShowtimeId();
        List<UUID> seatIds = request.getSeatIds();

        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy suất chiếu"));

        // 1. Ensure user holds all requested seats
        boolean locked = seatLockService.tryHoldSeats(showtimeId, seatIds, user.getId(), seatHoldDurationSeconds);
        if (!locked) {
            throw new SeatLockConflictException("Không thể giữ ghế. Một hoặc nhiều ghế đã bị người khác chọn!");
        }

        List<ShowtimeSeat> showtimeSeats = showtimeSeatRepository.findByShowtimeIdAndSeatIdIn(showtimeId, seatIds);

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (ShowtimeSeat ss : showtimeSeats) {
            if (ss.getStatus() == ShowtimeSeatStatus.BOOKED) {
                throw new SeatLockConflictException("Ghế " + ss.getSeat().getSeatCode() + " đã được bán!");
            }
            totalAmount = totalAmount.add(ss.getPrice());
        }

        // Generate unique booking code: CPX-YYYYMMDD-XXXX
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int randomSuffix = ThreadLocalRandom.current().nextInt(1000, 9999);
        String bookingCode = "CPX-" + dateStr + "-" + randomSuffix;

        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(seatHoldDurationSeconds);

        Booking booking = Booking.builder()
                .bookingCode(bookingCode)
                .user(user)
                .showtime(showtime)
                .totalAmount(totalAmount)
                .status(BookingStatus.PENDING)
                .expiresAt(expiresAt)
                .build();

        booking = bookingRepository.save(booking);

        // Create ticket placeholders
        List<Ticket> tickets = new ArrayList<>();
        int tktIndex = 1;
        for (ShowtimeSeat ss : showtimeSeats) {
            String ticketCode = "TKT-" + bookingCode.substring(4) + "-" + String.format("%02d", tktIndex++);
            Ticket ticket = Ticket.builder()
                    .booking(booking)
                    .showtimeSeat(ss)
                    .ticketCode(ticketCode)
                    .price(ss.getPrice())
                    .build();
            tickets.add(ticket);
        }
        ticketRepository.saveAll(tickets);
        booking.setTickets(tickets);

        // Create Payment entity with QR
        Payment payment = paymentService.createOrUpdatePayment(booking, request.getPaymentMethod());
        booking.setPayment(payment);

        // Send delayed message to RabbitMQ to auto-expire if unpaid
        rabbitMQProducer.sendBookingHoldTimeout(booking.getId());

        return mapToBookingResponse(booking);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(UUID id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt vé"));
        return mapToBookingResponse(booking);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingByCode(String bookingCode) {
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt vé: " + bookingCode));
        return mapToBookingResponse(booking);
    }

    @Transactional(readOnly = true)
    public com.cineplex.dtos.common.PageResponse<BookingResponse> getUserBookings(UUID userId, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<Booking> bookingPage = bookingRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        List<BookingResponse> content = bookingPage.getContent().stream()
                .map(this::mapToBookingResponse)
                .collect(Collectors.toList());
        return com.cineplex.dtos.common.PageResponse.of(bookingPage, content);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getUserBookings(UUID userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToBookingResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public com.cineplex.dtos.common.PageResponse<BookingResponse> getAllBookings(BookingStatus status, String search, org.springframework.data.domain.Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        org.springframework.data.domain.Page<Booking> bookingPage = bookingRepository.searchBookings(status, cleanSearch, pageable);
        List<BookingResponse> content = bookingPage.getContent().stream()
                .map(this::mapToBookingResponse)
                .collect(Collectors.toList());
        return com.cineplex.dtos.common.PageResponse.of(bookingPage, content);
    }

    @Transactional(readOnly = true)
    public com.cineplex.dtos.common.PageResponse<BookingResponse> getAllBookings(org.springframework.data.domain.Pageable pageable) {
        return getAllBookings(null, null, pageable);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToBookingResponse)
                .collect(Collectors.toList());
    }

    public BookingResponse mapToBookingResponse(Booking booking) {
        List<TicketDto> ticketDtos = (booking.getTickets() != null)
                ? booking.getTickets().stream().map(t -> TicketDto.builder()
                        .id(t.getId())
                        .ticketCode(t.getTicketCode())
                        .seatCode(t.getShowtimeSeat().getSeat().getSeatCode())
                        .seatRow(t.getShowtimeSeat().getSeat().getSeatRow())
                        .seatNumber(t.getShowtimeSeat().getSeat().getSeatNumber())
                        .seatType(t.getShowtimeSeat().getSeat().getSeatType())
                        .price(t.getPrice())
                        .qrCodeBase64(t.getQrCodeBase64())
                        .build()).collect(Collectors.toList())
                : new ArrayList<>();

        return BookingResponse.builder()
                .id(booking.getId())
                .bookingCode(booking.getBookingCode())
                .userId(booking.getUser().getId())
                .userFullName(booking.getUser().getFullName())
                .userEmail(booking.getUser().getEmail())
                .userPhone(booking.getUser().getPhone())
                .showtime(showtimeService.mapToShowtimeResponse(booking.getShowtime()))
                .totalAmount(booking.getTotalAmount())
                .status(booking.getStatus())
                .expiresAt(booking.getExpiresAt())
                .createdAt(booking.getCreatedAt())
                .tickets(ticketDtos)
                .payment(paymentService.mapToPaymentResponse(booking.getPayment()))
                .build();
    }
}
