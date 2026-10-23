package com.prota.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "daily_logs", uniqueConstraints = {
    @UniqueConstraint(name = "uq_daily_logs_user_date", columnNames = {"user_id", "log_date"}),
    @UniqueConstraint(name = "uq_daily_logs_user_id", columnNames = {"user_id", "id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(name = "timezone_at_creation", nullable = false, length = 64)
    private String timezoneAtCreation;

    @Column(name = "protein_goal_g", nullable = false, precision = 8, scale = 2)
    private BigDecimal proteinGoalG;

    @Column(name = "calorie_goal_kcal", precision = 9, scale = 2)
    private BigDecimal calorieGoalKcal;

    @Column(name = "water_goal_ml")
    private Integer waterGoalMl;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    @UpdateTimestamp
    private Instant updatedAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DailyLog dailyLog = (DailyLog) o;
        return id != null && Objects.equals(id, dailyLog.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
