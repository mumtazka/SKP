-- =============================================================================
-- EMERGENCY DATABASE FIX - RUN THIS
-- =============================================================================
-- This script ensures the database has the 'pangkats' and 'jabatans' tables
-- and the 'pangkat' column in the users table.
-- =============================================================================

-- 1. Create tables if they don't exist
CREATE TABLE IF NOT EXISTS pangkats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    golongan TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jabatans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add 'pangkat' column to users if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'pangkat'
    ) THEN
        ALTER TABLE users ADD COLUMN pangkat TEXT;
    END IF;
END $$;

-- 3. Insert DEFAULT DATA so dropdowns work immediately
INSERT INTO pangkats (name, golongan)
SELECT n, g
FROM (VALUES 
    ('Pengatur Muda', 'II/a'), ('Pengatur Muda Tk. I', 'II/b'), ('Pengatur', 'II/c'), ('Pengatur Tk. I', 'II/d'),
    ('Penata Muda', 'III/a'), ('Penata Muda Tk. I', 'III/b'), ('Penata', 'III/c'), ('Penata Tk. I', 'III/d'),
    ('Pembina', 'IV/a'), ('Pembina Tk. I', 'IV/b'), ('Pembina Utama Muda', 'IV/c'), ('Pembina Utama Madya', 'IV/d'), ('Pembina Utama', 'IV/e')
) AS v(n, g)
WHERE NOT EXISTS (SELECT 1 FROM pangkats);

INSERT INTO jabatans (name)
SELECT n
FROM (VALUES 
    ('Asisten Ahli'), ('Lektor'), ('Lektor Kepala'), ('Guru Besar'), ('Tenaga Pengajar')
) AS v(n)
WHERE NOT EXISTS (SELECT 1 FROM jabatans);
