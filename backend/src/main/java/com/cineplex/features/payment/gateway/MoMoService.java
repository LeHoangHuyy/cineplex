package com.cineplex.features.payment.gateway;

import com.cineplex.common.exceptions.BadRequestException;
import com.cineplex.features.booking.Booking;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MoMoService {

    @Value("${app.payment.momo.partner-code}")
    private String partnerCode;

    @Value("${app.payment.momo.access-key}")
    private String accessKey;

    @Value("${app.payment.momo.secret-key}")
    private String secretKey;

    @Value("${app.payment.momo.endpoint}")
    private String endpoint;

    @Value("${app.payment.momo.redirect-url}")
    private String redirectUrl;

    @Value("${app.payment.momo.ipn-url}")
    private String ipnUrl;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    public String createPaymentUrl(Booking booking) {
        long amount = booking.getTotalAmount().longValue();
        String orderId = booking.getBookingCode() + "_" + System.currentTimeMillis();
        String requestId = UUID.randomUUID().toString();
        String orderInfo = "Cineplex - Thanh toan ve " + booking.getBookingCode();
        String extraData = booking.getId().toString();
        String requestType = "captureWallet";

        String rawSignature = "accessKey=" + accessKey +
                "&amount=" + amount +
                "&extraData=" + extraData +
                "&ipnUrl=" + ipnUrl +
                "&orderId=" + orderId +
                "&orderInfo=" + orderInfo +
                "&partnerCode=" + partnerCode +
                "&redirectUrl=" + redirectUrl +
                "&requestId=" + requestId +
                "&requestType=" + requestType;

        String signature = hmacSHA256(secretKey, rawSignature);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("partnerCode", partnerCode);
        requestBody.put("partnerName", "Cineplex");
        requestBody.put("storeName", "Cineplex");
        requestBody.put("storeId", "Cineplex");
        requestBody.put("orderExpireTime", 5);
        requestBody.put("requestId", requestId);
        requestBody.put("amount", amount);
        requestBody.put("orderId", orderId);
        requestBody.put("orderInfo", orderInfo);
        requestBody.put("redirectUrl", redirectUrl);
        requestBody.put("ipnUrl", ipnUrl);
        requestBody.put("lang", "vi");
        requestBody.put("extraData", extraData);
        requestBody.put("requestType", requestType);
        requestBody.put("signature", signature);

        try {
            String jsonPayload = objectMapper.writeValueAsString(requestBody);
            log.info("Sending create payment request to MoMo: {}", jsonPayload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "application/json; charset=UTF-8")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("MoMo response status: {}, body: {}", response.statusCode(), response.body());

            JsonNode root = objectMapper.readTree(response.body());
            int resultCode = root.path("resultCode").asInt(-1);

            if (resultCode == 0 && root.has("payUrl")) {
                return root.get("payUrl").asText();
            } else {
                String message = root.path("message").asText("Không thể tạo liên kết thanh toán MoMo");
                log.error("MoMo payment creation error: resultCode={}, message={}", resultCode, message);
                throw new BadRequestException("MoMo Sandbox: " + message);
            }
        } catch (BadRequestException bre) {
            throw bre;
        } catch (Exception e) {
            log.error("Error creating MoMo payment URL", e);
            throw new BadRequestException("Không thể kết nối đến cổng thanh toán MoMo: " + e.getMessage());
        }
    }

    public boolean verifySignature(Map<String, String> params) {
        String signature = params.get("signature");
        if (signature == null || signature.isEmpty()) {
            return false;
        }

        String rawSignature = "accessKey=" + accessKey +
                "&amount=" + params.getOrDefault("amount", "") +
                "&extraData=" + params.getOrDefault("extraData", "") +
                "&message=" + params.getOrDefault("message", "") +
                "&orderId=" + params.getOrDefault("orderId", "") +
                "&orderInfo=" + params.getOrDefault("orderInfo", "") +
                "&orderType=" + params.getOrDefault("orderType", "") +
                "&partnerCode=" + params.getOrDefault("partnerCode", "") +
                "&payType=" + params.getOrDefault("payType", "") +
                "&requestId=" + params.getOrDefault("requestId", "") +
                "&responseTime=" + params.getOrDefault("responseTime", "") +
                "&resultCode=" + params.getOrDefault("resultCode", "") +
                "&transId=" + params.getOrDefault("transId", "");

        String calculatedSignature = hmacSHA256(secretKey, rawSignature);
        return calculatedSignature.equalsIgnoreCase(signature);
    }

    public static String hmacSHA256(String key, String data) {
        try {
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secret_key);
            byte[] bytes = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            log.error("Error computing MoMo HMAC-SHA256", ex);
            return "";
        }
    }
}
