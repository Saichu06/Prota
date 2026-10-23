package com.prota.service;

import com.prota.dto.request.UpdateSettingsRequest;
import com.prota.dto.response.SettingsResponse;
import com.prota.entity.User;
import com.prota.entity.UserSetting;
import com.prota.exception.ResourceNotFoundException;
import com.prota.repo.UserRepository;
import com.prota.repo.UserSettingRepository;
import com.prota.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class SettingsService {

    private final UserSettingRepository userSettingRepository;
    private final UserRepository userRepository;

    public SettingsService(UserSettingRepository userSettingRepository, UserRepository userRepository) {
        this.userSettingRepository = userSettingRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public SettingsResponse getSettings() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        UserSetting settings = userSettingRepository.findByUserId(currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User settings not found"));

        return mapToResponse(settings);
    }

    @Transactional
    public SettingsResponse updateSettings(UpdateSettingsRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        UserSetting settings = userSettingRepository.findByUserId(currentUserId)
            .orElseGet(() -> {
                User user = userRepository.findById(currentUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                return UserSetting.builder().user(user).build();
            });

        settings.setProteinGoalG(request.getProteinGoalG());
        settings.setCalorieGoalKcal(request.getCalorieGoalKcal());
        settings.setWaterGoalMl(request.getWaterGoalMl());
        settings.setWeightUnit(request.getWeightUnit());
        if (request.getTimezone() != null && !request.getTimezone().isBlank()) {
            String tz = request.getTimezone().trim();
            try {
                java.time.ZoneId.of(tz);
                settings.setTimezone(tz);
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid timezone identifier: " + tz);
            }
        }
        settings.setTheme(request.getTheme());

        UserSetting saved = userSettingRepository.save(settings);
        return mapToResponse(saved);
    }

    public static SettingsResponse mapToResponse(UserSetting settings) {
        return SettingsResponse.builder()
            .userId(settings.getUserId())
            .proteinGoalG(settings.getProteinGoalG())
            .calorieGoalKcal(settings.getCalorieGoalKcal())
            .waterGoalMl(settings.getWaterGoalMl())
            .weightUnit(settings.getWeightUnit())
            .timezone(settings.getTimezone())
            .theme(settings.getTheme())
            .updatedAt(settings.getUpdatedAt())
            .build();
    }
}
