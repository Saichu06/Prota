package com.prota.entity;

import com.prota.entity.enums.MealType;
import com.prota.entity.enums.NutritionSource;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "food_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "daily_log_id", nullable = false)
    private DailyLog dailyLog;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "saved_food_id")
    private SavedFood savedFood;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ai_estimate_id")
    private AiFoodEstimate aiEstimate;

    @Column(name = "food_name", nullable = false, length = 200)
    private String foodName;

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_type", nullable = false, length = 20)
    private MealType mealType;

    @Column(name = "category", length = 40)
    private String category;

    @Column(name = "quantity", nullable = false, precision = 10, scale = 3)
    private BigDecimal quantity;

    @Column(name = "quantity_unit", nullable = false, length = 20)
    private String quantityUnit;

    @Column(name = "protein_g", nullable = false, precision = 8, scale = 2)
    private BigDecimal proteinG;

    @Column(name = "calories_kcal", precision = 9, scale = 2)
    private BigDecimal caloriesKcal;

    @Column(name = "carbohydrates_g", precision = 8, scale = 2)
    private BigDecimal carbohydratesG;

    @Column(name = "fat_g", precision = 8, scale = 2)
    private BigDecimal fatG;

    @Enumerated(EnumType.STRING)
    @Column(name = "nutrition_source", nullable = false, length = 30)
    private NutritionSource nutritionSource;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "consumed_at", nullable = false)
    private Instant consumedAt;

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
        FoodEntry foodEntry = (FoodEntry) o;
        return id != null && Objects.equals(id, foodEntry.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
