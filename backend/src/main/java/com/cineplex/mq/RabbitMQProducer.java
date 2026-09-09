package com.cineplex.mq;

import com.cineplex.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RabbitMQProducer {

    private final RabbitTemplate rabbitTemplate;

    public void sendBookingHoldTimeout(UUID bookingId) {
        Map<String, Object> message = new HashMap<>();
        message.put("bookingId", bookingId.toString());
        message.put("timestamp", System.currentTimeMillis());

        log.info("Sending booking hold message to RabbitMQ hold queue for bookingId: {}", bookingId);
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.BOOKING_EXCHANGE,
                RabbitMQConfig.BOOKING_TIMEOUT_ROUTING_KEY,
                message
        );
    }

    public void sendTicketGenerateEvent(UUID bookingId) {
        Map<String, Object> message = new HashMap<>();
        message.put("bookingId", bookingId.toString());
        message.put("timestamp", System.currentTimeMillis());

        log.info("Sending ticket generate event to RabbitMQ for bookingId: {}", bookingId);
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.TICKET_EXCHANGE,
                RabbitMQConfig.TICKET_GENERATE_ROUTING_KEY,
                message
        );
    }
}
