package com.cineplex.features.payment;

import com.cineplex.common.exceptions.BadRequestException;
import com.cineplex.common.exceptions.ResourceNotFoundException;
import com.cineplex.common.mq.RabbitMQProducer;
import com.cineplex.features.booking.Booking;
import com.cineplex.features.booking.BookingRepository;
import com.cineplex.features.booking.BookingResponse;
import com.cineplex.features.booking.BookingService;
import com.cineplex.features.booking.BookingStatus;
import com.cineplex.features.booking.SeatLockService;
import com.cineplex.features.payment.gateway.MoMoService;
import com.cineplex.features.payment.gateway.VNPayService;
import com.cineplex.features.payment.gateway.ZaloPayService;
import com.cineplex.features.showtime.ShowtimeSeat;
import com.cineplex.features.showtime.ShowtimeSeatRepository;
import com.cineplex.features.showtime.ShowtimeSeatStatus;
import com.cineplex.features.ticket.Ticket;
import com.cineplex.features.ticket.TicketRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
    private final ApplicationContext applicationContext;

    private final VNPayService vnPayService;
    private final MoMoService moMoService;
    private final ZaloPayService zaloPayService;

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
    public PaymentUrlResponse createPaymentUrl(UUID bookingId, PaymentMethod method, HttpServletRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt vé"));

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            throw new BadRequestException("Đơn đặt vé đã được thanh toán xác nhận");
        }

        if (booking.getStatus() == BookingStatus.EXPIRED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Đơn đặt vé đã hết hạn hoặc bị hủy");
        }

        // Update or create payment record with payment method
        createOrUpdatePayment(booking, method);

        String paymentUrl;
        switch (method) {
            case VNPAY -> paymentUrl = vnPayService.createPaymentUrl(booking, request);
            case MOMO -> paymentUrl = moMoService.createPaymentUrl(booking);
            case ZALOPAY -> paymentUrl = zaloPayService.createPaymentUrl(booking);
            default -> throw new BadRequestException("Phương thức thanh toán không được hỗ trợ: " + method);
        }

        return PaymentUrlResponse.builder()
                .paymentUrl(paymentUrl)
                .paymentMethod(method)
                .build();
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

    @Transactional
    public PaymentCallbackResult handlePaymentCallback(Map<String, String> allParams) {
        log.info("Received payment gateway callback params: {}", allParams);

        // 1. VNPay Gateway Callback
        if (allParams.containsKey("vnp_ResponseCode")) {
            return handleVNPayCallback(allParams);
        }

        // 2. MoMo Gateway Callback
        if (allParams.containsKey("partnerCode") || allParams.containsKey("resultCode")) {
            return handleMoMoCallback(allParams);
        }

        // 3. ZaloPay Gateway Callback
        if (allParams.containsKey("apptransid") || allParams.containsKey("appid")) {
            return handleZaloPayCallback(allParams);
        }

        return PaymentCallbackResult.builder()
                .success(false)
                .message("Không tìm thấy thông tin hợp lệ từ cổng thanh toán")
                .build();
    }

    private PaymentCallbackResult handleVNPayCallback(Map<String, String> params) {
        String txnRef = params.get("vnp_TxnRef");
        if (txnRef == null || txnRef.isEmpty()) {
            return PaymentCallbackResult.builder()
                    .success(false)
                    .message("Mã tham chiếu đơn hàng VNPay không hợp lệ")
                    .build();
        }

        String bookingCode = txnRef.contains("_") ? txnRef.split("_")[0] : txnRef;
        Booking booking = bookingRepository.findByBookingCode(bookingCode).orElse(null);

        if (booking == null) {
            log.error("Booking not found for VNPay txnRef: {}, bookingCode: {}", txnRef, bookingCode);
            return PaymentCallbackResult.builder()
                    .success(false)
                    .message("Không tìm thấy đơn đặt vé cho mã giao dịch: " + bookingCode)
                    .build();
        }

        String responseCode = params.get("vnp_ResponseCode");
        String transactionStatus = params.getOrDefault("vnp_TransactionStatus", "00");

        boolean isSuccess = "00".equals(responseCode) && "00".equals(transactionStatus);

        if (isSuccess) {
            Booking confirmed = confirmPaymentSuccess(booking.getId());
            return PaymentCallbackResult.builder()
                    .success(true)
                    .bookingId(confirmed.getId())
                    .booking(getBookingResponse(confirmed))
                    .message("Thanh toán VNPay thành công")
                    .build();
        } else {
            log.warn("VNPay payment failed for booking {}: responseCode={}, transactionStatus={}",
                    bookingCode, responseCode, transactionStatus);
            return PaymentCallbackResult.builder()
                    .success(false)
                    .bookingId(booking.getId())
                    .message("Thanh toán VNPay không thành công hoặc bạn đã hủy giao dịch")
                    .build();
        }
    }

    private PaymentCallbackResult handleMoMoCallback(Map<String, String> params) {
        String extraData = params.get("extraData");
        Booking booking = null;

        if (extraData != null && !extraData.trim().isEmpty()) {
            try {
                UUID bookingId = UUID.fromString(extraData.trim());
                booking = bookingRepository.findById(bookingId).orElse(null);
            } catch (Exception ignored) {
            }
        }

        if (booking == null) {
            String orderId = params.get("orderId");
            if (orderId != null && !orderId.isEmpty()) {
                String bookingCode = orderId.contains("_") ? orderId.split("_")[0] : orderId;
                booking = bookingRepository.findByBookingCode(bookingCode).orElse(null);
            }
        }

        if (booking == null) {
            log.error("Booking not found for MoMo callback params: {}", params);
            return PaymentCallbackResult.builder()
                    .success(false)
                    .message("Không tìm thấy đơn đặt vé từ thông tin MoMo gửi về")
                    .build();
        }

        String resultCode = params.get("resultCode");
        boolean isSuccess = "0".equals(resultCode);

        if (isSuccess) {
            Booking confirmed = confirmPaymentSuccess(booking.getId());
            return PaymentCallbackResult.builder()
                    .success(true)
                    .bookingId(confirmed.getId())
                    .booking(getBookingResponse(confirmed))
                    .message("Thanh toán MoMo thành công")
                    .build();
        } else {
            String message = params.getOrDefault("message", "Thanh toán MoMo không thành công hoặc bạn đã hủy giao dịch");
            log.warn("MoMo payment failed for booking {}: resultCode={}, message={}",
                    booking.getBookingCode(), resultCode, message);
            return PaymentCallbackResult.builder()
                    .success(false)
                    .bookingId(booking.getId())
                    .message(message)
                    .build();
        }
    }

    private PaymentCallbackResult handleZaloPayCallback(Map<String, String> params) {
        String appTransId = params.get("apptransid");
        Booking booking = null;

        if (appTransId != null && !appTransId.isEmpty()) {
            // format: yyMMdd_bookingCode_timestamp
            String[] parts = appTransId.split("_");
            if (parts.length >= 2) {
                String bookingCode = parts[1];
                booking = bookingRepository.findByBookingCode(bookingCode).orElse(null);
            }
        }

        if (booking == null) {
            log.error("Booking not found for ZaloPay callback apptransid: {}", appTransId);
            return PaymentCallbackResult.builder()
                    .success(false)
                    .message("Không tìm thấy đơn đặt vé cho mã giao dịch ZaloPay: " + appTransId)
                    .build();
        }

        String status = params.get("status");
        boolean isSuccess = "1".equals(status);

        if (isSuccess) {
            Booking confirmed = confirmPaymentSuccess(booking.getId());
            return PaymentCallbackResult.builder()
                    .success(true)
                    .bookingId(confirmed.getId())
                    .booking(getBookingResponse(confirmed))
                    .message("Thanh toán ZaloPay thành công")
                    .build();
        } else {
            log.warn("ZaloPay payment failed for booking {}: status={}", booking.getBookingCode(), status);
            return PaymentCallbackResult.builder()
                    .success(false)
                    .bookingId(booking.getId())
                    .message("Thanh toán ZaloPay không thành công hoặc bạn đã hủy giao dịch")
                    .build();
        }
    }

    private BookingResponse getBookingResponse(Booking booking) {
        try {
            return applicationContext.getBean(BookingService.class).mapToBookingResponse(booking);
        } catch (Exception e) {
            log.warn("Could not map BookingResponse in PaymentService: {}", e.getMessage());
            return null;
        }
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
