package com.prota.repo;

import com.prota.entity.ReminderSetting;
import com.prota.entity.enums.ReminderType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReminderSettingRepository extends JpaRepository<ReminderSetting, UUID> {
    Optional<ReminderSetting> findByIdAndUserId(UUID id, UUID userId);
    Optional<ReminderSetting> findByUserIdAndReminderType(UUID userId, ReminderType reminderType);
    List<ReminderSetting> findByUserId(UUID userId);
}
