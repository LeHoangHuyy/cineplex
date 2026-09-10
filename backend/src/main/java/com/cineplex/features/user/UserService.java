package com.cineplex.features.user;

import com.cineplex.common.dto.PageResponse;
import com.cineplex.common.exceptions.ResourceNotFoundException;
import com.cineplex.features.auth.AuthResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<AuthResponse> getAllUsers(String status, String search, Pageable pageable) {
        if (!pageable.getSort().isSorted()) {
            pageable = org.springframework.data.domain.PageRequest.of(
                    pageable.getPageNumber(),
                    pageable.getPageSize(),
                    org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")
            );
        }
        UserStatus userStatus = null;
        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status.trim())) {
            try {
                userStatus = UserStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        Page<User> userPage = userRepository.searchUsers(userStatus, cleanSearch, pageable);
        List<AuthResponse> content = userPage.getContent().stream().map(u -> AuthResponse.builder()
                .id(u.getId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .phone(u.getPhone())
                .role(u.getRole())
                .status(u.getStatus())
                .createdAt(u.getCreatedAt())
                .build()).collect(Collectors.toList());
        return PageResponse.of(userPage, content);
    }

    @Transactional(readOnly = true)
    public PageResponse<AuthResponse> getAllUsers(String search, Pageable pageable) {
        return getAllUsers(null, search, pageable);
    }

    @Transactional(readOnly = true)
    public PageResponse<AuthResponse> getAllUsers(Pageable pageable) {
        return getAllUsers(null, null, pageable);
    }

    @Transactional(readOnly = true)
    public List<AuthResponse> getAllUsers() {
        return userRepository.findAll().stream().map(u -> AuthResponse.builder()
                .id(u.getId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .phone(u.getPhone())
                .role(u.getRole())
                .status(u.getStatus())
                .build()).collect(Collectors.toList());
    }

    @Transactional
    public AuthResponse updateUserStatus(UUID id, UserStatus status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        user.setStatus(status);
        user = userRepository.save(user);

        return AuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }
}

