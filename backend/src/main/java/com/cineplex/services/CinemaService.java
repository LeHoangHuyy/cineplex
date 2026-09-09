package com.cineplex.services;

import com.cineplex.dtos.cinema.CinemaRequest;
import com.cineplex.dtos.cinema.CinemaResponse;
import com.cineplex.dtos.cinema.RoomRequest;
import com.cineplex.dtos.cinema.RoomResponse;
import com.cineplex.dtos.seat.SeatDto;
import com.cineplex.dtos.seat.SeatLayoutRequest;
import com.cineplex.entities.*;
import com.cineplex.exceptions.BadRequestException;
import com.cineplex.exceptions.ResourceNotFoundException;
import com.cineplex.repositories.CinemaRepository;
import com.cineplex.repositories.RoomRepository;
import com.cineplex.repositories.SeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CinemaService {

    private final CinemaRepository cinemaRepository;
    private final RoomRepository roomRepository;
    private final SeatRepository seatRepository;

    @Transactional(readOnly = true)
    public List<CinemaResponse> getAllCinemas(String city) {
        List<Cinema> cinemas = (city != null && !city.isBlank())
                ? cinemaRepository.findByCity(city)
                : cinemaRepository.findAll();

        return cinemas.stream().map(this::mapToCinemaResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CinemaResponse getCinemaById(UUID id) {
        Cinema cinema = cinemaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy rạp với ID: " + id));
        return mapToCinemaResponse(cinema);
    }

    @Transactional
    public CinemaResponse createCinema(CinemaRequest request) {
        Cinema cinema = Cinema.builder()
                .name(request.getName())
                .address(request.getAddress())
                .city(request.getCity())
                .phone(request.getPhone())
                .imageUrl(request.getImageUrl())
                .build();

        cinema = cinemaRepository.save(cinema);
        return mapToCinemaResponse(cinema);
    }

    @Transactional
    public CinemaResponse updateCinema(UUID id, CinemaRequest request) {
        Cinema cinema = cinemaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy rạp với ID: " + id));

        cinema.setName(request.getName());
        cinema.setAddress(request.getAddress());
        cinema.setCity(request.getCity());
        cinema.setPhone(request.getPhone());
        cinema.setImageUrl(request.getImageUrl());

        cinema = cinemaRepository.save(cinema);
        return mapToCinemaResponse(cinema);
    }

    @Transactional
    public void deleteCinema(UUID id) {
        if (!cinemaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy rạp với ID: " + id);
        }
        cinemaRepository.deleteById(id);
    }

    // Room Management
    @Transactional(readOnly = true)
    public List<RoomResponse> getRoomsByCinema(UUID cinemaId) {
        return roomRepository.findByCinemaId(cinemaId).stream()
                .map(this::mapToRoomResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RoomResponse createRoom(RoomRequest request) {
        Cinema cinema = cinemaRepository.findById(request.getCinemaId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy rạp với ID: " + request.getCinemaId()));

        Room room = Room.builder()
                .cinema(cinema)
                .name(request.getName())
                .totalRows(request.getTotalRows())
                .totalCols(request.getTotalCols())
                .roomType(request.getRoomType())
                .build();

        room = roomRepository.save(room);

        // Automatically initialize default seat grid
        initializeDefaultSeats(room);

        return mapToRoomResponse(room);
    }

    @Transactional
    public RoomResponse updateRoom(UUID id, RoomRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng chiếu với ID: " + id));

        room.setName(request.getName());
        room.setRoomType(request.getRoomType());
        room = roomRepository.save(room);
        return mapToRoomResponse(room);
    }

    @Transactional
    public void deleteRoom(UUID id) {
        if (!roomRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy phòng chiếu với ID: " + id);
        }
        roomRepository.deleteById(id);
    }

    // Seat Management
    @Transactional(readOnly = true)
    public List<SeatDto> getSeatsByRoom(UUID roomId) {
        return seatRepository.findByRoomIdOrderByRowIndexAscColIndexAsc(roomId).stream()
                .map(seat -> SeatDto.builder()
                        .id(seat.getId())
                        .seatRow(seat.getSeatRow())
                        .seatNumber(seat.getSeatNumber())
                        .seatCode(seat.getSeatCode())
                        .seatType(seat.getSeatType())
                        .rowIndex(seat.getRowIndex())
                        .colIndex(seat.getColIndex())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public List<SeatDto> updateSeatLayout(SeatLayoutRequest request) {
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng chiếu với ID: " + request.getRoomId()));

        seatRepository.deleteByRoomId(room.getId());

        List<Seat> newSeats = new ArrayList<>();
        for (SeatDto dto : request.getSeats()) {
            Seat seat = Seat.builder()
                    .room(room)
                    .seatRow(dto.getSeatRow())
                    .seatNumber(dto.getSeatNumber())
                    .seatCode(dto.getSeatRow() + String.format("%02d", dto.getSeatNumber()))
                    .seatType(dto.getSeatType() != null ? dto.getSeatType() : SeatType.REGULAR)
                    .rowIndex(dto.getRowIndex())
                    .colIndex(dto.getColIndex())
                    .build();
            newSeats.add(seat);
        }

        newSeats = seatRepository.saveAll(newSeats);

        return newSeats.stream().map(s -> SeatDto.builder()
                .id(s.getId())
                .seatRow(s.getSeatRow())
                .seatNumber(s.getSeatNumber())
                .seatCode(s.getSeatCode())
                .seatType(s.getSeatType())
                .rowIndex(s.getRowIndex())
                .colIndex(s.getColIndex())
                .build()).collect(Collectors.toList());
    }

    private void initializeDefaultSeats(Room room) {
        List<Seat> seats = new ArrayList<>();
        char startRowChar = 'A';

        for (int r = 0; r < room.getTotalRows(); r++) {
            String rowLetter = String.valueOf((char) (startRowChar + r));
            for (int c = 1; c <= room.getTotalCols(); c++) {
                SeatType type = SeatType.REGULAR;
                // Rows C, D, E are VIP
                if (r >= 2 && r <= 4) {
                    type = SeatType.VIP;
                } else if (r == room.getTotalRows() - 1) { // Last row is Couple
                    type = SeatType.COUPLE;
                }

                Seat seat = Seat.builder()
                        .room(room)
                        .seatRow(rowLetter)
                        .seatNumber(c)
                        .seatCode(rowLetter + String.format("%02d", c))
                        .seatType(type)
                        .rowIndex(r)
                        .colIndex(c - 1)
                        .build();
                seats.add(seat);
            }
        }
        seatRepository.saveAll(seats);
    }

    public CinemaResponse mapToCinemaResponse(Cinema cinema) {
        List<RoomResponse> roomResponses = (cinema.getRooms() != null)
                ? cinema.getRooms().stream().map(this::mapToRoomResponse).collect(Collectors.toList())
                : new ArrayList<>();

        return CinemaResponse.builder()
                .id(cinema.getId())
                .name(cinema.getName())
                .address(cinema.getAddress())
                .city(cinema.getCity())
                .phone(cinema.getPhone())
                .imageUrl(cinema.getImageUrl())
                .rooms(roomResponses)
                .build();
    }

    public RoomResponse mapToRoomResponse(Room room) {
        int seatsCount = (room.getSeats() != null) ? room.getSeats().size() : (room.getTotalRows() * room.getTotalCols());
        return RoomResponse.builder()
                .id(room.getId())
                .cinemaId(room.getCinema().getId())
                .cinemaName(room.getCinema().getName())
                .name(room.getName())
                .totalRows(room.getTotalRows())
                .totalCols(room.getTotalCols())
                .roomType(room.getRoomType())
                .totalSeats(seatsCount)
                .build();
    }
}
