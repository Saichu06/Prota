package com.prota.entity;

import com.prota.entity.enums.DietGoal;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "diet_plans", uniqueConstraints = {
    @UniqueConstraint(name = "uq_diet_plans_user_id", columnNames = {"user_id", "id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DietPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "goal", nullable = false, length = 50)
    private DietGoal goal;

    @Column(name = "daily_calories_kcal", nullable = false, precision = 9, scale = 2)
    private BigDecimal dailyCaloriesKcal;

    @Column(name = "daily_protein_g", nullable = false, precision = 8, scale = 2)
    private BigDecimal dailyProteinG;

    @Column(name = "daily_carbohydrates_g", precision = 8, scale = 2)
    private BigDecimal dailyCarbohydratesG;

    @Column(name = "daily_fat_g", precision = 8, scale = 2)
    private BigDecimal dailyFatG;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "plan_json", nullable = false, columnDefinition = "jsonb")
    private String planJson;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DietPlan other)) return false;
        return id != null && id.equals(other.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
