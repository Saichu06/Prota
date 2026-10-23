package com.prota.entity;

import com.prota.entity.enums.ThemePreference;
import com.prota.entity.enums.WeightUnit;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "user_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSetting {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "protein_goal_g", nullable = false, precision = 8, scale = 2)
    private BigDecimal proteinGoalG;

    @Column(name = "calorie_goal_kcal", precision = 9, scale = 2)
    private BigDecimal calorieGoalKcal;

    @Column(name = "water_goal_ml")
    private Integer waterGoalMl;

    @Enumerated(EnumType.STRING)
    @Column(name = "weight_unit", nullable = false, length = 5)
    @Builder.Default
    private WeightUnit weightUnit = WeightUnit.KG;

    @Column(name = "timezone", nullable = false, length = 64)
    @Builder.Default
    private String timezone = "UTC";

    @Enumerated(EnumType.STRING)
    @Column(name = "theme", nullable = false, length = 10)
    @Builder.Default
    private ThemePreference theme = ThemePreference.SYSTEM;

    @Column(name = "updated_at", nullable = false)
    @UpdateTimestamp
    private Instant updatedAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserSetting that = (UserSetting) o;
        return userId != null && Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
