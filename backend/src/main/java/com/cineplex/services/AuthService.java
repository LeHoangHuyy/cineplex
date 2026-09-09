package com.cineplex.services;

import com.cineplex.dtos.auth.AuthResponse;
import com.cineplex.dtos.auth.LoginRequest;
import com.cineplex.dtos.auth.RegisterRequest;
import com.cineplex.dtos.auth.UpdateProfileRequest;
import com.cineplex.entities.Role;
import com.cineplex.entities.User;
import com.cineplex.entities.UserStatus;
import com.cineplex.exceptions.BadRequestException;
import com.cineplex.exceptions.ResourceNotFoundException;
import com.cineplex.repositories.UserRepository;
import com.cineplex.security.JwtTokenProvider;
import com.cineplex.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng: " + request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(Role.ROLE_CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();

        user = userRepository.save(user);

        String token = jwtTokenProvider.generateTokenFromUsername(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase().trim(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtTokenProvider.generateToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        if (user.getStatus() == UserStatus.LOCKED) {
            throw new BadRequestException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.");
        }

        return AuthResponse.builder()
                .token(jwt)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }

    @Transactional(readOnly = true)
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl userDetails)) {
            throw new BadRequestException("Chưa đăng nhập");
        }
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));
    }

    @Transactional
    public AuthResponse updateProfile(UpdateProfileRequest request) {
        User user = getCurrentUser();
        user.setFullName(request.getFullName());
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getCurrentPassword() == null || !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new BadRequestException("Mật khẩu hiện tại không chính xác");
            }
            if (request.getNewPassword().length() < 6) {
                throw new BadRequestException("Mật khẩu mới phải có ít nhất 6 ký tự");
            }
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        user = userRepository.save(user);

        return AuthResponse.builder()
                .token(jwtTokenProvider.generateTokenFromUsername(user.getEmail()))
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }
}
