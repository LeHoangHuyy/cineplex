package com.cineplex.features.showtime;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class ShowtimeConflictException extends RuntimeException {
    public ShowtimeConflictException(String message) {
        super(message);
    }
}

