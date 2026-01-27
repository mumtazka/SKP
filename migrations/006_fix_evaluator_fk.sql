-- =============================================================================
-- FIX EVALUATOR FOREIGN KEY NAME
-- Migration: 006_fix_evaluator_fk.sql
-- Force the constraint name for evaluator_id to be 'skps_evaluator_id_fkey'
-- to ensure the API explicit join works correctly.
-- =============================================================================

-- 1. Try to start fresh for this specific constraint
-- We attempt to drop it if it exists by the standard name
ALTER TABLE skps DROP CONSTRAINT IF EXISTS skps_evaluator_id_fkey;

-- 2. Re-add the constraint with the EXPLICIT name required by our API
ALTER TABLE skps
    ADD CONSTRAINT skps_evaluator_id_fkey
    FOREIGN KEY (evaluator_id)
    REFERENCES users(id)
    ON DELETE SET NULL;

-- 3. Also parse-check the user_id constraint just in case
ALTER TABLE skps DROP CONSTRAINT IF EXISTS skps_user_id_fkey;

ALTER TABLE skps
    ADD CONSTRAINT skps_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
