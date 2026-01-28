-- =============================================================================
-- ENSURE PANGKAT COLUMN EXISTS
-- Migration: 010_ensure_pangkat_column.sql
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
