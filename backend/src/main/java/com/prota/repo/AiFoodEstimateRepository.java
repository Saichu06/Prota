package com.prota.repo;

import com.prota.entity.AiFoodEstimate;
import com.prota.entity.enums.EstimateStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiFoodEstimateRepository extends JpaRepository<AiFoodEstimate, UUID> {
    Optional<AiFoodEstimate> findByIdAndUserId(UUID id, UUID userId);
    Page<AiFoodEstimate> findByUserIdAndStatus(UUID userId, EstimateStatus status, Pageable pageable);
}
