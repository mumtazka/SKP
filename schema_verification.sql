-- =============================================================================
-- FULL SCHEMA VERIFICATION AND FIX SCRIPT
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT,
    head TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDY PROGRAMS
CREATE TABLE IF NOT EXISTS study_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PANGKATS
CREATE TABLE IF NOT EXISTS pangkats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    golongan TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. JABATANS
CREATE TABLE IF NOT EXISTS jabatans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. USERS
-- Ensure role enum exists (if using enum, otherwise text constraint)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'dosen', 'kepegawaian', 'superadmin');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    identity_number TEXT,
    role user_role DEFAULT 'dosen',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    study_program_id UUID REFERENCES study_programs(id) ON DELETE SET NULL,
    phone_number TEXT,
    address TEXT,
    is_homebase BOOLEAN DEFAULT FALSE,
    jabatan TEXT,    -- Can be text or reference, current app uses text or text with selection
    pangkat TEXT,    -- Added based on requirements
    photo TEXT,
    status BOOLEAN DEFAULT TRUE,
    raters JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SKPS
CREATE TABLE IF NOT EXISTS skps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    year TEXT NOT NULL,
    activity TEXT,
    category TEXT,
    target TEXT,
    objectives TEXT,
    output TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'Pending',
    progress INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    details JSONB,
    feedback JSONB,
    
    -- Realisasi Columns
    realisasi JSONB DEFAULT NULL,
    realisasi_status TEXT DEFAULT 'Pending', -- 'Pending', 'Submitted', 'Approved', 'Rejected'
    realisasi_submitted_at TIMESTAMPTZ,
    realisasi_reviewed_at TIMESTAMPTZ,
    realisasi_reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    evaluated_at TIMESTAMPTZ
);

-- 8. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_role TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SEED DATA (IF EMPTY)
-- Insert Pangkats if empty
INSERT INTO pangkats (name, golongan)
SELECT n, g
FROM (VALUES 
    ('Pengatur Muda', 'II/a'), ('Pengatur Muda Tk. I', 'II/b'), ('Pengatur', 'II/c'), ('Pengatur Tk. I', 'II/d'),
    ('Penata Muda', 'III/a'), ('Penata Muda Tk. I', 'III/b'), ('Penata', 'III/c'), ('Penata Tk. I', 'III/d'),
    ('Pembina', 'IV/a'), ('Pembina Tk. I', 'IV/b'), ('Pembina Utama Muda', 'IV/c'), ('Pembina Utama Madya', 'IV/d'), ('Pembina Utama', 'IV/e')
) AS v(n, g)
WHERE NOT EXISTS (SELECT 1 FROM pangkats);

-- Insert Jabatans if empty
INSERT INTO jabatans (name)
SELECT n
FROM (VALUES 
    ('Asisten Ahli'), ('Lektor'), ('Lektor Kepala'), ('Guru Besar'), ('Tenaga Pengajar')
) AS v(n)
WHERE NOT EXISTS (SELECT 1 FROM jabatans);
