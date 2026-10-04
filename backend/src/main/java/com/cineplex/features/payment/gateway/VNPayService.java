package com.cineplex.features.payment.gateway;

import com.cineplex.features.booking.Booking;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class VNPayService {

    @Value("${app.payment.vnpay.tmn-code}")
    private String tmnCode;

    @Value("${app.payment.vnpay.hash-secret}")
    private String hashSecret;

    @Value("${app.payment.vnpay.pay-url}")
    private String payUrl;

    @Value("${app.payment.vnpay.return-url}")
    private String returnUrl;

    public String createPaymentUrl(Booking booking, HttpServletRequest request) {
        long amount = booking.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue();
        String vnpTxnRef = booking.getBookingCode() + "_" + System.currentTimeMillis();
        String ipAddress = getClientIp(request);

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", tmnCode);
        vnpParams.put("vnp_Amount", String.valueOf(amount));
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", vnpTxnRef);
        vnpParams.put("vnp_OrderInfo", "Cineplex - Thanh toan ve " + booking.getBookingCode());
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", returnUrl);
        vnpParams.put("vnp_IpAddr", ipAddress);

        ZonedDateTime now = ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

        String createDate = now.format(formatter);
        vnpParams.put("vnp_CreateDate", createDate);

        String expireDate = now.plusMinutes(5).format(formatter);
        vnpParams.put("vnp_ExpireDate", expireDate);

        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        for (String fieldName : fieldNames) {
            String fieldValue = vnpParams.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                if (!hashData.isEmpty()) {
                    hashData.append('&');
                    query.append('&');
                }
                String encodedKey = URLEncoder.encode(fieldName, StandardCharsets.UTF_8);
                String encodedVal = URLEncoder.encode(fieldValue, StandardCharsets.UTF_8);
                hashData.append(fieldName).append('=').append(encodedVal);
                query.append(encodedKey).append('=').append(encodedVal);
            }
        }

        String secureHash = hmacSHA512(hashSecret, hashData.toString());
        String fullUrl = payUrl + "?" + query.toString() + "&vnp_SecureHash=" + secureHash;

        log.info("VNPay payment URL created for booking {}: {}", booking.getBookingCode(), fullUrl);
        return fullUrl;
    }

    public static String hmacSHA512(String key, String data) {
        try {
            if (key == null || data == null) {
                return "";
            }
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKey);
            byte[] result = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            log.error("Error computing VNPay HMAC-SHA512", ex);
            return "";
        }
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return "127.0.0.1";
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            ip = "127.0.0.1";
        }
        return ip != null ? ip : "127.0.0.1";
    }
}
