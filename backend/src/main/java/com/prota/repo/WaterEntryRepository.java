package com.prota.repo;

import com.prota.entity.WaterEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WaterEntryRepository extends JpaRepository<WaterEntry, UUID> {
    Optional<WaterEntry> findByIdAndUserId(UUID id, UUID userId);
    List<WaterEntry> findByUserIdAndEntryDateOrderByConsumedAtDesc(UUID userId, LocalDate entryDate);
    List<WaterEntry> findByUserIdAndEntryDateBetweenOrderByEntryDateAscConsumedAtAsc(UUID userId, LocalDate from, LocalDate to);
    Page<WaterEntry> findByUserId(UUID userId, Pageable pageable);
}
