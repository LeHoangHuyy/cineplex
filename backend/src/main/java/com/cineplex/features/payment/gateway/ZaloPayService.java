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
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ZaloPayService {

    @Value("${app.payment.zalopay.app-id}")
    private String appId;

    @Value("${app.payment.zalopay.key1}")
    private String key1;

    @Value("${app.payment.zalopay.endpoint}")
    private String endpoint;

    @Value("${app.payment.zalopay.redirect-url}")
    private String redirectUrl;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    public String createPaymentUrl(Booking booking) {
        int appIdInt = Integer.parseInt(appId);
        long appTime = System.currentTimeMillis();
        long amount = booking.getTotalAmount().longValue();

        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
        // app_trans_id format: yyMMdd_unique (max length 40 chars)
        String appTransId = datePrefix + "_" + booking.getBookingCode() + "_" + (System.currentTimeMillis() % 100000);

        String appUser = (booking.getUser() != null && booking.getUser().getFullName() != null)
                ? booking.getUser().getFullName()
                : "CineplexUser";

        String item = "[]";
        Map<String, String> embedDataMap = new HashMap<>();
        embedDataMap.put("redirecturl", redirectUrl);
        embedDataMap.put("store_name", "Cineplex");

        String embedData;
        try {
            embedData = objectMapper.writeValueAsString(embedDataMap);
        } catch (Exception e) {
            embedData = "{\"redirecturl\":\"" + redirectUrl + "\",\"store_name\":\"Cineplex\"}";
        }

        String description = "Cineplex - Thanh toan ve " + booking.getBookingCode();
        String bankCode = ""; // Empty string for QR scan checkout

        String rawData = appIdInt + "|" + appTransId + "|" + appUser + "|" + amount + "|" + appTime + "|" + embedData + "|" + item;
        String mac = hmacSHA256(key1, rawData);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("app_id", appIdInt);
        requestBody.put("app_user", appUser);
        requestBody.put("app_trans_id", appTransId);
        requestBody.put("app_time", appTime);
        requestBody.put("expire_duration_seconds", 300L); // 5 minutes expiration
        requestBody.put("sub_app_id", "Cineplex");
        requestBody.put("amount", amount);
        requestBody.put("item", item);
        requestBody.put("description", description);
        requestBody.put("embed_data", embedData);
        requestBody.put("bank_code", bankCode);
        requestBody.put("mac", mac);

        try {
            String jsonPayload = objectMapper.writeValueAsString(requestBody);
            log.info("Sending create payment request to ZaloPay: {}", jsonPayload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "application/json; charset=UTF-8")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("ZaloPay response status: {}, body: {}", response.statusCode(), response.body());

            JsonNode root = objectMapper.readTree(response.body());
            int returnCode = root.path("return_code").asInt(-1);

            if (returnCode == 1 && root.has("order_url")) {
                return root.get("order_url").asText();
            } else {
                String returnMessage = root.path("return_message").asText("Không thể tạo liên kết thanh toán ZaloPay");
                log.error("ZaloPay payment creation error: returnCode={}, message={}", returnCode, returnMessage);
                throw new BadRequestException("ZaloPay Sandbox: " + returnMessage);
            }
        } catch (BadRequestException bre) {
            throw bre;
        } catch (Exception e) {
            log.error("Error creating ZaloPay payment URL", e);
            throw new BadRequestException("Không thể kết nối đến cổng thanh toán ZaloPay: " + e.getMessage());
        }
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
            log.error("Error computing ZaloPay HMAC-SHA256", ex);
            return "";
        }
    }
}
