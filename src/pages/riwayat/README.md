# Fitur Riwayat SKP

## Deskripsi
Fitur Riwayat SKP memungkinkan Admin, Kepegawaian (Penilai), dan Dosen untuk melihat riwayat SKP yang sudah dinilai beserta analisis performa melalui grafik distribusi rating.

## Akses Berdasarkan Role

### 1. **Dosen**
- **Path**: `/dosen/history`
- **Fungsi**: Melihat riwayat SKP pribadi
- **Fitur**:
  - Daftar SKP yang sudah dinilai (approved)
  - Grafik line chart distribusi rating pribadi
  - Statistik performa (rata-rata, tertinggi, terendah)
  - Analisis kategori rating (Sangat Baik, Baik, Cukup, Buruk, Sangat Buruk)

### 2. **Kepegawaian (Penilai)**
- **Path**: `/penilai/riwayat`
- **Fungsi**: 
  - Melihat riwayat SKP pribadi (karena penilai juga mengajukan SKP)
  - Melihat riwayat SKP dari pegawai yang dinilai
- **Fitur**:
  - Dropdown untuk memilih pegawai yang dinilai
  - Bisa melihat riwayat pribadi dengan memilih "Diri Sendiri"
  - Grafik distribusi rating untuk setiap user yang dipilih
  - Analisis performa detail

### 3. **Admin / Superadmin**
- **Path**: `/admin/riwayat` atau `/superadmin/riwayat`
- **Fungsi**: Melihat riwayat SKP dari semua user
- **Fitur**:
  - Dropdown search untuk memilih user (dosen/kepegawaian)
  - Filter pencarian berdasarkan nama atau NIP/NIDN
  - Grafik distribusi rating untuk setiap user yang dipilih
  - Analisis performa lengkap

## Komponen

### 1. RiwayatSKP.jsx
- **Lokasi**: `src/pages/riwayat/RiwayatSKP.jsx`
- **Fungsi**: Komponen utama untuk halaman riwayat
- **Fitur**:
  - User selector (untuk admin dan kepegawaian)
  - Tabs untuk History dan Grafik
  - Tabel riwayat SKP
  - Informasi pegawai yang ditampilkan

### 2. DistributionChart.jsx
- **Lokasi**: `src/pages/riwayat/DistributionChart.jsx`
- **Fungsi**: Komponen grafik distribusi rating
- **Fitur**:
  - Line chart menggunakan Recharts
  - Statistik cards (total, rata-rata, tertinggi, terendah, terbaru)
  - Bar distribusi kategori rating
  - Insight/analisis performa otomatis

## Data Rating

Rating diambil dari kolom `realisasi` di tabel `skps` yang berbentuk JSON dengan struktur:
```json
{
  "rating": 85,
  // ... properti lainnya
}
```

### Kategori Rating:
- **Sangat Baik**: rating >= 91
- **Baik**: rating >= 76 dan < 91
- **Cukup**: rating >= 61 dan < 76
- **Buruk**: rating >= 51 dan < 61
- **Sangat Buruk**: rating < 51

## Grafik Line Chart

Grafik menampilkan perkembangan rating SKP dari waktu ke waktu dengan:
- **X-Axis**: Label SKP (Tahun - Index)
- **Y-Axis**: Rating (0-100)
- **Custom Tooltip**: Menampilkan detail lengkap (tahun, rating, kategori, aktivitas, tanggal review)
- **Reference Lines**: Threshold untuk setiap kategori rating (ditampilkan dengan garis putus-putus)

## Filter dan Pencarian

### Admin/Superadmin:
- Dapat memilih semua user dengan role `dosen` atau `kepegawaian`
- Pencarian berdasarkan nama lengkap atau NIP/NIDN
- Dropdown dengan informasi lengkap (nama, NIP, role)

### Kepegawaian:
- Dapat memilih dari daftar pegawai yang dinilai (berdasarkan field `raters` di user)
- Pilihan "Diri Sendiri" untuk melihat riwayat pribadi
- Pencarian berdasarkan nama atau NIP

## Navigasi Menu

Menu "Riwayat" atau "Riwayat SKP" ditambahkan di sidebar untuk setiap role:
- **Dosen**: Menu "Riwayat" di bagian utama
- **Kepegawaian**: Menu "Riwayat" sebagai item mandiri
- **Admin**: Menu "Riwayat SKP" di bagian bawah
- **Superadmin**: Menu "Riwayat SKP" di bagian bawah

## Dependencies

- **recharts**: ^3.6.0 (sudah terinstall)
- **lucide-react**: Icon library
- **shadcn/ui**: Komponen UI (Card, Table, Tabs, Select, dll)

## API yang Digunakan

- `api.skps.getByUser(userId)`: Mengambil SKP berdasarkan user ID
- `api.users.getAll()`: Mengambil daftar semua user (untuk admin/kepegawaian)

## Catatan Penting

1. **Penilai adalah Pegawai**: Kepegawaian/Penilai juga mengajukan SKP dan dinilai oleh penilai lain, sehingga mereka memiliki riwayat pribadi dan riwayat dari pegawai yang mereka nilai.

2. **Filter SKP**: Hanya SKP dengan `realisasiStatus === 'approved'` yang ditampilkan di riwayat.

3. **Sorting**: Data diurutkan berdasarkan tahun dan tanggal review untuk menampilkan perkembangan kronologis.

4. **Responsive Design**: UI responsive untuk mobile dan desktop dengan table scrollable.

5. **Performance**: Menggunakan `useMemo` untuk mengoptimalkan perhitungan data grafik dan statistik.
