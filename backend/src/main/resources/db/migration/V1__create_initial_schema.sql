-- ==============================================================================
-- PROTA SCHEMA INITIALIZATION
-- V1__create_initial_schema.sql
-- Exactly 12 Approved Tables with Full Integrity Constraints & Indexes
-- ==============================================================================

-- Ensure pgcrypto extension for UUID generation if needed (gen_random_uuid() is built-in since PG 13)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. USERS
-- ------------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_full_name CHECK (length(trim(full_name)) > 0),
    CONSTRAINT chk_users_email CHECK (length(trim(email)) > 0),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION')),
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE UNIQUE INDEX idx_users_email_lower ON users (LOWER(email));

-- ------------------------------------------------------------------------------
-- 2. USER SETTINGS
-- ------------------------------------------------------------------------------
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY,
    protein_goal_g NUMERIC(8,2) NOT NULL,
    calorie_goal_kcal NUMERIC(9,2),
    water_goal_ml INTEGER,
    weight_unit VARCHAR(5) NOT NULL DEFAULT 'KG',
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    theme VARCHAR(10) NOT NULL DEFAULT 'SYSTEM',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_user_settings_protein CHECK (protein_goal_g > 0),
    CONSTRAINT chk_user_settings_calories CHECK (calorie_goal_kcal IS NULL OR calorie_goal_kcal > 0),
    CONSTRAINT chk_user_settings_water CHECK (water_goal_ml IS NULL OR water_goal_ml > 0),
    CONSTRAINT chk_user_settings_weight_unit CHECK (weight_unit IN ('KG', 'LB')),
    CONSTRAINT chk_user_settings_timezone CHECK (length(trim(timezone)) > 0),
    CONSTRAINT chk_user_settings_theme CHECK (theme IN ('LIGHT', 'DARK', 'SYSTEM'))
);

-- ------------------------------------------------------------------------------
-- 3. DAILY LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    log_date DATE NOT NULL,
    timezone_at_creation VARCHAR(64) NOT NULL,
    protein_goal_g NUMERIC(8,2) NOT NULL,
    calorie_goal_kcal NUMERIC(9,2),
    water_goal_ml INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_daily_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_daily_logs_user_date UNIQUE (user_id, log_date),
    CONSTRAINT uq_daily_logs_user_id UNIQUE (user_id, id),
    CONSTRAINT chk_daily_logs_timezone CHECK (length(trim(timezone_at_creation)) > 0),
    CONSTRAINT chk_daily_logs_protein CHECK (protein_goal_g > 0),
    CONSTRAINT chk_daily_logs_calories CHECK (calorie_goal_kcal IS NULL OR calorie_goal_kcal > 0),
    CONSTRAINT chk_daily_logs_water CHECK (water_goal_ml IS NULL OR water_goal_ml > 0)
);

CREATE INDEX idx_daily_logs_user_date ON daily_logs (user_id, log_date DESC);

-- ------------------------------------------------------------------------------
-- 4. SAVED FOODS
-- ------------------------------------------------------------------------------
CREATE TABLE saved_foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(120),
    serving_quantity NUMERIC(10,3) NOT NULL,
    serving_unit VARCHAR(20) NOT NULL,
    protein_g NUMERIC(8,2) NOT NULL,
    calories_kcal NUMERIC(9,2),
    carbohydrates_g NUMERIC(8,2),
    fat_g NUMERIC(8,2),
    external_source VARCHAR(50),
    external_food_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_saved_foods_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_saved_foods_user_id UNIQUE (user_id, id),
    CONSTRAINT chk_saved_foods_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_saved_foods_serving_quantity CHECK (serving_quantity > 0),
    CONSTRAINT chk_saved_foods_serving_unit CHECK (length(trim(serving_unit)) > 0),
    CONSTRAINT chk_saved_foods_protein CHECK (protein_g >= 0),
    CONSTRAINT chk_saved_foods_calories CHECK (calories_kcal IS NULL OR calories_kcal >= 0),
    CONSTRAINT chk_saved_foods_carbs CHECK (carbohydrates_g IS NULL OR carbohydrates_g >= 0),
    CONSTRAINT chk_saved_foods_fat CHECK (fat_g IS NULL OR fat_g >= 0)
);

