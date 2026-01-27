-- =============================================================================
-- FULL SYSTEM SCHEMA SKP MANAGEMENT SYSTEM
-- Covers: Users, Departments, SKP Planning, Progress Tracking, Approvals
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. ENUMS & TYPES
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('dosen', 'kepegawaian', 'admin', 'superadmin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE skp_status AS ENUM ('Draft', 'Pending', 'Approved', 'Rejected');
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

-- =============================================================================
-- 2. CORE MASTER DATA
-- =============================================================================

-- Departments (Fakultas/Unit Kerja)
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    head_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study Programs (Prodi)
CREATE TABLE IF NOT EXISTS study_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 3. USER MANAGEMENT
-- =============================================================================

-- Users Table (Extends Supabase Auth or Standalone)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Sync with auth.users.id if using Supabase Auth
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT, -- Only if not using Supabase Auth
    full_name VARCHAR(255) NOT NULL,
    identity_number VARCHAR(100) UNIQUE, -- NIP/NIDN
    role user_role NOT NULL DEFAULT 'dosen',
    
    -- Structure
    department_id UUID REFERENCES departments(id),
    study_program_id UUID REFERENCES study_programs(id),
    
    -- Profile Details
    phone_number VARCHAR(50),
    address TEXT,
    is_homebase BOOLEAN DEFAULT true,
    jabatan VARCHAR(100), -- Lektor, Asisten Ahli, etc.
    pangkat VARCHAR(100), -- III/c, etc.
    photo_url TEXT,
    status BOOLEAN DEFAULT true,
    
    -- JSON for flexible config (rater assignments)
    -- Stores: { "pejabatPenilaiId": "uuid" }
    config JSONB DEFAULT '{}'::jsonb, 
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 4. SKP PLANNING (Rencana Sasaran Kinerja Pegawai)
-- =============================================================================

CREATE TABLE IF NOT EXISTS skps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    evaluator_id UUID REFERENCES users(id), -- Pejabat Penilai
    
    period VARCHAR(10) NOT NULL, -- "2026"
    status skp_status NOT NULL DEFAULT 'Draft',
    
    -- The Plan Details (Rencana Hasil Kerja)
    -- Stored in JSONB for flexibility of the dynamic rows (Utama, Tambahan, etc.)
    -- Structure matches the UI rows state
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    feedback JSONB, -- Global feedback/notes
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, period)
);

-- =============================================================================
-- 5. SKP PROGRESS TRACKING
-- =============================================================================

-- Normalized Activities Table
-- Extracted from Approved SKP for cleaner tracking
CREATE TABLE IF NOT EXISTS skp_activities_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skp_id UUID REFERENCES skps(id) ON DELETE CASCADE,
    
    -- Core Activity Info
    name TEXT NOT NULL,
    target_kuantitas DECIMAL(10,2) DEFAULT 0,
    satuan VARCHAR(50) DEFAULT 'Kegiatan',
    target_kualitas INTEGER DEFAULT 100,
    category VARCHAR(50) DEFAULT 'utama', -- utama/tambahan
    bobot DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress Reports (Bulanan/Periodik)
CREATE TABLE IF NOT EXISTS skp_progress_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skp_id UUID REFERENCES skps(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    periode date NOT NULL, -- YYYY-MM-01
    periode_type periode_type DEFAULT 'bulanan',
    
    status progress_status DEFAULT 'draft',
    overall_percentage DECIMAL(5,2) DEFAULT 0,
    
    submitted_date TIMESTAMPTZ,
    reviewed_date TIMESTAMPTZ,
    approved_date TIMESTAMPTZ,
    
    reviewer_id UUID REFERENCES users(id),
    reviewer_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(skp_id, periode)
);

-- Detail Progress Per Activity
CREATE TABLE IF NOT EXISTS skp_progress_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES skp_progress_reports(id) ON DELETE CASCADE,
    activity_tracking_id UUID REFERENCES skp_activities_tracking(id) ON DELETE CASCADE,
    
    realisasi_kuantitas DECIMAL(10,2) DEFAULT 0,
    realisasi_kualitas INTEGER DEFAULT 0,
    
    percentage_completed DECIMAL(5,2) DEFAULT 0,
    status activity_status DEFAULT 'not_started',
    
    -- Analysis
    kendala TEXT,
    solusi TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(report_id, activity_tracking_id)
);

-- Evidence Files (Bukti Dukung)
CREATE TABLE IF NOT EXISTS skp_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    progress_detail_id UUID REFERENCES skp_progress_details(id) ON DELETE CASCADE,
    
    file_name VARCHAR(255),
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    description TEXT,
    
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress History / Audit Log
CREATE TABLE IF NOT EXISTS skp_progress_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES skp_progress_reports(id) ON DELETE CASCADE,
    
    action VARCHAR(50), -- submitted, approved, rejected, etc.
    actor_id UUID REFERENCES users(id),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 6. INDEXES & PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_skps_user_period ON skps(user_id, period);
CREATE INDEX IF NOT EXISTS idx_progress_user_periode ON skp_progress_reports(user_id, periode);
CREATE INDEX IF NOT EXISTS idx_evidence_detail ON skp_evidence(progress_detail_id);

-- =============================================================================
-- 7. SECURITY (Row Level Security)
-- =============================================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE skps ENABLE ROW LEVEL SECURITY;
ALTER TABLE skp_progress_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE skp_evidence ENABLE ROW LEVEL SECURITY;

-- Simple Policy Examples (Adjust based on exact Auth setup)
-- 1. Users can view their own data
CREATE POLICY "Users view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users view own SKP" ON skps FOR SELECT USING (auth.uid() = user_id);

-- 2. Public read for departments (usually visible to all authenticated)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read departments" ON departments FOR SELECT TO authenticated USING (true);

-- =============================================================================
-- 8. TRIGGER FOR UPDATED_AT
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_skps
BEFORE UPDATE ON skps
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_progress
BEFORE UPDATE ON skp_progress_reports
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
