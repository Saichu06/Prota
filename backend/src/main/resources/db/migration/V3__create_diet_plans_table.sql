-- ==============================================================================
-- PROTA SCHEMA MIGRATION V3
-- V3__create_diet_plans_table.sql
-- Diet Plans persistence for Phase 6A: AI Diet Planner
-- ==============================================================================

CREATE TABLE diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    goal VARCHAR(50) NOT NULL,
    daily_calories_kcal NUMERIC(9,2) NOT NULL,
    daily_protein_g NUMERIC(8,2) NOT NULL,
    daily_carbohydrates_g NUMERIC(8,2),
    daily_fat_g NUMERIC(8,2),
    plan_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_diet_plans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_diet_plans_user_id UNIQUE (user_id, id),
    CONSTRAINT chk_diet_plans_title CHECK (length(trim(title)) > 0),
    CONSTRAINT chk_diet_plans_goal CHECK (goal IN ('MUSCLE_GAIN', 'FAT_LOSS', 'WEIGHT_MAINTENANCE', 'GENERAL_FITNESS')),
    CONSTRAINT chk_diet_plans_calories CHECK (daily_calories_kcal > 0),
    CONSTRAINT chk_diet_plans_protein CHECK (daily_protein_g >= 0),
    CONSTRAINT chk_diet_plans_carbs CHECK (daily_carbohydrates_g IS NULL OR daily_carbohydrates_g >= 0),
    CONSTRAINT chk_diet_plans_fat CHECK (daily_fat_g IS NULL OR daily_fat_g >= 0)
);

CREATE INDEX idx_diet_plans_user_created ON diet_plans (user_id, created_at DESC);
