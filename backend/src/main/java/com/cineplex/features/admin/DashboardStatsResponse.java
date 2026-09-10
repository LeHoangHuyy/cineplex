package com.cineplex.features.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalTicketsSold;
    private long totalBookings;
    private BigDecimal totalRevenue;
    private long totalCustomers;
    private long totalMovies;
    private long totalCinemas;

    // Charts & Analytics
    private List<DailyRevenueDto> revenueLast7Days;
    private List<TopMovieDto> topMovies;
    private Map<String, Long> bookingStatusDistribution;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyRevenueDto {
        private String date;
        private BigDecimal revenue;
        private long ticketsCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopMovieDto {
        private String title;
        private String posterUrl;
        private long ticketsCount;
        private BigDecimal revenue;
    }
}

