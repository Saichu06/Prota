package com.prota.service;

import com.prota.dto.request.UpdateSettingsRequest;
import com.prota.dto.response.SettingsResponse;
import com.prota.entity.User;
import com.prota.entity.UserSetting;
import com.prota.exception.ResourceNotFoundException;
import com.prota.repo.DailyLogRepository;
import com.prota.repo.UserRepository;
import com.prota.repo.UserSettingRepository;
import com.prota.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

@Service
public class SettingsService {

    private final UserSettingRepository userSettingRepository;
    private final UserRepository userRepository;
    private final DailyLogRepository dailyLogRepository;

    public SettingsService(UserSettingRepository userSettingRepository,
                           UserRepository userRepository,
                           DailyLogRepository dailyLogRepository) {
        this.userSettingRepository = userSettingRepository;
        this.userRepository = userRepository;
        this.dailyLogRepository = dailyLogRepository;
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

        String oldTz = settings.getTimezone();

        settings.setProteinGoalG(request.getProteinGoalG());
        settings.setCalorieGoalKcal(request.getCalorieGoalKcal());
        settings.setWaterGoalMl(request.getWaterGoalMl());
        settings.setWeightUnit(request.getWeightUnit());
        if (request.getTimezone() != null && !request.getTimezone().isBlank()) {
            String tz = request.getTimezone().trim();
            try {
                ZoneId.of(tz);
                settings.setTimezone(tz);
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid timezone identifier: " + tz);
            }
        }
        settings.setTheme(request.getTheme());

        UserSetting saved = userSettingRepository.save(settings);

        // Synchronize active ongoing daily log for today so today's daily log reflects updated goals immediately.
        // Historical logs (past calendar dates) are preserved untouched to honor immutability.
        String newTz = saved.getTimezone() != null ? saved.getTimezone() : "UTC";
        LocalDate todayNew = LocalDate.now(ZoneId.of(newTz));
        dailyLogRepository.findByUserIdAndLogDate(currentUserId, todayNew).ifPresent(todayLog -> {
            todayLog.setProteinGoalG(saved.getProteinGoalG());
            todayLog.setCalorieGoalKcal(saved.getCalorieGoalKcal());
            todayLog.setWaterGoalMl(saved.getWaterGoalMl());
            dailyLogRepository.save(todayLog);
        });

        // If timezone changed, also sync if old timezone's today had an active uncommitted log
        if (oldTz != null && !oldTz.equalsIgnoreCase(newTz)) {
            try {
                LocalDate todayOld = LocalDate.now(ZoneId.of(oldTz));
                if (!todayOld.equals(todayNew)) {
                    dailyLogRepository.findByUserIdAndLogDate(currentUserId, todayOld).ifPresent(oldLog -> {
                        oldLog.setProteinGoalG(saved.getProteinGoalG());
                        oldLog.setCalorieGoalKcal(saved.getCalorieGoalKcal());
                        oldLog.setWaterGoalMl(saved.getWaterGoalMl());
                        dailyLogRepository.save(oldLog);
                    });
                }
            } catch (Exception ignored) {
            }
        }

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
