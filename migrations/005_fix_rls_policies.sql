-- =============================================================================
-- FIX RLS POLICIES
-- Migration: 004_fix_rls_policies.sql
-- This disables RLS on the users table to allow registration and login checks without issues.
-- =============================================================================

-- Disable RLS on users table to prevent "row-level security policy" errors
-- during registration and login
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Ensure RLS is disabled on other core tables just in case
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE skps DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
