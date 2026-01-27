-- =============================================================================
-- SEED DATA FOR SKP MANAGEMENT SYSTEM
-- Migration: 002_seed_data.sql
-- Fixed: Handles existing users by looking up IDs dynamically
-- =============================================================================

-- =============================================================================
-- 1. DEPARTMENTS
-- =============================================================================

INSERT INTO departments (id, name, code, head) VALUES
    ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Fakultas Ilmu Komputer', 'FILKOM', 'Dr. Ratna'),
    ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'HRD', 'HR', 'Budi Santoso'),
    ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'IT', 'IT', 'Super Admin')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. STUDY PROGRAMS
-- =============================================================================

INSERT INTO study_programs (id, department_id, name, code) VALUES
    ('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Teknik Informatika', 'TI'),
    ('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Sistem Informasi', 'SI')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. USERS
-- Uses ON CONFLICT (email) to skip if exists
-- =============================================================================

INSERT INTO users (
    username, email, password, full_name, identity_number, role,
    department_id, study_program_id, phone_number, address, is_homebase,
    jabatan, status, photo, raters
) VALUES
    -- Super Admin
    (
        'superadmin', 'admin@univ.ac.id', 'superadmin123', 'Super Admin', 'ADM-001', 'superadmin',
        'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', NULL, '+62 821-0000-0001', 'Gedung Rektorat Lt. 3, Universitas Indonesia', false, 'System Administrator', true,
        'https://ui-avatars.com/api/?name=Super+Admin&background=10B981&color=fff', NULL
    ),
    -- Admin
    (
        'admin', 'newadmin@univ.ac.id', 'admin123', 'Admin SKP', 'ADM-SKP-001', 'admin',
        'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', NULL, '+62 821-0000-0002', 'Gedung Rektorat Lt. 2, Universitas Indonesia', false, 'Admin Penilai SKP', true,
        'https://ui-avatars.com/api/?name=Admin+SKP&background=3B82F6&color=fff', NULL
    ),
    -- Dosen
    (
        'dosen', 'ahmad@univ.ac.id', 'dosen123', 'Dr. Ahmad Suryadi, M.Kom', 'NIP. 198501152010011001', 'dosen',
        'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', '+62 812-3456-7890', 'Jl. Mawar No. 15, Malang, Jawa Timur 65145', true, 'Lektor', true,
        'https://ui-avatars.com/api/?name=Ahmad+Suryadi&background=7C3AED&color=fff', '{"pejabatPenilaiId": "b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e"}'::jsonb
    ),
    -- Kepegawaian (Staff)
    (
        'staff', 'budi.hr@univ.ac.id', 'staff123', 'Budi Santoso, S.E., M.M.', 'NIP. 199001011020011001', 'kepegawaian',
        'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', NULL, '+62 856-7890-1234', 'Jl. Dahlia No. 5, Bandung, Jawa Barat 40115', false, 'Kepala Bagian SDM', true,
        'https://ui-avatars.com/api/?name=Budi+Santoso&background=FBBF24&color=fff', NULL
    )
ON CONFLICT (email) DO NOTHING; 
-- Note: Assuming 'email' has a unique constraint. If only 'username' is unique, switch to (username).

-- =============================================================================
-- 4. SAMPLE SKP
-- Looks up User IDs dynamically to handle existing data
-- =============================================================================

DO $$
DECLARE
    v_dosen_id UUID;
    v_staff_id UUID;
    v_skp_id UUID := 'f1710520-0000-0000-0000-000000000001';
BEGIN
    -- Get IDs
    SELECT id INTO v_dosen_id FROM users WHERE email = 'ahmad@univ.ac.id';
    SELECT id INTO v_staff_id FROM users WHERE email = 'budi.hr@univ.ac.id';

    -- Insert SKP if users exist
    IF v_dosen_id IS NOT NULL AND v_staff_id IS NOT NULL THEN
        INSERT INTO skps (
            id, user_id, year, activity, category, target, objectives, output,
            start_date, end_date, status, progress, score, evaluator_id, details
        ) VALUES (
            v_skp_id,
            v_dosen_id,
            '2026',
            'Tri Dharma Perguruan Tinggi',
            'Utama',
            'Menyelesaikan semua kegiatan pengajaran, penelitian, dan pengabdian masyarakat',
            'Terlaksananya tri dharma perguruan tinggi dengan baik',
            'Laporan kegiatan dan dokumentasi',
            '2026-01-01',
            '2026-12-31',
            'Approved',
            0,
            NULL,
            v_staff_id,
            '{
                "utama": [
                    {"id": 1, "columns": ["<p>Melaksanakan perkuliahan/tutorial dan membimbing, menguji serta menyelenggarakan pendidikan di laboratorium, praktik keguruan bengkel/studio/kebun percobaan/teknologi pengajaran dan praktik lapangan</p>"]},
                    {"id": 2, "columns": ["<p>Membimbing mahasiswa seminar</p>"]},
                    {"id": 3, "columns": ["<p>Membimbing mahasiswa kuliah kerja nyata, praktik kerja nyata, praktik kerja lapang</p>"]},
                    {"id": 4, "columns": ["<p>Menguji pada ujian akhir</p>"]}
                ],
                "tambahan": [
                    {"id": 1, "columns": ["<p>Menjadi anggota dalam suatu panitia/badan pada perguruan tinggi</p>"]}
                ],
                "dukungan": [
                    {"id": 1, "columns": ["<p>Dukungan sarana dan prasarana pembelajaran yang memadai</p>"]}
                ],
                "skema": [
                    {"id": 1, "columns": ["<p>Hasil kerja dilaporkan setiap semester</p>"]}
                ],
                "konsekuensi": [
                    {"id": 1, "columns": ["<p>Apabila tidak memenuhi target maka akan dilakukan evaluasi kinerja</p>"]}
                ]
            }'::jsonb
        )
        ON CONFLICT (id) DO NOTHING;

        -- =============================================================================
        -- 5. SAMPLE SKP ACTIVITIES
        -- Only insert if we have the SKP (which we should, or it already existed)
        -- =============================================================================
        
        INSERT INTO skp_activities (id, skp_id, name, target_kuantitas, satuan, target_kualitas, bobot, category, activity_order) VALUES
            (
                'ae000001-0000-0000-0000-000000000001', v_skp_id,
                'Melaksanakan perkuliahan/tutorial dan membimbing, menguji serta menyelenggarakan pendidikan di laboratorium, praktik keguruan bengkel/studio/kebun percobaan/teknologi pengajaran dan praktik lapangan',
                1, 'Laporan', 100, 17.50, 'utama', 1
            ),
            (
                'ae000001-0000-0000-0000-000000000002', v_skp_id,
                'Membimbing mahasiswa seminar',
                1, 'Laporan', 100, 17.50, 'utama', 2
            ),
            (
                'ae000001-0000-0000-0000-000000000003', v_skp_id,
                'Membimbing mahasiswa kuliah kerja nyata, praktik kerja nyata, praktik kerja lapang',
                1, 'Laporan', 100, 17.50, 'utama', 3
            ),
            (
                'ae000001-0000-0000-0000-000000000004', v_skp_id,
                'Menguji pada ujian akhir',
                1, 'Laporan', 100, 17.50, 'utama', 4
            ),
            (
                'ae000001-0000-0000-0000-000000000005', v_skp_id,
                'Menjadi anggota dalam suatu panitia/badan pada perguruan tinggi',
                1, 'Kegiatan', 100, 30.00, 'tambahan', 5
            )
        ON CONFLICT (id) DO NOTHING;
        
    END IF;
END $$;
