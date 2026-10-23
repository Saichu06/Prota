package com.prota.repo;

import com.prota.entity.NotificationEvent;
import com.prota.entity.enums.NotificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationEventRepository extends JpaRepository<NotificationEvent, UUID> {
    Optional<NotificationEvent> findByDeduplicationKey(String deduplicationKey);
    List<NotificationEvent> findByStatusAndScheduledAtLessThanEqualOrderByScheduledAtAsc(
        NotificationStatus status, Instant scheduledAt
    );
    Page<NotificationEvent> findByUserId(UUID userId, Pageable pageable);
}
