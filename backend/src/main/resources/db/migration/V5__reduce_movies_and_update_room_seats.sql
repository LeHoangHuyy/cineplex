-- ==========================================================
-- Flyway Migration: V5__reduce_movies_and_update_room_seats.sql
-- Description: Keep exactly 12 Now Showing & 6 Coming Soon movies;
--              Update all rooms to 28 seats (A->D, 1->7) without couple seats.
-- ==========================================================

-- 1. DELETE UNWANTED MOVIES (CASCADE deletes associated showtimes and showtime_seats)
-- Keep exactly 12 NOW_SHOWING movies:
-- 0001 (Dune 2), 0002 (Godzilla x Kong), 0003 (Mai), 0004 (Kung Fu Panda 4), 0005 (Exhuma),
-- 0010 (Oppenheimer), 0011 (Avatar 2), 0012 (Spider-Man), 0013 (Interstellar),
-- 0014 (John Wick 4), 0015 (Top Gun: Maverick), 0034 (Avengers: Endgame)
DELETE FROM movies
WHERE status = 'NOW_SHOWING'
  AND id NOT IN (
    '30000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000010',
    '30000000-0000-0000-0000-000000000011',
    '30000000-0000-0000-0000-000000000012',
    '30000000-0000-0000-0000-000000000013',
    '30000000-0000-0000-0000-000000000014',
    '30000000-0000-0000-0000-000000000015',
    '30000000-0000-0000-0000-000000000034'
);

-- Keep exactly 6 COMING_SOON movies:
-- 0006 (Deadpool & Wolverine), 0007 (Lật Mặt 7), 0040 (Joker 2),
-- 0041 (Despicable Me 4), 0042 (Venom 3), 0043 (Gladiator II)
DELETE FROM movies
WHERE status = 'COMING_SOON'
  AND id NOT IN (
    '30000000-0000-0000-0000-000000000006',
    '30000000-0000-0000-0000-000000000007',
    '30000000-0000-0000-0000-000000000040',
    '30000000-0000-0000-0000-000000000041',
    '30000000-0000-0000-0000-000000000042',
    '30000000-0000-0000-0000-000000000043'
);

-- 2. UPDATE ALL ROOMS TO 4 ROWS, 7 COLS (28 SEATS TOTAL, ROWS A -> D, COLS 1 -> 7)
UPDATE rooms
SET total_rows = 4,
    total_cols = 7,
    updated_at = NOW();

-- 3. RE-GENERATE SEATS FOR ALL ROOMS
-- Delete existing seats (cascades to old showtime_seats)
DELETE FROM seats;

-- Generate 28 seats for each room (A->D, 1->7, No couple seats: Rows A-B REGULAR, Rows C-D VIP)
DO $$
DECLARE
    r RECORD;
    r_idx INT;
    c_idx INT;
    row_char VARCHAR(5);
    seat_t VARCHAR(50);
    seat_num INT;
    seat_c VARCHAR(20);
BEGIN
    FOR r IN SELECT id FROM rooms LOOP
        FOR r_idx IN 0..3 LOOP
            row_char := CHR(65 + r_idx); -- 'A', 'B', 'C', 'D'

            -- Rows A, B: REGULAR; Rows C, D: VIP (No couple seats)
            IF r_idx >= 2 THEN
                seat_t := 'VIP';
            ELSE
                seat_t := 'REGULAR';
            END IF;

            FOR c_idx IN 0..6 LOOP
                seat_num := c_idx + 1; -- 1 to 7
                seat_c := row_char || LPAD(seat_num::TEXT, 2, '0');

                INSERT INTO seats (id, room_id, seat_row, seat_number, seat_code, seat_type, row_index, col_index)
                VALUES (gen_random_uuid(), r.id, row_char, seat_num, seat_c, seat_t, r_idx, c_idx);
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- 4. RE-GENERATE SHOWTIME SEATS FOR EXISTING SHOWTIMES
DO $$
DECLARE
    st RECORD;
    s RECORD;
    seat_price DECIMAL(12, 2);
BEGIN
    FOR st IN SELECT id, room_id, base_price FROM showtimes LOOP
        FOR s IN SELECT id, seat_type FROM seats WHERE room_id = st.room_id LOOP
            IF s.seat_type = 'VIP' THEN
                seat_price := ROUND(st.base_price * 1.20, 2);
            ELSE
                seat_price := st.base_price;
            END IF;

            INSERT INTO showtime_seats (id, showtime_id, seat_id, price, status)
            VALUES (gen_random_uuid(), st.id, s.id, seat_price, 'AVAILABLE')
            ON CONFLICT (showtime_id, seat_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 5. ADD SHOWTIMES FOR ROOM 04 AND ROOM 05 (Kung Fu Panda 4 and Quật Mộ Trùng Ma)
DO $$
DECLARE
    d INT;
    st_time TIMESTAMP;
    end_time TIMESTAMP;
    st_id UUID;
    s RECORD;
    seat_price DECIMAL(12, 2);
    hour_val INT;
BEGIN
    FOR d IN 0..6 LOOP
        FOREACH hour_val IN ARRAY ARRAY[10, 15, 20] LOOP
            -- Showtime for Room 04 (4DX Motion Landmark 81): Kung Fu Panda 4
            st_time := CURRENT_DATE + d + (hour_val || ' hours 00 minutes')::INTERVAL;
            end_time := st_time + INTERVAL '1 hour 45 minutes';
            st_id := gen_random_uuid();

            INSERT INTO showtimes (id, movie_id, room_id, start_time, end_time, base_price, status, created_at, updated_at)
            VALUES (st_id, '30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', st_time, end_time, 110000.00, 'SCHEDULED', NOW(), NOW());

            FOR s IN SELECT id, seat_type FROM seats WHERE room_id = '20000000-0000-0000-0000-000000000004' LOOP
                IF s.seat_type = 'VIP' THEN
                    seat_price := ROUND(110000.00 * 1.20, 2);
                ELSE
                    seat_price := 110000.00;
                END IF;

                INSERT INTO showtime_seats (id, showtime_id, seat_id, price, status)
                VALUES (gen_random_uuid(), st_id, s.id, seat_price, 'AVAILABLE')
                ON CONFLICT (showtime_id, seat_id) DO NOTHING;
            END LOOP;

            -- Showtime for Room 05 (Phòng Chiếu 01 Đà Nẵng): Quật Mộ Trùng Ma
            st_time := CURRENT_DATE + d + (hour_val || ' hours 15 minutes')::INTERVAL;
            end_time := st_time + INTERVAL '2 hours 30 minutes';
            st_id := gen_random_uuid();

            INSERT INTO showtimes (id, movie_id, room_id, start_time, end_time, base_price, status, created_at, updated_at)
            VALUES (st_id, '30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', st_time, end_time, 85000.00, 'SCHEDULED', NOW(), NOW());

            FOR s IN SELECT id, seat_type FROM seats WHERE room_id = '20000000-0000-0000-0000-000000000005' LOOP
                IF s.seat_type = 'VIP' THEN
                    seat_price := ROUND(85000.00 * 1.20, 2);
                ELSE
                    seat_price := 85000.00;
                END IF;

                INSERT INTO showtime_seats (id, showtime_id, seat_id, price, status)
                VALUES (gen_random_uuid(), st_id, s.id, seat_price, 'AVAILABLE')
                ON CONFLICT (showtime_id, seat_id) DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
