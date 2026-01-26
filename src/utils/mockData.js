// Initial mock data

// Departments with UUID-style IDs
export const INITIAL_DEPARTMENTS = [
  { id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', name: "Fakultas Ilmu Komputer", code: "FILKOM", head: "Dr. Ratna" },
  { id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', name: "HRD", code: "HR", head: "Budi Santoso" },
  { id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', name: "IT", code: "IT", head: "Super Admin" },
];

// Study Programs
export const INITIAL_STUDY_PROGRAMS = [
  { id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', name: "Teknik Informatika", code: "TI", departmentId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' },
  { id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', name: "Sistem Informasi", code: "SI", departmentId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' },
];

// Users with complete schema matching the database structure
// Only 3 users: 1 Admin, 1 Dosen, 1 Kepegawaian
export const INITIAL_USERS = [
  // 1. Super Admin
  {
    id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    username: "superadmin",
    password: "superadmin123",
    email: "admin@univ.ac.id",
    fullName: "Super Admin",
    identityNumber: "ADM-001",
    role: "superadmin",
    departmentId: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    studyProgramId: null,
    phoneNumber: "+62 821-0000-0001",
    address: "Gedung Rektorat Lt. 3, Universitas Indonesia",
    attachments: null,
    isHomebase: false,
    jabatan: "System Administrator",
    status: true,
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2024-03-11T10:00:00Z",
    photo: "https://ui-avatars.com/api/?name=Super+Admin&background=10B981&color=fff"
  },

  // 1.5 Admin (Rater Assigner)
  {
    id: 'z9y8x7w6-v5u4-3t2s-1r0q-p9o8n7m6l5k4',
    username: "admin",
    password: "admin123",
    email: "newadmin@univ.ac.id",
    fullName: "Admin SKP",
    identityNumber: "ADM-SKP-001",
    role: "admin",
    departmentId: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    studyProgramId: null,
    phoneNumber: "+62 821-0000-0002",
    address: "Gedung Rektorat Lt. 2, Universitas Indonesia",
    attachments: null,
    isHomebase: false,
    jabatan: "Admin Penilai SKP",
    status: true,
    createdAt: "2024-01-20T00:00:00Z",
    updatedAt: "2024-01-20T00:00:00Z",
    photo: "https://ui-avatars.com/api/?name=Admin+SKP&background=3B82F6&color=fff"
  },

  // 2. Dosen (Lecturer)
  {
    id: 'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
    username: "dosen",
    password: "dosen123",
    email: "ahmad@univ.ac.id",
    fullName: "Dr. Ahmad Suryadi, M.Kom",
    identityNumber: "NIP. 198501152010011001",
    role: "dosen",
    departmentId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    studyProgramId: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
    phoneNumber: "+62 812-3456-7890",
    address: "Jl. Mawar No. 15, Malang, Jawa Timur 65145",
    attachments: null,
    isHomebase: true,
    jabatan: "Lektor",
    status: true,
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-03-10T08:30:00Z",
    photo: "https://ui-avatars.com/api/?name=Ahmad+Suryadi&background=7C3AED&color=fff"
  },

  // 3. Kepegawaian (Staffing/HR)
  {
    id: 'b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e',
    username: "staff",
    password: "staff123",
    email: "budi.hr@univ.ac.id",
    fullName: "Budi Santoso, S.E., M.M.",
    identityNumber: "NIP. 199001011020011001",
    role: "kepegawaian",
    departmentId: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    studyProgramId: null,
    phoneNumber: "+62 856-7890-1234",
    address: "Jl. Dahlia No. 5, Bandung, Jawa Barat 40115",
    attachments: null,
    isHomebase: false,
    jabatan: "Kepala Bagian SDM",
    status: true,
    createdAt: "2023-01-10T08:00:00Z",
    updatedAt: "2024-03-11T07:45:00Z",
    photo: "https://ui-avatars.com/api/?name=Budi+Santoso&background=FBBF24&color=fff"
  }
];

export const INITIAL_SKPS = [
  {
    id: 'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f',
    userId: 'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
    year: '2024',
    activity: 'Pengajaran Mata Kuliah AI',
    category: 'Pengajaran',
    target: '14 Pertemuan + UTS + UAS',
    objectives: 'Menyelesaikan perkuliahan semester genap',
    output: 'Nilai Mahasiswa',
    startDate: '2024-02-01',
    endDate: '2024-07-31',
    status: 'In Progress',
    progress: 40,
    createdAt: '2024-01-15T08:00:00Z',
    approvedAt: '2024-01-20T11:00:00Z'
  }
];

export const STATUS_COLORS = {
  'Pending': 'warning',
  'Approved': 'success',
  'In Progress': 'info',
  'Completed': 'success',
  'Rejected': 'destructive',
  'Under Review': 'warning'
};
