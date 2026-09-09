package com.cineplex.services;

import com.cineplex.dtos.booking.BookingResponse;
import com.cineplex.dtos.booking.TicketDto;
import com.cineplex.dtos.payment.PaymentResponse;
import com.cineplex.entities.*;
import com.cineplex.exceptions.BadRequestException;
import com.cineplex.exceptions.ResourceNotFoundException;
import com.cineplex.mq.RabbitMQProducer;
import com.cineplex.repositories.BookingRepository;
import com.cineplex.repositories.PaymentRepository;
import com.cineplex.repositories.ShowtimeSeatRepository;
import com.cineplex.repositories.TicketRepository;
import com.cineplex.utils.QRCodeGenerator;
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

        // Generate payment QR payload
        String qrPayload = generatePaymentPayload(booking, paymentMethod, payment.getTransactionCode());
        payment.setQrCodeData(qrPayload);
        payment.setQrCodeBase64(QRCodeGenerator.generateQRCodeBase64(qrPayload, 300, 300));

        return paymentRepository.save(payment);
    }

    private String generatePaymentPayload(Booking booking, PaymentMethod method, String txnCode) {
        long amountLong = booking.getTotalAmount().longValue();
        return switch (method) {
            case ZALOPAY -> String.format("zalopay://pay?app_id=2554&app_trans_id=%s&amount=%d&description=Thanh+toan+ve+Cineplex+%s",
                    txnCode, amountLong, booking.getBookingCode());
            case MOMO -> String.format("2|99|0987654321|||0|0|%d|Cineplex %s|transfer_myqr",
                    amountLong, booking.getBookingCode());
            case VNPAY -> String.format("00020101021238580010A000000727012800069704220114CINEPLEX%s53037045408%d5802VN62150811ThanhToanVe6304",
                    booking.getBookingCode(), amountLong);
        };
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

            // Generate E-Ticket QR Code
            String ticketVerificationData = generateTicketVerificationData(booking, ticket);
            ticket.setQrCodeBase64(QRCodeGenerator.generateQRCodeBase64(ticketVerificationData, 250, 250));
            ticketRepository.save(ticket);
        }

        // Release temporary Redis lock
        seatLockService.releaseSeats(booking.getShowtime().getId(), seatIds);

        // Async event notification via RabbitMQ
        rabbitMQProducer.sendTicketGenerateEvent(booking.getId());

        log.info("Payment confirmed successfully for booking: {}", booking.getBookingCode());
        return booking;
    }

    private String generateTicketVerificationData(Booking booking, Ticket ticket) {
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");
        return String.format("CINEPLEX_PASS|TKT:%s|BOOKING:%s|MOVIE:%s|CINEMA:%s|HALL:%s|SEAT:%s|TIME:%s|PRICE:%s",
                ticket.getTicketCode(),
                booking.getBookingCode(),
                booking.getShowtime().getMovie().getTitle(),
                booking.getShowtime().getRoom().getCinema().getName(),
                booking.getShowtime().getRoom().getName(),
                ticket.getShowtimeSeat().getSeat().getSeatCode(),
                booking.getShowtime().getStartTime().format(dtf),
                ticket.getPrice().toString()
        );
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
