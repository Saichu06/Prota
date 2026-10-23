package com.prota.repo;

import com.prota.entity.DailyLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyLogRepository extends JpaRepository<DailyLog, UUID> {
    Optional<DailyLog> findByUserIdAndLogDate(UUID userId, LocalDate logDate);
    List<DailyLog> findByUserIdAndLogDateBetweenOrderByLogDateAsc(UUID userId, LocalDate startDate, LocalDate endDate);
}
