-- =============================================================================
-- ADDITIONAL TABLES FOR SKP MANAGEMENT SYSTEM
-- Migration: 001_add_missing_tables.sql
-- This adds missing tables to your existing schema (notifications, progress, etc.)
-- Uses IF NOT EXISTS for safe re-runs
-- =============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. ENUM TYPES (if not exists)
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('dosen', 'kepegawaian', 'admin', 'superadmin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE progress_status AS ENUM ('draft', 'submitted', 'reviewed', 'approved', 'rejected', 'revision_needed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE activity_status AS ENUM ('not_started', 'in_progress', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE periode_type AS ENUM ('bulanan', 'triwulanan', 'semesteran', 'tahunan');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE comment_type AS ENUM ('pegawai', 'atasan', 'catatan_sistem');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- 2. NOTIFICATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_role user_role,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
    link VARCHAR(500),
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(target_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(target_role);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- =============================================================================
-- 3. SKP ACTIVITIES TABLE (Activities extracted from approved SKP)
-- =============================================================================

CREATE TABLE IF NOT EXISTS skp_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skp_id UUID REFERENCES skps(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    target_kuantitas DECIMAL(10,2) NOT NULL DEFAULT 0,
    satuan VARCHAR(50) NOT NULL DEFAULT 'unit',
    target_kualitas INTEGER NOT NULL DEFAULT 80 CHECK (target_kualitas >= 0 AND target_kualitas <= 100),
    bobot DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (bobot >= 0 AND bobot <= 100),
    category VARCHAR(50) NOT NULL DEFAULT 'utama', -- utama, tambahan
    description TEXT,
    activity_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skp_activities_skp_id ON skp_activities(skp_id);

-- =============================================================================
-- 4. SKP PROGRESS TABLE (Monthly/Periodic Progress Reports)
-- =============================================================================

CREATE TABLE IF NOT EXISTS skp_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skp_id UUID REFERENCES skps(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    periode DATE NOT NULL, -- YYYY-MM-01
    periode_type periode_type DEFAULT 'bulanan',
    status_progress progress_status DEFAULT 'draft',
    overall_percentage DECIMAL(5,2) DEFAULT 0 CHECK (overall_percentage >= 0 AND overall_percentage <= 100),
    
    submitted_date TIMESTAMPTZ,
    reviewed_date TIMESTAMPTZ,
    approved_date TIMESTAMPTZ,
    
    reviewer_id UUID REFERENCES users(id),
    reviewer_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(skp_id, periode)
);

CREATE INDEX IF NOT EXISTS idx_skp_progress_user_id ON skp_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_skp_progress_skp_id ON skp_progress(skp_id);
CREATE INDEX IF NOT EXISTS idx_skp_progress_status ON skp_progress(status_progress);
CREATE INDEX IF NOT EXISTS idx_skp_progress_periode ON skp_progress(periode);

-- =============================================================================
-- 5. SKP ACTIVITY PROGRESS TABLE (Progress per Activity)
-- =============================================================================

CREATE TABLE IF NOT EXISTS skp_activity_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skp_progress_id UUID REFERENCES skp_progress(id) ON DELETE CASCADE NOT NULL,
    kegiatan_id UUID REFERENCES skp_activities(id) ON DELETE CASCADE NOT NULL,
    kegiatan_name VARCHAR(500) NOT NULL, -- Denormalized for display
    target_kuantitas DECIMAL(10,2) NOT NULL DEFAULT 0,
    satuan VARCHAR(50) NOT NULL DEFAULT 'unit',
    realisasi_kuantitas DECIMAL(10,2) NOT NULL DEFAULT 0,
    target_kualitas INTEGER NOT NULL DEFAULT 80,
    realisasi_kualitas INTEGER NOT NULL DEFAULT 0 CHECK (realisasi_kualitas >= 0 AND realisasi_kualitas <= 100),
    percentage_completed DECIMAL(5,2) NOT NULL DEFAULT 0,
    bobot DECIMAL(5,2) NOT NULL DEFAULT 0,
    status activity_status NOT NULL DEFAULT 'not_started',
    kendala TEXT,
    kendala_category VARCHAR(50), -- teknis, sdm, anggaran, eksternal, waktu, lainnya
    solusi TEXT,
    rencana_tindak_lanjut TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(skp_progress_id, kegiatan_id)
);

CREATE INDEX IF NOT EXISTS idx_skp_activity_progress_progress_id ON skp_activity_progress(skp_progress_id);

-- =============================================================================
-- 6. SKP PROGRESS EVIDENCE TABLE (Attachments/Files)
-- =============================================================================

CREATE TABLE IF NOT EXISTS skp_progress_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_progress_id UUID REFERENCES skp_activity_progress(id) ON DELETE CASCADE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skp_progress_evidence_activity_id ON skp_progress_evidence(activity_progress_id);

-- =============================================================================
-- 7. SKP PROGRESS COMMENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS skp_progress_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skp_progress_id UUID REFERENCES skp_progress(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    comment_type comment_type NOT NULL DEFAULT 'pegawai',
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skp_progress_comments_progress_id ON skp_progress_comments(skp_progress_id);

-- =============================================================================
-- 8. SKP PROGRESS HISTORY TABLE (Audit Trail)
-- =============================================================================

CREATE TABLE IF NOT EXISTS skp_progress_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skp_progress_id UUID REFERENCES skp_progress(id) ON DELETE CASCADE NOT NULL,
    action VARCHAR(50) NOT NULL, -- created, submitted, approved, rejected, revision_requested
    action_by UUID REFERENCES users(id) ON DELETE SET NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skp_progress_history_progress_id ON skp_progress_history(skp_progress_id);

-- =============================================================================
-- 9. MODIFY SKPS TABLE TO ADD DETAILS COLUMN (if not exists)
-- =============================================================================

-- Add details column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'skps' AND column_name = 'details'
    ) THEN
        ALTER TABLE skps ADD COLUMN details JSONB;
    END IF;
END $$;

-- Add feedback column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'skps' AND column_name = 'feedback'
    ) THEN
        ALTER TABLE skps ADD COLUMN feedback JSONB;
    END IF;
END $$;

-- =============================================================================
-- 10. TRIGGER FUNCTION FOR UPDATED_AT
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for new tables
DROP TRIGGER IF EXISTS set_timestamp_skp_activities ON skp_activities;
CREATE TRIGGER set_timestamp_skp_activities
BEFORE UPDATE ON skp_activities
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_skp_progress ON skp_progress;
CREATE TRIGGER set_timestamp_skp_progress
BEFORE UPDATE ON skp_progress
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_skp_activity_progress ON skp_activity_progress;
CREATE TRIGGER set_timestamp_skp_activity_progress
BEFORE UPDATE ON skp_activity_progress
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- =============================================================================
-- 11. HELPER FUNCTIONS
-- =============================================================================

-- Function to calculate overall percentage for a progress report
CREATE OR REPLACE FUNCTION calculate_overall_percentage(progress_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_weighted_percentage DECIMAL(10,4);
    total_bobot DECIMAL(10,4);
BEGIN
    SELECT 
        COALESCE(SUM(percentage_completed * bobot), 0),
        COALESCE(SUM(bobot), 0)
    INTO total_weighted_percentage, total_bobot
    FROM skp_activity_progress
    WHERE skp_progress_id = progress_id;
    
    IF total_bobot = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN ROUND((total_weighted_percentage / total_bobot)::DECIMAL, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update overall percentage when activity progress changes
CREATE OR REPLACE FUNCTION update_progress_percentage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE skp_progress
    SET overall_percentage = calculate_overall_percentage(NEW.skp_progress_id)
    WHERE id = NEW.skp_progress_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update overall percentage
DROP TRIGGER IF EXISTS trigger_update_progress_percentage ON skp_activity_progress;
CREATE TRIGGER trigger_update_progress_percentage
    AFTER INSERT OR UPDATE ON skp_activity_progress
    FOR EACH ROW EXECUTE FUNCTION update_progress_percentage();

-- =============================================================================
-- 12. DISABLE RLS FOR DEVELOPMENT (You can enable later with proper policies)
-- =============================================================================

-- Disable RLS for easier development
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE skp_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE skp_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE skp_activity_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE skp_progress_evidence DISABLE ROW LEVEL SECURITY;
ALTER TABLE skp_progress_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE skp_progress_history DISABLE ROW LEVEL SECURITY;

-- If you want to enable RLS later, uncomment below and add policies
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- (Add policies as needed)
