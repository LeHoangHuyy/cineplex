package com.cineplex.features.booking;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class SeatLockConflictException extends RuntimeException {
    public SeatLockConflictException(String message) {
        super(message);
    }
}

