package com.cineplex.services;

import com.cineplex.dtos.admin.DashboardStatsResponse;
import com.cineplex.dtos.admin.DashboardStatsResponse.DailyRevenueDto;
import com.cineplex.dtos.admin.DashboardStatsResponse.TopMovieDto;
import com.cineplex.entities.Booking;
import com.cineplex.entities.BookingStatus;
import com.cineplex.entities.Movie;
import com.cineplex.entities.Ticket;
import com.cineplex.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final MovieRepository movieRepository;
    private final CinemaRepository cinemaRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        long totalTicketsSold = ticketRepository.countSoldTickets();
        long totalBookings = bookingRepository.countConfirmedBookings();
        BigDecimal totalRevenue = bookingRepository.calculateTotalRevenue();
        long totalCustomers = userRepository.count();
        long totalMovies = movieRepository.count();
        long totalCinemas = cinemaRepository.count();

        // 7-day revenue trend
        List<DailyRevenueDto> dailyRevenueList = new ArrayList<>();
        LocalDate today = LocalDate.now();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM");

        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.plusDays(1).atStartOfDay();

            BigDecimal dayRevenue = bookingRepository.calculateRevenueBetween(start, end);
            dailyRevenueList.add(DailyRevenueDto.builder()
                    .date(date.format(dtf))
                    .revenue(dayRevenue != null ? dayRevenue : BigDecimal.ZERO)
                    .ticketsCount(0)
                    .build());
        }

        // Top movies by tickets sold
        List<Booking> allConfirmedBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                .collect(Collectors.toList());

        Map<Movie, Long> movieTicketCount = new HashMap<>();
        Map<Movie, BigDecimal> movieRevenueMap = new HashMap<>();

        for (Booking b : allConfirmedBookings) {
            Movie movie = b.getShowtime().getMovie();
            long tktCount = b.getTickets() != null ? b.getTickets().size() : 0;
            movieTicketCount.put(movie, movieTicketCount.getOrDefault(movie, 0L) + tktCount);
            movieRevenueMap.put(movie, movieRevenueMap.getOrDefault(movie, BigDecimal.ZERO).add(b.getTotalAmount()));
        }

        List<TopMovieDto> topMovies = movieTicketCount.entrySet().stream()
                .sorted((e1, e2) -> Long.compare(e2.getValue(), e1.getValue()))
                .limit(5)
                .map(e -> TopMovieDto.builder()
                        .title(e.getKey().getTitle())
                        .posterUrl(e.getKey().getPosterUrl())
                        .ticketsCount(e.getValue())
                        .revenue(movieRevenueMap.getOrDefault(e.getKey(), BigDecimal.ZERO))
                        .build())
                .collect(Collectors.toList());

        // Booking status breakdown
        Map<String, Long> statusDistribution = new HashMap<>();
        for (Booking b : bookingRepository.findAll()) {
            statusDistribution.put(b.getStatus().name(), statusDistribution.getOrDefault(b.getStatus().name(), 0L) + 1);
        }

        return DashboardStatsResponse.builder()
                .totalTicketsSold(totalTicketsSold)
                .totalBookings(totalBookings)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .totalCustomers(totalCustomers)
                .totalMovies(totalMovies)
                .totalCinemas(totalCinemas)
                .revenueLast7Days(dailyRevenueList)
                .topMovies(topMovies)
                .bookingStatusDistribution(statusDistribution)
                .build();
    }
}
