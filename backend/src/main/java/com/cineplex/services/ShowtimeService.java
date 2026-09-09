package com.cineplex.services;

import com.cineplex.dtos.common.PageResponse;
import com.cineplex.dtos.showtime.ShowtimeRequest;
import com.cineplex.dtos.showtime.ShowtimeResponse;
import com.cineplex.dtos.showtime.ShowtimeSeatDto;
import com.cineplex.entities.*;
import com.cineplex.exceptions.ResourceNotFoundException;
import com.cineplex.exceptions.ShowtimeConflictException;
import com.cineplex.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShowtimeService {

    private final ShowtimeRepository showtimeRepository;
    private final ShowtimeSeatRepository showtimeSeatRepository;
    private final MovieRepository movieRepository;
    private final RoomRepository roomRepository;
    private final SeatRepository seatRepository;
    private final MovieService movieService;
    private final CinemaService cinemaService;
    private final SeatLockService seatLockService;

    @Value("${app.booking.cleaning-buffer-minutes:15}")
    private int cleaningBufferMinutes;

    @Transactional(readOnly = true)
    public List<ShowtimeResponse> getShowtimesByMovieAndDate(UUID movieId, LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

        List<Showtime> showtimes = showtimeRepository.findByMovieAndDate(movieId, startOfDay, endOfDay);
        return showtimes.stream().map(this::mapToShowtimeResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ShowtimeResponse> getShowtimesByCinemaAndDate(UUID cinemaId, LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

        List<Showtime> showtimes = showtimeRepository.findByCinemaAndDate(cinemaId, startOfDay, endOfDay);
        return showtimes.stream().map(this::mapToShowtimeResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<ShowtimeResponse> getAllShowtimes(UUID cinemaId, String search, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        Page<Showtime> showtimePage = showtimeRepository.searchShowtimes(cinemaId, cleanSearch, pageable);

        List<ShowtimeResponse> content = showtimePage.getContent().stream()
                .map(this::mapToShowtimeResponse)
                .collect(Collectors.toList());

        return PageResponse.of(showtimePage, content);
    }

    @Transactional(readOnly = true)
    public PageResponse<ShowtimeResponse> getAllShowtimes(UUID cinemaId, Pageable pageable) {
        return getAllShowtimes(cinemaId, null, pageable);
    }

    @Transactional(readOnly = true)
    public List<ShowtimeResponse> getAllShowtimes(UUID cinemaId) {
        List<Showtime> showtimes = (cinemaId != null)
                ? showtimeRepository.findByRoomCinemaIdOrderByStartTimeDesc(cinemaId)
                : showtimeRepository.findAllByOrderByStartTimeDesc();

        return showtimes.stream().map(this::mapToShowtimeResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ShowtimeResponse getShowtimeById(UUID id) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy suất chiếu với ID: " + id));
        return mapToShowtimeResponse(showtime);
    }

    @Transactional(readOnly = true)
    public List<ShowtimeSeatDto> getShowtimeSeats(UUID showtimeId, UUID currentUserId) {
        List<ShowtimeSeat> showtimeSeats = showtimeSeatRepository.findByShowtimeIdWithSeatOrderByPosition(showtimeId);

        return showtimeSeats.stream().map(ss -> {
            Seat seat = ss.getSeat();
            String status = "AVAILABLE";
            boolean isHeldByCurrentUser = false;

            if (ss.getStatus() == ShowtimeSeatStatus.BOOKED) {
                status = "BOOKED";
            } else if (seatLockService.isSeatLocked(showtimeId, seat.getId())) {
                status = "HOLDING";
                if (currentUserId != null && seatLockService.isSeatHeldByUser(showtimeId, seat.getId(), currentUserId)) {
                    isHeldByCurrentUser = true;
                }
            }

            return ShowtimeSeatDto.builder()
                    .showtimeSeatId(ss.getId())
                    .seatId(seat.getId())
                    .seatRow(seat.getSeatRow())
                    .seatNumber(seat.getSeatNumber())
                    .seatCode(seat.getSeatCode())
                    .seatType(seat.getSeatType())
                    .rowIndex(seat.getRowIndex())
                    .colIndex(seat.getColIndex())
                    .price(ss.getPrice())
                    .status(status)
                    .isHeldByCurrentUser(isHeldByCurrentUser)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public ShowtimeResponse createShowtime(ShowtimeRequest request) {
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phim với ID: " + request.getMovieId()));

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng chiếu với ID: " + request.getRoomId()));

        LocalDateTime startTime = request.getStartTime();
        // EndTime = StartTime + Movie Duration + Cleaning Buffer
        LocalDateTime endTime = startTime.plusMinutes(movie.getDurationMinutes() + cleaningBufferMinutes);

        // Showtime Collision Detection
        validateShowtimeConflict(room.getId(), startTime, endTime, null);

        Showtime showtime = Showtime.builder()
                .movie(movie)
                .room(room)
                .startTime(startTime)
                .endTime(endTime)
                .basePrice(request.getBasePrice())
                .status(request.getStatus() != null ? request.getStatus() : ShowtimeStatus.SCHEDULED)
                .build();

        showtime = showtimeRepository.save(showtime);

        // Generate Showtime Seats
        List<Seat> roomSeats = seatRepository.findByRoomIdOrderByRowIndexAscColIndexAsc(room.getId());
        List<ShowtimeSeat> showtimeSeats = new ArrayList<>();

        for (Seat seat : roomSeats) {
            BigDecimal seatPrice = calculateSeatPrice(request.getBasePrice(), seat.getSeatType());
            ShowtimeSeat ss = ShowtimeSeat.builder()
                    .showtime(showtime)
                    .seat(seat)
                    .price(seatPrice)
                    .status(ShowtimeSeatStatus.AVAILABLE)
                    .build();
            showtimeSeats.add(ss);
        }

        showtimeSeatRepository.saveAll(showtimeSeats);

        return mapToShowtimeResponse(showtime);
    }

    @Transactional
    public ShowtimeResponse updateShowtime(UUID id, ShowtimeRequest request) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy suất chiếu với ID: " + id));

        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phim với ID: " + request.getMovieId()));

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng chiếu với ID: " + request.getRoomId()));

        LocalDateTime startTime = request.getStartTime();
        LocalDateTime endTime = startTime.plusMinutes(movie.getDurationMinutes() + cleaningBufferMinutes);

        // Check conflict excluding current showtime
        validateShowtimeConflict(room.getId(), startTime, endTime, id);

        showtime.setMovie(movie);
        showtime.setRoom(room);
        showtime.setStartTime(startTime);
        showtime.setEndTime(endTime);
        showtime.setBasePrice(request.getBasePrice());
        if (request.getStatus() != null) {
            showtime.setStatus(request.getStatus());
        }

        showtime = showtimeRepository.save(showtime);
        return mapToShowtimeResponse(showtime);
    }

    @Transactional
    public void deleteShowtime(UUID id) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy suất chiếu với ID: " + id));
        showtime.setStatus(ShowtimeStatus.CANCELLED);
        showtimeRepository.save(showtime);
    }

    private void validateShowtimeConflict(UUID roomId, LocalDateTime startTime, LocalDateTime endTime, UUID currentShowtimeId) {
        List<Showtime> conflicts = showtimeRepository.findOverlappingShowtimes(roomId, startTime, endTime, currentShowtimeId);
        if (!conflicts.isEmpty()) {
            Showtime conflict = conflicts.get(0);
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");
            String msg = String.format("Trùng lịch chiếu tại phòng %s! Đã có suất chiếu phim '%s' từ %s đến %s",
                    conflict.getRoom().getName(),
                    conflict.getMovie().getTitle(),
                    conflict.getStartTime().format(formatter),
                    conflict.getEndTime().format(formatter)
            );
            throw new ShowtimeConflictException(msg);
        }
    }

    private BigDecimal calculateSeatPrice(BigDecimal basePrice, SeatType seatType) {
        if (seatType == SeatType.VIP) {
            return basePrice.multiply(new BigDecimal("1.20")).setScale(0, RoundingMode.HALF_UP);
        } else if (seatType == SeatType.COUPLE) {
            return basePrice.multiply(new BigDecimal("1.80")).setScale(0, RoundingMode.HALF_UP);
        }
        return basePrice;
    }

    public ShowtimeResponse mapToShowtimeResponse(Showtime showtime) {
        List<ShowtimeSeat> seats = showtimeSeatRepository.findByShowtimeId(showtime.getId());
        int totalSeats = seats.size();
        int availableSeats = (int) seats.stream().filter(s -> s.getStatus() == ShowtimeSeatStatus.AVAILABLE).count();

        return ShowtimeResponse.builder()
                .id(showtime.getId())
                .movie(movieService.mapToResponse(showtime.getMovie()))
                .room(cinemaService.mapToRoomResponse(showtime.getRoom()))
                .cinema(cinemaService.mapToCinemaResponse(showtime.getRoom().getCinema()))
                .startTime(showtime.getStartTime())
                .endTime(showtime.getEndTime())
                .basePrice(showtime.getBasePrice())
                .status(showtime.getStatus())
                .availableSeatsCount(availableSeats)
                .totalSeatsCount(totalSeats)
                .build();
    }
}
