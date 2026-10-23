package com.prota.service;

import com.prota.dto.request.LoginRequest;
import com.prota.dto.request.RegisterRequest;
import com.prota.dto.response.UserResponse;
import com.prota.entity.User;
import com.prota.entity.UserSetting;
import com.prota.entity.enums.ThemePreference;
import com.prota.entity.enums.UserStatus;
import com.prota.entity.enums.WeightUnit;
import com.prota.exception.ResourceNotFoundException;
import com.prota.exception.UserAlreadyExistsException;
import com.prota.repo.UserRepository;
import com.prota.repo.UserSettingRepository;
import com.prota.security.SecurityUtils;
import com.prota.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserSettingRepository userSettingRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;

    public AuthService(UserRepository userRepository,
                       UserSettingRepository userSettingRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       SecurityContextRepository securityContextRepository) {
        this.userRepository = userRepository;
        this.userSettingRepository = userSettingRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
    }

    @Transactional
    public UserResponse register(RegisterRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new UserAlreadyExistsException("An account with email " + normalizedEmail + " already exists");
        }

        User user = User.builder()
            .fullName(request.getFullName().trim())
            .email(normalizedEmail)
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .status(UserStatus.ACTIVE)
            .build();

        User savedUser = userRepository.save(user);

        UserSetting defaultSettings = UserSetting.builder()
            .user(savedUser)
            .proteinGoalG(new BigDecimal("140.00"))
            .calorieGoalKcal(new BigDecimal("2000.00"))
            .waterGoalMl(2500)
            .weightUnit(WeightUnit.KG)
            .timezone("UTC")
            .theme(ThemePreference.SYSTEM)
            .build();

        userSettingRepository.save(defaultSettings);

        // Establish session authentication automatically on registration
        UserPrincipal principal = new UserPrincipal(savedUser);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        establishSession(auth, httpRequest, httpResponse);

        return mapToUserResponse(savedUser);
    }

    public UserResponse login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
        );

        establishSession(auth, httpRequest, httpResponse);

        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return mapToUserResponse(user);
    }

    public void logout(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToUserResponse(user);
    }

    private void establishSession(Authentication auth, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        // Rotate session ID to protect against session fixation attacks
        httpRequest.getSession(true);
        httpRequest.changeSessionId();

        securityContextRepository.saveContext(context, httpRequest, httpResponse);
    }

    public static UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .status(user.getStatus())
            .emailVerifiedAt(user.getEmailVerifiedAt())
            .profilePictureUrl(user.getProfilePictureUrl())
            .createdAt(user.getCreatedAt())
            .build();
    }
}
