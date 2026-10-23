package com.prota.repo;

import com.prota.entity.WeightEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WeightEntryRepository extends JpaRepository<WeightEntry, UUID> {
    Optional<WeightEntry> findByIdAndUserId(UUID id, UUID userId);
    List<WeightEntry> findByUserIdAndEntryDateOrderByRecordedAtDesc(UUID userId, LocalDate entryDate);
    List<WeightEntry> findByUserIdAndEntryDateBetweenOrderByEntryDateAscRecordedAtAsc(UUID userId, LocalDate from, LocalDate to);
    Page<WeightEntry> findByUserId(UUID userId, Pageable pageable);
}
