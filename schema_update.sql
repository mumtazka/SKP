-- STEP 1: RUN THIS LINE BY ITSELF FIRST
-- PostgreSQL does not allow using a new ENUM value in the same transaction it was created.
-- Select ONLY this line and run it, then run the rest.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';

-- STEP 2: RUN THE REST OF THIS SCRIPT AFTER STEP 1 IS COMMITTED
-- 2. Update existing 'admin' role to 'superadmin'
UPDATE users 
SET role = 'superadmin', 
    username = 'superadmin', 
    updated_at = NOW() 
WHERE username = 'admin' AND role = 'admin';

-- 3. Insert new 'admin' user for rater assignment
INSERT INTO users (
    id, username, password, email, full_name, identity_number, 
    role, department_id, is_homebase, jabatan, status, 
    created_at, updated_at
) VALUES (
    gen_random_uuid(), 'admin', 'admin123', 'newadmin@univ.ac.id', 'Admin SKP', 'ADM-SKP-001', 
    'admin', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', false, 'Admin Penilai SKP', true, 
    NOW(), NOW()
);

-- 4. Add columns or table for rater assignments
-- Option A: JSONB column in users (flexible for mock-like structure)
ALTER TABLE users ADD COLUMN IF NOT EXISTS raters JSONB;

-- Option B: Normalization (Preferred for production)
/*
CREATE TABLE IF NOT EXISTS skp_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecturer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pejabat_penilai_id UUID REFERENCES users(id),
    atasan_pejabat_penilai_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lecturer_id)
);
*/