CREATE INDEX idx_saved_foods_user_name ON saved_foods (user_id, name);

-- ------------------------------------------------------------------------------
-- 5. AI FOOD ESTIMATES
-- ------------------------------------------------------------------------------
CREATE TABLE ai_food_estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    input_type VARCHAR(10) NOT NULL,
    original_text TEXT,
    image_reference VARCHAR(500),
    model_name VARCHAR(120) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    estimate_json JSONB NOT NULL,
    error_code VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    CONSTRAINT fk_ai_food_estimates_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_ai_food_estimates_user_id UNIQUE (user_id, id),
    CONSTRAINT chk_ai_food_estimates_input_type CHECK (input_type IN ('TEXT', 'IMAGE')),
    CONSTRAINT chk_ai_food_estimates_status CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'FAILED', 'EXPIRED')),
    CONSTRAINT chk_ai_food_estimates_model_name CHECK (length(trim(model_name)) > 0)
);

CREATE INDEX idx_ai_food_estimates_user_created ON ai_food_estimates (user_id, created_at DESC);
CREATE INDEX idx_ai_food_estimates_status_expires ON ai_food_estimates (status, expires_at);

-- ------------------------------------------------------------------------------
-- 6. FOOD ENTRIES
-- ------------------------------------------------------------------------------
CREATE TABLE food_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    daily_log_id UUID NOT NULL,
    saved_food_id UUID,
    ai_estimate_id UUID,
    food_name VARCHAR(200) NOT NULL,
    meal_type VARCHAR(20) NOT NULL,
    category VARCHAR(40),
    quantity NUMERIC(10,3) NOT NULL,
    quantity_unit VARCHAR(20) NOT NULL,
    protein_g NUMERIC(8,2) NOT NULL,
    calories_kcal NUMERIC(9,2),
    carbohydrates_g NUMERIC(8,2),
    fat_g NUMERIC(8,2),
    nutrition_source VARCHAR(30) NOT NULL,
    notes VARCHAR(500),
    consumed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_food_entries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_food_entries_daily_log FOREIGN KEY (user_id, daily_log_id) REFERENCES daily_logs(user_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_food_entries_saved_food FOREIGN KEY (user_id, saved_food_id) REFERENCES saved_foods(user_id, id) ON DELETE SET NULL (saved_food_id),
    CONSTRAINT fk_food_entries_ai_estimate FOREIGN KEY (user_id, ai_estimate_id) REFERENCES ai_food_estimates(user_id, id) ON DELETE SET NULL (ai_estimate_id),
    CONSTRAINT chk_food_entries_name CHECK (length(trim(food_name)) > 0),
    CONSTRAINT chk_food_entries_meal_type CHECK (meal_type IN ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'OTHER')),
    CONSTRAINT chk_food_entries_quantity CHECK (quantity > 0),
    CONSTRAINT chk_food_entries_quantity_unit CHECK (length(trim(quantity_unit)) > 0),
    CONSTRAINT chk_food_entries_protein CHECK (protein_g >= 0),
    CONSTRAINT chk_food_entries_calories CHECK (calories_kcal IS NULL OR calories_kcal >= 0),
    CONSTRAINT chk_food_entries_carbs CHECK (carbohydrates_g IS NULL OR carbohydrates_g >= 0),
    CONSTRAINT chk_food_entries_fat CHECK (fat_g IS NULL OR fat_g >= 0),
    CONSTRAINT chk_food_entries_source CHECK (nutrition_source IN ('MANUAL', 'AI_CONFIRMED', 'SAVED_FOOD', 'EXTERNAL_DATABASE'))
);

CREATE INDEX idx_food_entries_daily_log_consumed ON food_entries (daily_log_id, consumed_at DESC, id DESC);
CREATE INDEX idx_food_entries_user_consumed ON food_entries (user_id, consumed_at DESC);
CREATE INDEX idx_food_entries_ai_estimate ON food_entries (ai_estimate_id);
CREATE INDEX idx_food_entries_saved_food ON food_entries (saved_food_id);

