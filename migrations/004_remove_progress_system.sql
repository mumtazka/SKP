-- =============================================================================
-- REMOVE PROGRESS SYSTEM
-- Migration: 003_remove_progress_system.sql
-- This removes all progress-related tables, triggers, functions, and enum types
-- Run this after 001_add_missing_tables.sql and 002_seed_data.sql
-- =============================================================================

-- =============================================================================
-- 1. DROP TRIGGERS FIRST (before dropping functions and tables)
-- =============================================================================

DROP TRIGGER IF EXISTS trigger_update_progress_percentage ON skp_activity_progress;
DROP TRIGGER IF EXISTS set_timestamp_skp_activity_progress ON skp_activity_progress;
DROP TRIGGER IF EXISTS set_timestamp_skp_progress ON skp_progress;
DROP TRIGGER IF EXISTS set_timestamp_skp_activities ON skp_activities;

-- =============================================================================
-- 2. DROP FUNCTIONS
-- =============================================================================

DROP FUNCTION IF EXISTS update_progress_percentage() CASCADE;
DROP FUNCTION IF EXISTS calculate_overall_percentage(UUID) CASCADE;

-- =============================================================================
-- 3. DROP TABLES (in order of dependencies - child tables first)
-- =============================================================================

-- Drop skp_progress_history (depends on skp_progress)
DROP TABLE IF EXISTS skp_progress_history CASCADE;

-- Drop skp_progress_comments (depends on skp_progress)
DROP TABLE IF EXISTS skp_progress_comments CASCADE;

-- Drop skp_progress_evidence (depends on skp_activity_progress)
DROP TABLE IF EXISTS skp_progress_evidence CASCADE;

-- Drop skp_activity_progress (depends on skp_progress and skp_activities)
DROP TABLE IF EXISTS skp_activity_progress CASCADE;

-- Drop skp_progress (depends on skps)
DROP TABLE IF EXISTS skp_progress CASCADE;

-- Drop skp_activities (depends on skps)
DROP TABLE IF EXISTS skp_activities CASCADE;

-- =============================================================================
-- 4. DROP ENUM TYPES
-- =============================================================================

DROP TYPE IF EXISTS progress_status CASCADE;
DROP TYPE IF EXISTS activity_status CASCADE;
DROP TYPE IF EXISTS periode_type CASCADE;
DROP TYPE IF EXISTS comment_type CASCADE;

-- =============================================================================
-- 5. CONFIRMATION (optional query to verify clean up)
-- =============================================================================

-- You can run this to verify the tables are gone:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name LIKE '%progress%' OR table_name = 'skp_activities';

-- =============================================================================
-- MIGRATION COMPLETE
-- Progress system has been completely removed from the database.
-- =============================================================================
