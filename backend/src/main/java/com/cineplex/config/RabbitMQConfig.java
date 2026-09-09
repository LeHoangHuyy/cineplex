package com.cineplex.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class RabbitMQConfig {

    public static final String BOOKING_EXCHANGE = "cineplex.booking.exchange";
    public static final String BOOKING_TIMEOUT_ROUTING_KEY = "booking.timeout";
    public static final String BOOKING_PROCESS_ROUTING_KEY = "booking.process.expired";

    public static final String BOOKING_HOLD_QUEUE = "cineplex.booking.hold.queue";
    public static final String BOOKING_EXPIRED_QUEUE = "cineplex.booking.expired.queue";

    public static final String TICKET_EXCHANGE = "cineplex.ticket.exchange";
    public static final String TICKET_GENERATE_QUEUE = "cineplex.ticket.generate.queue";
    public static final String TICKET_GENERATE_ROUTING_KEY = "ticket.generate";

    @Bean
    public DirectExchange bookingExchange() {
        return new DirectExchange(BOOKING_EXCHANGE, true, false);
    }

    @Bean
    public DirectExchange ticketExchange() {
        return new DirectExchange(TICKET_EXCHANGE, true, false);
    }

    /**
     * Dead-letter queue pattern for delayed booking expiration:
     * When messages in BOOKING_HOLD_QUEUE expire (TTL = 300,000ms = 5 mins),
     * they are forwarded via dead-letter exchange to BOOKING_EXPIRED_QUEUE.
     */
    @Bean
    public Queue bookingHoldQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", BOOKING_EXCHANGE);
        args.put("x-dead-letter-routing-key", BOOKING_PROCESS_ROUTING_KEY);
        args.put("x-message-ttl", 300000); // 5 minutes TTL
        return new Queue(BOOKING_HOLD_QUEUE, true, false, false, args);
    }

    @Bean
    public Queue bookingExpiredQueue() {
        return new Queue(BOOKING_EXPIRED_QUEUE, true);
    }

    @Bean
    public Queue ticketGenerateQueue() {
        return new Queue(TICKET_GENERATE_QUEUE, true);
    }

    @Bean
    public Binding bindingHoldQueue() {
        return BindingBuilder.bind(bookingHoldQueue()).to(bookingExchange()).with(BOOKING_TIMEOUT_ROUTING_KEY);
    }

    @Bean
    public Binding bindingExpiredQueue() {
        return BindingBuilder.bind(bookingExpiredQueue()).to(bookingExchange()).with(BOOKING_PROCESS_ROUTING_KEY);
    }

    @Bean
    public Binding bindingTicketQueue() {
        return BindingBuilder.bind(ticketGenerateQueue()).to(ticketExchange()).with(TICKET_GENERATE_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}
