package com.prota.repo;

import com.prota.entity.SavedFood;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedFoodRepository extends JpaRepository<SavedFood, UUID> {
    Optional<SavedFood> findByIdAndUserId(UUID id, UUID userId);
    Page<SavedFood> findByUserId(UUID userId, Pageable pageable);
    Page<SavedFood> findByUserIdAndNameContainingIgnoreCase(UUID userId, String name, Pageable pageable);
    java.util.List<SavedFood> findByUserIdOrderByNameAsc(UUID userId);
    java.util.List<SavedFood> findByUserIdAndNameContainingIgnoreCaseOrderByNameAsc(UUID userId, String name);
}
