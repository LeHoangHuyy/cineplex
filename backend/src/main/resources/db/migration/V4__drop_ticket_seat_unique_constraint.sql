-- Drop the overly restrictive unique constraint on tickets.showtime_seat_id
-- which prevented re-booking seats after bookings expired or were abandoned.
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS uq_ticket_seat;
