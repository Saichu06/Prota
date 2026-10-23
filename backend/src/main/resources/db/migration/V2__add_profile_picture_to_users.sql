-- ==============================================================================
-- PROTA SCHEMA MIGRATION V2
-- V2__add_profile_picture_to_users.sql
-- Add optional profile_picture_url to users table
-- ==============================================================================

ALTER TABLE users
ADD COLUMN profile_picture_url VARCHAR(512);
