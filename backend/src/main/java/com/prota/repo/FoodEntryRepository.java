package com.prota.repo;

import com.prota.entity.FoodEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FoodEntryRepository extends JpaRepository<FoodEntry, UUID> {
    Optional<FoodEntry> findByIdAndUserId(UUID id, UUID userId);
    List<FoodEntry> findByDailyLogIdOrderByConsumedAtDescIdDesc(UUID dailyLogId);
    Page<FoodEntry> findByUserId(UUID userId, Pageable pageable);

    @Query("SELECT fe FROM FoodEntry fe WHERE fe.user.id = :userId AND fe.dailyLog.logDate BETWEEN :startDate AND :endDate ORDER BY fe.dailyLog.logDate ASC, fe.consumedAt ASC")
    List<FoodEntry> findByUserIdAndDateRange(@Param("userId") UUID userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
