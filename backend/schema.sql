-- SKP System Database Schema
-- This schema is designed for PostgreSQL/Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'kepegawaian', 'dosen');

-- ============================================
-- TABLES
-- ============================================

-- Departments (Fakultas)
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    head TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Study Programs (Program Studi)
CREATE TABLE study_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table matching the schema from the image
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    identity_number TEXT,                                -- NIP or NIK
    role user_role NOT NULL DEFAULT 'dosen',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    password TEXT NOT NULL,                              -- Should be hashed in production
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    username TEXT NOT NULL UNIQUE,
    study_program_id UUID REFERENCES study_programs(id) ON DELETE SET NULL,
    phone_number TEXT,
    address TEXT,
    attachments TEXT,                                    -- JSON or file paths
    is_homebase BOOLEAN DEFAULT FALSE,
    jabatan TEXT,                                        -- Position/Title
    status BOOLEAN DEFAULT TRUE,                         -- Account active/inactive
    photo TEXT                                           -- Profile photo URL
);

-- SKP table for work performance targets
CREATE TABLE skps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year TEXT NOT NULL,
    activity TEXT NOT NULL,
    category TEXT NOT NULL,
    target TEXT NOT NULL,
    objectives TEXT,
    output TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'Pending',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    evaluator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    evaluated_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_study_program ON users(study_program_id);

CREATE INDEX idx_skps_user_id ON skps(user_id);
CREATE INDEX idx_skps_year ON skps(year);
CREATE INDEX idx_skps_status ON skps(status);
CREATE INDEX idx_skps_evaluator ON skps(evaluator_id);

CREATE INDEX idx_study_programs_department ON study_programs(department_id);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_programs_updated_at
    BEFORE UPDATE ON study_programs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skps_updated_at
    BEFORE UPDATE ON skps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE skps ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert Departments
INSERT INTO departments (id, name, code, head) VALUES
    ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Fakultas Ilmu Komputer', 'FILKOM', 'Dr. Ratna'),
    ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'HRD', 'HR', 'Budi Santoso'),
    ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'IT', 'IT', 'Super Admin');

-- Insert Study Programs
INSERT INTO study_programs (id, name, code, department_id) VALUES
    ('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 'Teknik Informatika', 'TI', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),
    ('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'Sistem Informasi', 'SI', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d');

-- Insert Sample Users (1 Admin, 1 Dosen, 1 Kepegawaian)
-- Note: In production, passwords should be hashed!

-- 1. Super Admin
INSERT INTO users (
    id, email, full_name, identity_number, role, department_id, password, 
    username, study_program_id, phone_number, address, is_homebase, jabatan, status, photo
) VALUES (
    'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    'admin@univ.ac.id',
    'Super Admin',
    'ADM-001',
    'admin',
    'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    'admin123',
    'admin',
    NULL,
    '+62 821-0000-0001',
    'Gedung Rektorat Lt. 3, Universitas Indonesia',
    FALSE,
    'System Administrator',
    TRUE,
    'https://ui-avatars.com/api/?name=Super+Admin&background=10B981&color=fff'
);

-- 2. Dosen (Lecturer)
INSERT INTO users (
    id, email, full_name, identity_number, role, department_id, password, 
    username, study_program_id, phone_number, address, is_homebase, jabatan, status, photo
) VALUES (
    'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
    'ahmad@univ.ac.id',
    'Dr. Ahmad Suryadi, M.Kom',
    'NIP. 198501152010011001',
    'dosen',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    'dosen123',
    'dosen',
    'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    '+62 812-3456-7890',
    'Jl. Mawar No. 15, Malang, Jawa Timur 65145',
    TRUE,
    'Lektor',
    TRUE,
    'https://ui-avatars.com/api/?name=Ahmad+Suryadi&background=7C3AED&color=fff'
);

-- 3. Kepegawaian (Staffing/HR)
INSERT INTO users (
    id, email, full_name, identity_number, role, department_id, password, 
    username, study_program_id, phone_number, address, is_homebase, jabatan, status, photo
) VALUES (
    'b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e',
    'budi.hr@univ.ac.id',
    'Budi Santoso, S.E., M.M.',
    'NIP. 199001011020011001',
    'kepegawaian',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    'staff123',
    'staff',
    NULL,
    '+62 856-7890-1234',
    'Jl. Dahlia No. 5, Bandung, Jawa Barat 40115',
    FALSE,
    'Kepala Bagian SDM',
    TRUE,
    'https://ui-avatars.com/api/?name=Budi+Santoso&background=FBBF24&color=fff'
);

-- Insert Sample SKP for Dosen
INSERT INTO skps (
    id, user_id, year, activity, category, target, objectives, output,
    start_date, end_date, status, progress, score, evaluator_id
) VALUES (
    'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f',
    'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
    '2024',
    'Pengajaran Mata Kuliah AI',
    'Pengajaran',
    '14 Pertemuan + UTS + UAS',
    'Menyelesaikan perkuliahan semester genap',
    'Nilai Mahasiswa',
    '2024-02-01',
    '2024-07-31',
    'In Progress',
    40,
    NULL,
    NULL
);
