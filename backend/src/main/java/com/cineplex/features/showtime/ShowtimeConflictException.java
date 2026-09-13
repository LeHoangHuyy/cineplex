package com.cineplex.features.showtime;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class ShowtimeConflictException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public ShowtimeConflictException(String message) {
        super(message);
    }
}

