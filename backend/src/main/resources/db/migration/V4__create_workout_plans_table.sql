-- ==============================================================================
-- PROTA SCHEMA MIGRATION V4
-- V4__create_workout_plans_table.sql
-- Workout Plans persistence for Phase 6B: AI Workout Planner
-- ==============================================================================

CREATE TABLE workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    primary_goal VARCHAR(50) NOT NULL,
    training_location VARCHAR(30) NOT NULL,
    split_type VARCHAR(50) NOT NULL,
    days_per_week INT NOT NULL,
    session_duration_mins INT NOT NULL,
    experience_level VARCHAR(30) NOT NULL,
    plan_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_workout_plans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_workout_plans_title CHECK (length(trim(title)) > 0),
    CONSTRAINT chk_workout_plans_days CHECK (days_per_week BETWEEN 1 AND 7),
    CONSTRAINT chk_workout_plans_duration CHECK (session_duration_mins BETWEEN 15 AND 180)
);

CREATE INDEX idx_workout_plans_user_created ON workout_plans (user_id, created_at DESC);