-- ------------------------------------------------------------------------------
-- 7. WATER ENTRIES
-- ------------------------------------------------------------------------------
CREATE TABLE water_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    entry_date DATE NOT NULL,
    amount_ml INTEGER NOT NULL,
    consumed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_water_entries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_water_entries_amount CHECK (amount_ml > 0 AND amount_ml <= 20000)
);

CREATE INDEX idx_water_entries_user_date ON water_entries (user_id, entry_date, consumed_at DESC);

-- ------------------------------------------------------------------------------
-- 8. WEIGHT ENTRIES
-- ------------------------------------------------------------------------------
CREATE TABLE weight_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    weight_kg NUMERIC(7,3) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    entry_date DATE NOT NULL,
    notes VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_weight_entries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_weight_entries_weight CHECK (weight_kg > 0 AND weight_kg <= 700)
);

CREATE INDEX idx_weight_entries_user_date ON weight_entries (user_id, entry_date DESC, recorded_at DESC);

-- ------------------------------------------------------------------------------
-- 9. REMINDER SETTINGS
-- ------------------------------------------------------------------------------
CREATE TABLE reminder_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    reminder_type VARCHAR(20) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    schedule_type VARCHAR(20) NOT NULL,
    scheduled_times JSONB NOT NULL DEFAULT '[]',
    interval_minutes INTEGER,
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reminder_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_reminder_settings_user_type UNIQUE (user_id, reminder_type),
    CONSTRAINT uq_reminder_settings_user_id UNIQUE (user_id, id),
    CONSTRAINT chk_reminder_settings_type CHECK (reminder_type IN ('PROTEIN', 'WATER', 'WEIGHT')),
    CONSTRAINT chk_reminder_settings_schedule_type CHECK (schedule_type IN ('FIXED_TIMES', 'INTERVAL', 'SELECTED_DAYS')),
    CONSTRAINT chk_reminder_settings_interval CHECK (interval_minutes IS NULL OR interval_minutes > 0),
    CONSTRAINT chk_reminder_settings_timezone CHECK (length(trim(timezone)) > 0)
);

-- ------------------------------------------------------------------------------
-- 10. PUSH SUBSCRIPTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    device_label VARCHAR(100),
    last_success_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_push_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_push_subscriptions_endpoint UNIQUE (endpoint),
    CONSTRAINT chk_push_subscriptions_endpoint CHECK (length(trim(endpoint)) > 0),
    CONSTRAINT chk_push_subscriptions_keys CHECK (length(trim(p256dh_key)) > 0 AND length(trim(auth_key)) > 0)
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions (user_id);

-- ------------------------------------------------------------------------------
-- 11. NOTIFICATION EVENTS
-- ------------------------------------------------------------------------------
CREATE TABLE notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    reminder_setting_id UUID,
    event_type VARCHAR(30) NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    deduplication_key VARCHAR(200) NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    sent_at TIMESTAMPTZ,
    last_attempt_at TIMESTAMPTZ,
    error_code VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_events_reminder FOREIGN KEY (user_id, reminder_setting_id) REFERENCES reminder_settings(user_id, id) ON DELETE SET NULL (reminder_setting_id),
    CONSTRAINT uq_notification_events_dedup UNIQUE (deduplication_key),
    CONSTRAINT chk_notification_events_status CHECK (status IN ('SCHEDULED', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED', 'SKIPPED')),
    CONSTRAINT chk_notification_events_attempts CHECK (attempt_count >= 0)
);

CREATE INDEX idx_notification_events_status_scheduled ON notification_events (status, scheduled_at);
CREATE INDEX idx_notification_events_user_scheduled ON notification_events (user_id, scheduled_at DESC);

-- ------------------------------------------------------------------------------
-- 12. REFRESH TOKENS
-- ------------------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    family_id UUID NOT NULL,
    device_label VARCHAR(100),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMPTZ,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_refresh_tokens_hash UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_family ON refresh_tokens (family_id);
CREATE INDEX idx_refresh_tokens_user_expires ON refresh_tokens (user_id, expires_at);
