package com.cineplex.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SeatLockService {

    private final StringRedisTemplate redisTemplate;

    private String buildKey(UUID showtimeId, UUID seatId) {
        return "cineplex:seat_lock:" + showtimeId + ":" + seatId;
    }

    /**
     * Atomically tries to hold a batch of seats for a specific user.
     * If any seat fails to lock (already locked by someone else), rolls back already acquired locks.
     */
    public synchronized boolean tryHoldSeats(UUID showtimeId, List<UUID> seatIds, UUID userId, long durationSeconds) {
        List<String> successfullyLockedKeys = new ArrayList<>();

        for (UUID seatId : seatIds) {
            String key = buildKey(showtimeId, seatId);
            String currentHolder = redisTemplate.opsForValue().get(key);

            // If already locked by the same user, we refresh the lock TTL
            if (currentHolder != null && currentHolder.equals(userId.toString())) {
                redisTemplate.expire(key, Duration.ofSeconds(durationSeconds));
                successfullyLockedKeys.add(key);
                continue;
            }

            // Try to acquire lock
            Boolean acquired = redisTemplate.opsForValue().setIfAbsent(
                    key,
                    userId.toString(),
                    Duration.ofSeconds(durationSeconds)
            );

            if (Boolean.TRUE.equals(acquired)) {
                successfullyLockedKeys.add(key);
            } else {
                // Rollback acquired locks
                log.warn("Failed to lock seat: {} for user: {}. Rolling back locks.", seatId, userId);
                for (String lockedKey : successfullyLockedKeys) {
                    redisTemplate.delete(lockedKey);
                }
                return false;
            }
        }

        return true;
    }

    public void releaseSeats(UUID showtimeId, List<UUID> seatIds) {
        for (UUID seatId : seatIds) {
            String key = buildKey(showtimeId, seatId);
            redisTemplate.delete(key);
        }
        log.info("Released seat locks for showtime: {} and seats: {}", showtimeId, seatIds);
    }

    public boolean isSeatLocked(UUID showtimeId, UUID seatId) {
        String key = buildKey(showtimeId, seatId);
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    public boolean isSeatHeldByUser(UUID showtimeId, UUID seatId, UUID userId) {
        String key = buildKey(showtimeId, seatId);
        String holder = redisTemplate.opsForValue().get(key);
        return holder != null && holder.equals(userId.toString());
    }

    public String getSeatLockHolder(UUID showtimeId, UUID seatId) {
        String key = buildKey(showtimeId, seatId);
        return redisTemplate.opsForValue().get(key);
    }
}
