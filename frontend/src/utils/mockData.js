// Initial mock data
export const INITIAL_USERS = [
  // Dosen
  {
    id: 'u1',
    username: "dosen1",
    password: "dosen123",
    fullName: "Dr. Ahmad Suryadi",
    role: "dosen",
    department: "Teknik Informatika",
    email: "ahmad@univ.ac.id",
    status: true,
    lastLogin: "2024-03-10T08:30:00Z",
    photo: "https://ui-avatars.com/api/?name=Ahmad+Suryadi&background=7C3AED&color=fff"
  },
  {
    id: 'u2',
    username: "dosen2",
    password: "dosen123",
    fullName: "Dr. Siti Aminah",
    role: "dosen",
    department: "Sistem Informasi",
    email: "siti@univ.ac.id",
    status: true,
    lastLogin: "2024-03-09T14:20:00Z",
    photo: "https://ui-avatars.com/api/?name=Siti+Aminah&background=7C3AED&color=fff"
  },
  {
    id: 'u3',
    username: "dosen3",
    password: "dosen123",
    fullName: "Prof. Budi Hartono",
    role: "dosen",
    department: "Teknik Elektro",
    email: "budi@univ.ac.id",
    status: true,
    lastLogin: "2024-03-08T09:15:00Z",
    photo: "https://ui-avatars.com/api/?name=Budi+Hartono&background=7C3AED&color=fff"
  },

  // Kepegawaian (HR)
  {
    id: 'u4',
    username: "hr1",
    password: "hr123",
    fullName: "Budi Santoso",
    role: "kepegawaian",
    department: "HRD",
    email: "budi.hr@univ.ac.id",
    status: true,
    lastLogin: "2024-03-11T07:45:00Z",
    photo: "https://ui-avatars.com/api/?name=Budi+Santoso&background=FBBF24&color=fff"
  },
  {
    id: 'u5',
    username: "hr2",
    password: "hr123",
    fullName: "Rina Kartika",
    role: "kepegawaian",
    department: "HRD",
    email: "rina.hr@univ.ac.id",
    status: true,
    lastLogin: "2024-03-10T16:00:00Z",
    photo: "https://ui-avatars.com/api/?name=Rina+Kartika&background=FBBF24&color=fff"
  },

  // Admin
  {
    id: 'u6',
    username: "admin",
    password: "admin123",
    fullName: "Super Admin",
    role: "admin",
    department: "IT",
    email: "admin@univ.ac.id",
    status: true,
    lastLogin: "2024-03-11T10:00:00Z",
    photo: "https://ui-avatars.com/api/?name=Super+Admin&background=10B981&color=fff"
  }
];

export const INITIAL_DEPARTMENTS = [
  { id: 'd1', name: "Teknik Informatika", code: "TI", head: "Dr. Zulkifli" },
  { id: 'd2', name: "Sistem Informasi", code: "SI", head: "Dr. Ratna" },
  { id: 'd3', name: "Teknik Elektro", code: "TE", head: "Prof. Bambang" },
  { id: 'd4', name: "Teknik Sipil", code: "TS", head: "Ir. Wijaya" },
  { id: 'd5', name: "Manajemen", code: "MN", head: "Dr. Susanti" },
  { id: 'd6', name: "Akuntansi", code: "AK", head: "Dr. Hendra" },
  { id: 'd7', name: "HRD", code: "HR", head: "Budi Santoso" },
  { id: 'd8', name: "IT", code: "IT", head: "Super Admin" },
];

export const INITIAL_SKPS = [
  // 2023 SKPs (Completed)
  {
    id: 's1',
    userId: 'u1',
    year: '2023',
    activity: 'Penelitian IoT Smart Home',
    category: 'Penelitian',
    target: 'Jurnal Internasional Q2',
    objectives: 'Mempublikasikan hasil penelitian',
    output: 'Published Paper',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    status: 'Completed',
    progress: 100,
    score: 85,
    evaluatorId: 'u4',
    createdAt: '2023-01-10T09:00:00Z',
    approvedAt: '2023-01-15T14:00:00Z',
    evaluatedAt: '2023-12-20T10:00:00Z'
  },
  // 2024 SKPs (In Progress/Submitted)
  {
    id: 's2',
    userId: 'u1',
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
  },
  {
    id: 's3',
    userId: 'u2',
    year: '2024',
    activity: 'Pengabdian Masyarakat UMKM',
    category: 'Pengabdian',
    target: 'Pendampingan 5 UMKM',
    objectives: 'Digitalisasi UMKM lokal',
    output: 'Laporan Kegiatan',
    startDate: '2024-03-01',
    endDate: '2024-08-31',
    status: 'Pending',
    progress: 0,
    createdAt: '2024-02-28T10:00:00Z'
  }
];

export const STATUS_COLORS = {
  'Pending': 'warning',
  'Approved': 'success',
  'In Progress': 'info',
  'Completed': 'success',
  'Rejected': 'destructive',
  'Under Review': 'warning' // Or orange if custom defined
};
