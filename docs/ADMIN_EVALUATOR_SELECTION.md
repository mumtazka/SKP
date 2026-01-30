# Admin Evaluator Selection - Implementation Guide

## Overview
Fitur ini memungkinkan **Admin** untuk memilih Kepegawaian (Penilai) yang ingin dimonitor saat mengakses menu-menu Penilai.

## Konsep
Ketika Admin mengakses menu Penilai (Persetujuan, Daftar SKP, Penilaian, Riwayat Pegawai), Admin harus bisa memilih "sebagai siapa" mereka ingin monitor data - yaitu memilih Kepegawaian A atau B.

Ini penting karena setiap Kepegawaian memiliki daftar dosen/pegawai yang berbeda untuk dinilai.

## Components Created

### 1. EvaluatorContext (`src/context/EvaluatorContext.jsx`)
Context global yang menyimpan state:
- `selectedEvaluatorId`: ID kepegawaian yang dipilih
- `selectedEvaluator`: Object lengkap kepegawaian yang dipilih
- `setSelectedEvaluatorId`, `setSelectedEvaluator`: Setter functions

**Auto-select behavior:**
- Jika user adalah Kepegawaian: auto-select diri sendiri
- Jika Admin: harus manual pilih dari dropdown

### 2. EvaluatorSelector (`src/components/common/EvaluatorSelector.jsx`)
Komponen reusable searchable combobox untuk memilih Kepegawaian.

**Features:**
- Searchable Command dropdown (ketik nama/NIP langsung)
- Show only users dengan role `kepegawaian`
- Auto-select jika hanya ada 1 kepegawaian
- Visual feedback (check mark untuk selected)
- Info card menampilkan siapa yang sedang dimonitor

**Props:**
```javascript
<EvaluatorSelector 
    title="Pilih Kepegawaian (Penilai)"
    description="Sebagai admin, pilih kepegawaian yang ingin Anda monitor"
    className="mb-6"
/>
```

## Cara Implementasi di Halaman Penilai

### Step 1: Import Dependencies
```javascript
import { useEvaluator } from '@/context/EvaluatorContext';
import EvaluatorSelector from '@/components/common/EvaluatorSelector';
```

### Step 2: Use Evaluator Context
```javascript
const { selectedEvaluatorId, selectedEvaluator } = useEvaluator();
```

### Step 3: Add Selector Component (untuk Admin saja)
```javascript
return (
    <div>  
        {/* Tampilkan selector hanya untuk Admin */}
        <EvaluatorSelector className="mb-6" />
        
        {/* Rest of your page content */}
    </div>
);
```

### Step 4: Filter Data Berdasarkan Evaluator
```javascript
const fetchData = async () => {
    try {
        const skps = await api.skps.getAll();
        const allUsers = await api.users.getAll();
        
        let targetEvaluatorId = user.id; // Default untuk Kepegawaian
        
        // Jika Admin dan sudah pilih evaluator
        if ((user.role === 'admin' || user.role === 'superadmin') && selectedEvaluatorId) {
            targetEvaluatorId = selectedEvaluatorId;
        }
        
        // Filter lecturers yang dinilai oleh evaluator ini
        const assignedLecturers = allUsers.filter(u =>
            u.role === 'dosen' &&
            u.raters?.includes(targetEvaluatorId) // atau sesuai struktur raters Anda
        );
        
        const assignedLecturerIds = assignedLecturers.map(l => l.id);
        
        // Filter SKPs
        const filteredSkps = skps.filter(s => 
            assignedLecturerIds.includes(s.userId)
        );
        
        // Update state dengan data yang sudah difilter
        setSkpData(filteredSkps);
    } catch (error) {
        console.error('Error:', error);
    }
};

// Re-fetch saat selected evaluator berubah
useEffect(() => {
    fetchData();
}, [selectedEvaluatorId]);
```

## Halaman yang Perlu Diupdate

1. **PenilaiDashboard** (`src/pages/penilai/PenilaiDashboard.jsx`)
2. **Approval** (`src/pages/penilai/Approval.jsx`)
3. **ApprovedSKPList** (`src/pages/penilai/ApprovedSKPList.jsx`)
4. **Evaluations** (`src/pages/penilai/Evaluations.jsx`)
5. **HistorySKP** (`src/pages/penilai/HistorySKP.jsx`)
6. **ReviewRealisasi** (`src/pages/penilai/ReviewRealisasi.jsx`)

## example Implementation - Simplified

```javascript
import { useAuth } from '@/context/AuthContext';
import { useEvaluator } from '@/context/EvaluatorContext';
import EvaluatorSelector from '@/components/common/EvaluatorSelector';

const PenilaiPage = () => {
    const { user } = useAuth();
    const { selectedEvaluatorId } = useEvaluator();
    const [data, setData] = useState([]);
    
    useEffect(() => {
        const loadData = async () => {
            // Tentukan evaluator ID yang digunakan
            const evaluatorId = (user.role === 'admin' || user.role === 'superadmin') 
                ? selectedEvaluatorId 
                : user.id;
            
            if (!evaluatorId) {
                // Admin belum pilih evaluator
                setData([]);
                return;
            }
            
            // Fetch dan filter data berdasarkan evaluatorId
            const result = await fetchDataByEvaluator(evaluatorId);
            setData(result);
        };
        
        loadData();
    }, [selectedEvaluatorId, user]);
    
    return (
        <div>
            {/* Selector untuk Admin */}
            <EvaluatorSelector className="mb-6" />
            
            {/* Warning jika Admin belum pilih */}
            {(user.role === 'admin' || user.role === 'superadmin') && !selectedEvaluatorId && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800">
                        Silakan pilih Kepegawaian terlebih dahulu untuk melihat data.
                    </p>
                </div>
            )}
            
            {/* Your page content */}
            {data.length > 0 ? (
                <div>/* Display data */</div>
            ) : (
                <div>No data</div>
            )}
        </div>
    );
};
```

## Important Notes

1. **EvaluatorProvider sudah di-wrap di App.jsx** - context tersedia di seluruh app
2. **Auto-selection**: Kepegawaian otomatis select diri sendiri, Admin harus manual pilih
3. **Persistence**: State evaluator selected akan hilang saat refresh (bisa ditambahkan localStorage jika perlu)
4. **Validation**: Selalu check `selectedEvaluatorId` sebelum fetch data untuk Admin

## Next Steps

Untuk setiap halaman Penilai yang disebutkan di atas:
1. Import `useEvaluator` dan `EvaluatorSelector`
2. Tambahkan `<EvaluatorSelector />` di bagian atas halaman  
3. Update logic fetch data untuk menggunakan `selectedEvaluatorId`
4. Tambahkan `useEffect` dependency pada `selectedEvaluatorId`

Dengan ini, Admin bisa memilih Kepegawaian mana yang ingin dimonitor di semua halaman Penilai.
