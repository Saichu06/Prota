package com.prota.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "saved_foods", uniqueConstraints = {
    @UniqueConstraint(name = "uq_saved_foods_user_id", columnNames = {"user_id", "id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedFood {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "brand", length = 120)
    private String brand;

    @Column(name = "serving_quantity", nullable = false, precision = 10, scale = 3)
    private BigDecimal servingQuantity;

    @Column(name = "serving_unit", nullable = false, length = 20)
    private String servingUnit;

    @Column(name = "protein_g", nullable = false, precision = 8, scale = 2)
    private BigDecimal proteinG;

    @Column(name = "calories_kcal", precision = 9, scale = 2)
    private BigDecimal caloriesKcal;

    @Column(name = "carbohydrates_g", precision = 8, scale = 2)
    private BigDecimal carbohydratesG;

    @Column(name = "fat_g", precision = 8, scale = 2)
    private BigDecimal fatG;

    @Column(name = "external_source", length = 50)
    private String externalSource;

    @Column(name = "external_food_id", length = 100)
    private String externalFoodId;

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
        SavedFood savedFood = (SavedFood) o;
        return id != null && Objects.equals(id, savedFood.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
