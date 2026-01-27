-- =============================================================================
-- BASE TABLES FOR SKP MANAGEMENT SYSTEM
-- Migration: 003_create_base_tables.sql
-- Creates departments, study_programs, users, and skps tables if they don't exist
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('dosen', 'kepegawaian', 'admin', 'superadmin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    head VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDY PROGRAMS
CREATE TABLE IF NOT EXISTS study_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_programs_department_id ON study_programs(department_id);

-- 4. USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Storing plain text as per current implementation (hashed recommended for production)
    full_name VARCHAR(255) NOT NULL,
    identity_number VARCHAR(100),
    role user_role NOT NULL DEFAULT 'dosen',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    study_program_id UUID REFERENCES study_programs(id) ON DELETE SET NULL,
    phone_number VARCHAR(50),
    address TEXT,
    is_homebase BOOLEAN DEFAULT false,
    jabatan VARCHAR(100),
    photo VARCHAR(1000),
    status BOOLEAN DEFAULT true,
    raters JSONB,
    attachments JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_study_program_id ON users(study_program_id);

-- 5. SKPS
CREATE TABLE IF NOT EXISTS skps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    evaluator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    year VARCHAR(4) NOT NULL,
    activity VARCHAR(255),
    category VARCHAR(50),
    target TEXT,
    objectives TEXT,
    output TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'Pending',
    progress INTEGER DEFAULT 0,
    score DECIMAL(5,2),
    details JSONB,
    feedback JSONB,
    approved_at TIMESTAMPTZ,
    evaluated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skps_user_id ON skps(user_id);
CREATE INDEX IF NOT EXISTS idx_skps_evaluator_id ON skps(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_skps_year ON skps(year);

-- 6. TIMESTAMPS TRIGGER
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_departments ON departments;
CREATE TRIGGER set_timestamp_departments
BEFORE UPDATE ON departments
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_study_programs ON study_programs;
CREATE TRIGGER set_timestamp_study_programs
BEFORE UPDATE ON study_programs
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_users ON users;
CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_skps ON skps;
CREATE TRIGGER set_timestamp_skps
BEFORE UPDATE ON skps
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- 7. DISABLE RLS (Development Mode)
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE skps DISABLE ROW LEVEL SECURITY;
