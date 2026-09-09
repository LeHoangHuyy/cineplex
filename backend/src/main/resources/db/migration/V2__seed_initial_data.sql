-- ==========================================================
-- Flyway Migration: V2__seed_initial_data.sql
-- Description: Seed initial Users, Cinemas, Rooms, Seats, Movies, and Showtimes
-- ==========================================================

-- 1. Users (Admin: admin123, Customer: user123)
INSERT INTO users (id, email, password, full_name, phone, role, status, created_at, updated_at)
VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@cineplex.vn', '$2a$10$.gCD9P9FpreAsuUB/eIY.u7FEp5e7PRp3ibL5dsKjgm4eiJDbV3z.', 'Quản Trị Viên Cineplex', '0901234567', 'ROLE_ADMIN', 'ACTIVE', NOW(), NOW()),
('c0000000-0000-0000-0000-000000000001', 'customer@cineplex.vn', '$2a$10$wju7g9ubOkmqdxizD.k2Ju88t1TcvP.Hk/RPPVbGmoiJmvEhoqe6u', 'Nguyễn Văn Khách', '0987654321', 'ROLE_CUSTOMER', 'ACTIVE', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 2. Cinemas
INSERT INTO cinemas (id, name, address, city, phone, image_url, created_at, updated_at)
VALUES
('10000000-0000-0000-0000-000000000001', 'Cineplex Vincom Bà Triệu', 'Tầng 6, Vincom Center, 191 Bà Triệu, Q. Hai Bà Trưng', 'Hà Nội', '024.3974.3333', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80', NOW(), NOW()),
('10000000-0000-0000-0000-000000000002', 'Cineplex Landmark 81', 'Tầng B1, Vincom Landmark 81, 720A Điện Biên Phủ, Q. Bình Thạnh', 'TP. Hồ Chí Minh', '028.3636.8181', 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&q=80', NOW(), NOW()),
('10000000-0000-0000-0000-000000000003', 'Cineplex Riverside Đà Nẵng', 'Tầng 4, TTTM Vincom Plaza, Ngô Quyền, Q. Sơn Trà', 'Đà Nẵng', '0236.3636.999', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Rooms
INSERT INTO rooms (id, cinema_id, name, total_rows, total_cols, room_type, created_at, updated_at)
VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Phòng IMAX Laser 01', 8, 12, 'IMAX_3D', NOW(), NOW()),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Phòng Chiếu 02', 8, 12, 'STANDARD_2D', NOW(), NOW()),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Phòng IMAX Laser 01', 8, 12, 'IMAX_3D', NOW(), NOW()),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Phòng 4DX Motion 02', 6, 10, 'FOUR_DX', NOW(), NOW()),
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'Phòng Chiếu 01', 8, 12, 'STANDARD_2D', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Dynamic Seat Generation for All 5 Rooms
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
    FOR r IN SELECT id, total_rows, total_cols FROM rooms LOOP
        FOR r_idx IN 0..(r.total_rows - 1) LOOP
            row_char := CHR(65 + r_idx); -- 'A', 'B', 'C'...
            
            -- Determine Seat Type based on row position
            IF r_idx = (r.total_rows - 1) THEN
                seat_t := 'COUPLE';
            ELSIF r_idx >= 3 AND r_idx <= 5 THEN
                seat_t := 'VIP';
            ELSE
                seat_t := 'REGULAR';
            END IF;

            FOR c_idx IN 0..(r.total_cols - 1) LOOP
                seat_num := c_idx + 1;
                seat_c := row_char || LPAD(seat_num::TEXT, 2, '0');

                INSERT INTO seats (id, room_id, seat_row, seat_number, seat_code, seat_type, row_index, col_index)
                VALUES (gen_random_uuid(), r.id, row_char, seat_num, seat_c, seat_t, r_idx, c_idx)
                ON CONFLICT (room_id, seat_row, seat_number) DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- 5. Movies
INSERT INTO movies (id, title, slug, description, duration_minutes, genre, director, cast_members, poster_url, banner_url, trailer_url, age_rating, release_date, status, created_at, updated_at)
VALUES
(
    '30000000-0000-0000-0000-000000000001',
    'Dune: Hành Tinh Cát - Phần 2',
    'dune-hanh-tinh-cat-phan-2',
    'Paul Atreides hợp nhất cùng Chani và tộc người Fremen khi đang tìm cách trả thù những kẻ đã hủy hoại gia đình mình. Đứng trước sự lựa chọn giữa tình yêu của đời mình và số phận của vũ trụ, anh phải nỗ lực ngăn chặn một tương lai khủng khiếp mà chỉ mình anh có thể thấy trước.',
    166,
    'Hành Động, Viễn Tưởng, Phiêu Lưu',
    'Denis Villeneuve',
    'Timothée Chalamet, Zendaya, Rebecca Ferguson, Javier Bardem, Austin Butler',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80',
    'https://www.youtube.com/watch?v=Way9Dexny3w',
    'T16',
    '2026-03-01',
    'NOW_SHOWING',
    NOW(),
    NOW()
),
(
    '30000000-0000-0000-0000-000000000002',
    'Godzilla x Kong: Đế Chế Mới',
    'godzilla-x-kong-de-che-moi',
    'Hai quái thú cổ đại hùng mạnh nhất hành tinh - Godzilla và Kong đối mặt với một mối đe dọa to lớn tiềm ẩn sâu bên trong Trái Đất, thách thức sự tồn vong của chính giống loài của chúng và cả toàn nhân loại.',
    115,
    'Hành Động, Viễn Tưởng, Quái Thú',
    'Adam Wingard',
    'Rebecca Hall, Brian Tyree Henry, Dan Stevens, Kaylee Hottle',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&q=80',
    'https://www.youtube.com/watch?v=lV1OOlGwExg',
    'T13',
    '2026-03-29',
    'NOW_SHOWING',
    NOW(),
    NOW()
),
(
    '30000000-0000-0000-0000-000000000003',
    'Mai - Trấn Thành Film',
    'mai-tran-thanh-film',
    'Câu chuyện tình yêu đầy trắc trở giữa Mai - một nhân viên mát-xa chịu nhiều định kiến xã hội và Dương - một chàng nhạc công đào hoa phong nhã. Phim khắc họa sâu sắc những vết thương tâm lý và khát khao hạnh phúc.',
    131,
    'Tâm Lý, Tình Cảm, Gia Đình',
    'Trấn Thành',
    'Phương Anh Đào, Tuấn Trần, Trấn Thành, Hồng Đào, Uyển Ân',
    'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80',
    'https://www.youtube.com/watch?v=hzpkW1Vj6kY',
    'T18',
    '2026-02-10',
    'NOW_SHOWING',
    NOW(),
    NOW()
),
(
    '30000000-0000-0000-0000-000000000004',
    'Kung Fu Panda 4',
    'kung-fu-panda-4',
    'Po chuẩn bị trở thành Thủ lĩnh Tinh thần của Thung lũng Hòa Bình, nhưng trước hết chú phải tìm và huấn luyện một Thần Long Đại Hiệp mới trong khi đối đầu với mụ phù thủy Tắc Kè Hoa có khả năng biến hình tàn ác.',
    94,
    'Hoạt Hình, Hài Hước, Võ Thuật',
    'Mike Mitchell',
    'Jack Black, Awkwafina, Viola Davis, Dustin Hoffman, Bryan Cranston',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=80',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&q=80',
    'https://www.youtube.com/watch?v=_inKs4eeHiI',
    'P',
    '2026-03-08',
    'NOW_SHOWING',
    NOW(),
    NOW()
),
(
    '30000000-0000-0000-0000-000000000005',
    'Quật Mộ Trùng Ma (Exhuma)',
    'quat-mo-trung-ma-exhuma',
    'Hai pháp sư trẻ tuổi, một chuyên gia phong thủy và một nhân viên tang lễ nhận khoản tiền kếch xù để di dời một ngôi mộ bí ẩn nằm ở vùng hẻo lánh của gia tộc giàu có, từ đó giải phóng một thế lực tà ác cổ xưa nghìn năm.',
    134,
    'Kinh Dị, Bí Ẩn, Giật Gân',
    'Jang Jae-hyun',
    'Choi Min-sik, Kim Go-eun, Yoo Hae-jin, Lee Do-hyun',
    'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&q=80',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&q=80',
    'https://www.youtube.com/watch?v=bF9K09ZlKoc',
    'T16',
    '2026-03-15',
    'NOW_SHOWING',
    NOW(),
    NOW()
),
(
    '30000000-0000-0000-0000-000000000006',
    'Deadpool & Wolverine',
    'deadpool-and-wolverine',
    'Tổ chức Phương sai Thời gian (TVA) lôi kéo gã dị nhân lắm lời Wade Wilson vào một nhiệm vụ đa vũ trụ sống còn, buộc anh phải hợp tác cùng Người Sói Wolverine huyền thoại.',
    127,
    'Hành Động, Siêu Anh Hùng, Hài Hước',
    'Shawn Levy',
    'Ryan Reynolds, Hugh Jackman, Emma Corrin, Matthew Macfadyen',
    'https://images.unsplash.com/photo-1568832359672-e36cf5d74f54?w=600&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80',
    'https://www.youtube.com/watch?v=73_1biulkYk',
    'T18',
    '2026-07-26',
    'COMING_SOON',
    NOW(),
    NOW()
),
(
    '30000000-0000-0000-0000-000000000007',
    'Lật Mặt 7: Một Điều Ước',
    'lat-mat-7-mot-dieu-uoc',
    'Bộ phim gia đình giàu cảm xúc của đạo diễn Lý Hải kể về người mẹ già 73 tuổi một mình nuôi nấng 5 người con khôn lớn. Khi bà gặp nạn gãy chân, câu chuyện trách nhiệm và lòng hiếu thảo giữa các con được mở ra.',
    138,
    'Tâm Lý, Tình Cảm, Gia Đình',
    'Lý Hải',
    'Thanh Hiền, Trương Minh Cường, Đinh Y Nhung, Quách Ngọc Tuyên, Trâm Anh',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&q=80',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&q=80',
    'https://www.youtube.com/watch?v=4PzI4qFm81M',
    'K',
    '2026-04-26',
    'COMING_SOON',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 6. Showtimes for 7 Days & Showtime Seats Generation
DO $$
DECLARE
    m RECORD;
    r RECORD;
    d INT;
    st_time TIMESTAMP;
    end_time TIMESTAMP;
    st_id UUID;
    s RECORD;
    seat_price DECIMAL(12, 2);
    hour_val INT;
BEGIN
    FOR d IN 0..6 LOOP
        -- For Day d, schedule showtimes at 09:30, 14:00, 19:30
        FOREACH hour_val IN ARRAY ARRAY[9, 14, 19] LOOP
            st_time := CURRENT_DATE + d + (hour_val || ' hours 30 minutes')::INTERVAL;
            end_time := st_time + INTERVAL '2 hours 45 minutes';

            -- Showtime 1: Dune 2 at Room IMAX Bà Triệu
            st_id := gen_random_uuid();
            INSERT INTO showtimes (id, movie_id, room_id, start_time, end_time, base_price, status, created_at, updated_at)
            VALUES (st_id, '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', st_time, end_time, 100000.00, 'SCHEDULED', NOW(), NOW());

            FOR s IN SELECT id, seat_type FROM seats WHERE room_id = '20000000-0000-0000-0000-000000000001' LOOP
                IF s.seat_type = 'VIP' THEN
                    seat_price := 100000.00 * 1.2;
                ELSIF s.seat_type = 'COUPLE' THEN
                    seat_price := 100000.00 * 1.8;
                ELSE
                    seat_price := 100000.00;
                END IF;

                INSERT INTO showtime_seats (id, showtime_id, seat_id, price, status)
                VALUES (gen_random_uuid(), st_id, s.id, seat_price, 'AVAILABLE')
                ON CONFLICT (showtime_id, seat_id) DO NOTHING;
            END LOOP;

            -- Showtime 2: Godzilla x Kong at Room 02 Bà Triệu
            st_id := gen_random_uuid();
            INSERT INTO showtimes (id, movie_id, room_id, start_time, end_time, base_price, status, created_at, updated_at)
            VALUES (st_id, '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', st_time, end_time, 80000.00, 'SCHEDULED', NOW(), NOW());

            FOR s IN SELECT id, seat_type FROM seats WHERE room_id = '20000000-0000-0000-0000-000000000002' LOOP
                IF s.seat_type = 'VIP' THEN
                    seat_price := 80000.00 * 1.2;
                ELSIF s.seat_type = 'COUPLE' THEN
                    seat_price := 80000.00 * 1.8;
                ELSE
                    seat_price := 80000.00;
                END IF;

                INSERT INTO showtime_seats (id, showtime_id, seat_id, price, status)
                VALUES (gen_random_uuid(), st_id, s.id, seat_price, 'AVAILABLE')
                ON CONFLICT (showtime_id, seat_id) DO NOTHING;
            END LOOP;

            -- Showtime 3: Mai at Landmark 81 IMAX
            st_id := gen_random_uuid();
            INSERT INTO showtimes (id, movie_id, room_id, start_time, end_time, base_price, status, created_at, updated_at)
            VALUES (st_id, '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', st_time, end_time, 90000.00, 'SCHEDULED', NOW(), NOW());

            FOR s IN SELECT id, seat_type FROM seats WHERE room_id = '20000000-0000-0000-0000-000000000003' LOOP
                IF s.seat_type = 'VIP' THEN
                    seat_price := 90000.00 * 1.2;
                ELSIF s.seat_type = 'COUPLE' THEN
                    seat_price := 90000.00 * 1.8;
                ELSE
                    seat_price := 90000.00;
                END IF;

                INSERT INTO showtime_seats (id, showtime_id, seat_id, price, status)
                VALUES (gen_random_uuid(), st_id, s.id, seat_price, 'AVAILABLE')
                ON CONFLICT (showtime_id, seat_id) DO NOTHING;
            END LOOP;

        END LOOP;
    END LOOP;
END $$;
