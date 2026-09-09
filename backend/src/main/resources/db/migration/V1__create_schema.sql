-- ==========================================================
-- Flyway Migration: V1__create_schema.sql
-- Description: Create Cineplex Database Schema
-- ==========================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_CUSTOMER',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Movies Table
CREATE TABLE IF NOT EXISTS movies (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    duration_minutes INT NOT NULL,
    genre VARCHAR(255) NOT NULL,
    director VARCHAR(255),
    cast_members TEXT,
    poster_url TEXT NOT NULL,
    banner_url TEXT,
    trailer_url TEXT,
    age_rating VARCHAR(50) NOT NULL DEFAULT 'P',
    release_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'NOW_SHOWING',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Cinemas Table
CREATE TABLE IF NOT EXISTS cinemas (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    image_url TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY,
    cinema_id UUID NOT NULL REFERENCES cinemas(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    total_rows INT NOT NULL DEFAULT 8,
    total_cols INT NOT NULL DEFAULT 12,
    room_type VARCHAR(50) NOT NULL DEFAULT 'STANDARD_2D',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Seats Table
CREATE TABLE IF NOT EXISTS seats (
    id UUID PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    seat_row VARCHAR(10) NOT NULL,
    seat_number INT NOT NULL,
    seat_code VARCHAR(20) NOT NULL,
    seat_type VARCHAR(50) NOT NULL DEFAULT 'REGULAR',
    row_index INT NOT NULL DEFAULT 0,
    col_index INT NOT NULL DEFAULT 0,
    CONSTRAINT uq_room_seat UNIQUE (room_id, seat_row, seat_number)
);

-- 6. Showtimes Table
CREATE TABLE IF NOT EXISTS showtimes (
    id UUID PRIMARY KEY,
    movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    end_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    base_price DECIMAL(12, 2) NOT NULL DEFAULT 80000.00,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Showtime Seats Table
CREATE TABLE IF NOT EXISTS showtime_seats (
    id UUID PRIMARY KEY,
    showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    price DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    CONSTRAINT uq_showtime_seat UNIQUE (showtime_id, seat_id)
);

-- 8. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
    booking_code VARCHAR(50) NOT NULL UNIQUE,
    total_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    showtime_seat_id UUID NOT NULL REFERENCES showtime_seats(id) ON DELETE CASCADE,
    ticket_code VARCHAR(50) NOT NULL UNIQUE,
    price DECIMAL(12, 2) NOT NULL,
    qr_code_base64 TEXT,
    CONSTRAINT uq_ticket_seat UNIQUE (showtime_seat_id)
);

-- 10. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    transaction_code VARCHAR(64),
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    qr_code_data TEXT,
    qr_code_base64 TEXT,
    paid_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
CREATE INDEX IF NOT EXISTS idx_movies_slug ON movies(slug);
CREATE INDEX IF NOT EXISTS idx_showtimes_room_time ON showtimes(room_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_showtimes_movie_time ON showtimes(movie_id, start_time);
CREATE INDEX IF NOT EXISTS idx_showtime_seats_st ON showtime_seats(showtime_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id, status);
