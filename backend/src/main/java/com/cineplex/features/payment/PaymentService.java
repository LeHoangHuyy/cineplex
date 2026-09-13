package com.cineplex.features.payment;

import com.cineplex.common.exceptions.BadRequestException;
import com.cineplex.common.exceptions.ResourceNotFoundException;
import com.cineplex.common.mq.RabbitMQProducer;
import com.cineplex.features.booking.Booking;
import com.cineplex.features.booking.BookingRepository;
import com.cineplex.features.booking.BookingStatus;
import com.cineplex.features.booking.SeatLockService;
import com.cineplex.features.showtime.ShowtimeSeat;
import com.cineplex.features.showtime.ShowtimeSeatRepository;
import com.cineplex.features.showtime.ShowtimeSeatStatus;
import com.cineplex.features.ticket.Ticket;
import com.cineplex.features.ticket.TicketRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final ShowtimeSeatRepository showtimeSeatRepository;
    private final TicketRepository ticketRepository;
    private final SeatLockService seatLockService;
    private final RabbitMQProducer rabbitMQProducer;

    @Transactional
    public Payment createOrUpdatePayment(Booking booking, PaymentMethod paymentMethod) {
        Payment payment = paymentRepository.findByBookingId(booking.getId())
                .orElseGet(() -> Payment.builder()
                        .booking(booking)
                        .amount(booking.getTotalAmount())
                        .status(PaymentStatus.PENDING)
                        .build());

        payment.setPaymentMethod(paymentMethod);
        payment.setAmount(booking.getTotalAmount());
        payment.setTransactionCode("TXN-" + System.currentTimeMillis());

        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment updatePaymentMethod(UUID bookingId, PaymentMethod paymentMethod) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin thanh toán"));
        payment.setPaymentMethod(paymentMethod);
        return paymentRepository.save(payment);
    }

    @Transactional
    public Booking confirmPaymentSuccess(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt vé"));

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            return booking;
        }

        if (booking.getStatus() == BookingStatus.EXPIRED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Đơn đặt vé đã hết hạn hoặc bị hủy");
        }

        Payment payment = paymentRepository.findByBookingId(booking.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin thanh toán"));

        // Mark payment as SUCCESS
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // Mark booking as CONFIRMED
        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        // Update showtime seats to BOOKED permanently in DB
        List<UUID> seatIds = new ArrayList<>();
        for (Ticket ticket : booking.getTickets()) {
            ShowtimeSeat showtimeSeat = ticket.getShowtimeSeat();
            showtimeSeat.setStatus(ShowtimeSeatStatus.BOOKED);
            showtimeSeatRepository.save(showtimeSeat);
            seatIds.add(showtimeSeat.getSeat().getId());
            ticketRepository.save(ticket);
        }

        // Release temporary Redis lock
        seatLockService.releaseSeats(booking.getShowtime().getId(), seatIds);

        // Async event notification via RabbitMQ
        rabbitMQProducer.sendTicketGenerateEvent(booking.getId());

        log.info("Payment confirmed successfully for booking: {}", booking.getBookingCode());
        return booking;
    }

    public PaymentResponse mapToPaymentResponse(Payment payment) {
        if (payment == null) return null;
        return PaymentResponse.builder()
                .id(payment.getId())
                .bookingId(payment.getBooking().getId())
                .paymentMethod(payment.getPaymentMethod())
                .transactionCode(payment.getTransactionCode())
                .amount(payment.getAmount())
                .status(payment.getStatus())
                .qrCodeData(payment.getQrCodeData())
                .qrCodeBase64(payment.getQrCodeBase64())
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}

