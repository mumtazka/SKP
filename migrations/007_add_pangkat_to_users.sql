-- =============================================================================
-- ADD PANGKAT COLUMN TO USERS
-- Migration: 007_add_pangkat_to_users.sql
-- Adds 'pangkat' column to users table as it is required for SKP printing.
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'pangkat'
    ) THEN
        ALTER TABLE users ADD COLUMN pangkat VARCHAR(100);
    END IF;
END $$;
