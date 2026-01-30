import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { History, TrendingUp, User, Check, ChevronsUpDown, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import DistributionChart from './DistributionChart';

const RiwayatSKP = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [skpHistory, setSkpHistory] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('history');

    // Load users untuk Admin dan Kepegawaian
    useEffect(() => {
        const loadUsers = async () => {
            try {
                if (user.role === 'admin' || user.role === 'superadmin') {
                    // Admin dapat melihat semua user KECUALI admin
                    const users = await api.users.getAll();
                    const nonAdminUsers = users.filter(u =>
                        u.role !== 'admin' && u.role !== 'superadmin'
                    );
                    setAllUsers(nonAdminUsers);
                } else if (user.role === 'kepegawaian') {
                    // Kepegawaian hanya melihat user yang dia nilai + diri sendiri
                    const users = await api.users.getAll();
                    // Filter users yang dinilai oleh kepegawaian ini (cek raters)
                    const assignedUsers = users.filter(u => {
                        if (u.raters && Array.isArray(u.raters)) {
                            return u.raters.includes(user.id);
                        }
                        return false;
                    });
                    // Tambahkan diri sendiri di awal list
                    setAllUsers([user, ...assignedUsers]);
                }
            } catch (error) {
                console.error('Error loading users:', error);
            }
        };

        loadUsers();
    }, [user]);

    // Load SKP history
    useEffect(() => {
        const loadHistory = async () => {
            setLoading(true);
            try {
                let targetUserId = user.id; // Default: dosen melihat sendiri

                // Admin atau Kepegawaian bisa pilih user lain
                if ((user.role === 'admin' || user.role === 'superadmin' || user.role === 'kepegawaian') && selectedUserId) {
                    targetUserId = selectedUserId;
                }

                const skps = await api.skps.getByUser(targetUserId);

                // Filter hanya SKP yang sudah direview (realisasiStatus approved)
                // Case insensitive check
                const approvedSkps = skps.filter(skp =>
                    skp.realisasiStatus?.toLowerCase() === 'approved' && skp.realisasi
                );

                setSkpHistory(approvedSkps);

                // Set selected user info
                if (targetUserId === user.id) {
                    setSelectedUser(user);
                } else {
                    const userInfo = allUsers.find(u => u.id === targetUserId);
                    setSelectedUser(userInfo);
                }
            } catch (error) {
                console.error('Error loading SKP history:', error);
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, [user, selectedUserId, allUsers]);

    // Format tanggal
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    // Ekstrak rating dari realisasi JSON untuk tampilan Tabel
    const extractRatingForDisplay = (realisasi) => {
        if (!realisasi) return '-';
        try {
            const data = typeof realisasi === 'string' ? JSON.parse(realisasi) : realisasi;
            if (data.rating) return data.rating;
            if (data.predikat) return data.predikat;
            if (data.nilai) return data.nilai;
            return '-';
        } catch (error) {
            return '-';
        }
    };

    const isNumeric = (val) => !isNaN(parseFloat(val)) && isFinite(val);

    // Get rating label (Hanya dipakai jika nilai adalah angka)
    const getRatingLabel = (rating) => {
        if (!isNumeric(rating)) return rating; // Return as is if string

        const num = parseFloat(rating);
        if (num >= 91) return 'Sangat Baik';
        if (num >= 76) return 'Baik';
        if (num >= 61) return 'Cukup';
        if (num >= 51) return 'Buruk';
        return 'Sangat Buruk';
    };

    // Get rating color based on label text or numeric value
    const getRatingColor = (rating) => {
        const r = String(rating).toLowerCase();

        if (r.includes('sangat baik') || (isNumeric(rating) && rating >= 91)) return 'text-green-600';
        if (r.includes('baik') || (isNumeric(rating) && rating >= 76)) return 'text-blue-600';
        if (r.includes('cukup') || (isNumeric(rating) && rating >= 61)) return 'text-yellow-600';
        if (r.includes('buruk') || r.includes('kurang') || (isNumeric(rating) && rating >= 51)) return 'text-orange-600';
        if (r.includes('sangat buruk') || r.includes('sangat kurang')) return 'text-red-600';

        return 'text-gray-500';
    };

    // Render user selector untuk Admin/Kepegawaian dengan Combobox
    const renderUserSelector = () => {
        if (user.role === 'dosen') return null;

        return (
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Pilih Dosen/Pegawai
                    </CardTitle>
                    <CardDescription>
                        {user.role === 'admin' || user.role === 'superadmin'
                            ? 'Pilih user untuk melihat riwayat SKP mereka (hanya yang memiliki SKP)'
                            : 'Pilih pegawai yang Anda nilai atau diri sendiri untuk melihat riwayat SKP'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between"
                            >
                                {selectedUserId ? (
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                            {allUsers.find(u => u.id === selectedUserId)?.fullName}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            ({allUsers.find(u => u.id === selectedUserId)?.identityNumber || '-'})
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">Pilih user...</span>
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Cari nama atau NIP/NIDN..." />
                                <CommandList>
                                    <CommandEmpty>Tidak ada user ditemukan.</CommandEmpty>
                                    <CommandGroup>
                                        {user.role === 'kepegawaian' && (
                                            <CommandItem
                                                key={user.id}
                                                value={`${user.fullName} ${user.identityNumber || ''}`}
                                                onSelect={() => {
                                                    setSelectedUserId(user.id);
                                                    setOpen(false);
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedUserId === user.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">Diri Sendiri - {user.fullName}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {user.identityNumber || '-'} | {user.role}
                                                    </span>
                                                </div>
                                            </CommandItem>
                                        )}
                                        {allUsers
                                            .filter(u => u.id !== user.id) // Exclude current user if already shown
                                            .map((u) => (
                                                <CommandItem
                                                    key={u.id}
                                                    value={`${u.fullName} ${u.identityNumber || ''}`}
                                                    onSelect={() => {
                                                        setSelectedUserId(u.id);
                                                        setOpen(false);
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedUserId === u.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{u.fullName}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {u.identityNumber || '-'} | {u.role}
                                                        </span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <History className="h-8 w-8 text-primary" />
                        Riwayat SKP
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Lihat riwayat dan analisis performa SKP
                    </p>
                </div>
            </div>

            {renderUserSelector()}

            {/* Informasi User yang Ditampilkan */}
            {selectedUser && (
                <Card className="border-l-4 border-l-primary">
                    <CardHeader>
                        <CardTitle className="text-lg">Informasi Pegawai</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Nama Lengkap</p>
                                <p className="font-medium">{selectedUser.fullName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">NIP/NIDN</p>
                                <p className="font-medium">{selectedUser.identityNumber || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Jabatan</p>
                                <p className="font-medium">{selectedUser.jabatan || '-'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs untuk History dan Grafik */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="history">
                        <History className="h-4 w-4 mr-2" />
                        Riwayat SKP
                    </TabsTrigger>
                    <TabsTrigger value="chart">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Grafik Distribusi
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="history" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Daftar Riwayat SKP</CardTitle>
                            <CardDescription>
                                Total: {skpHistory.length} SKP yang sudah dinilai
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">Memuat data...</p>
                                </div>
                            ) : skpHistory.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">
                                        {selectedUserId ? 'User ini belum memiliki SKP yang selesai dinilai.' : 'Belum ada riwayat SKP.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tahun</TableHead>
                                                <TableHead>Kategori</TableHead>
                                                <TableHead>Aktivitas</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Nilai Realisasi</TableHead>
                                                <TableHead>Predikat</TableHead>
                                                <TableHead>Tanggal Review</TableHead>
                                                <TableHead className="text-right">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {skpHistory.map((skp) => {
                                                const rating = extractRatingForDisplay(skp.realisasi);
                                                return (
                                                    <TableRow key={skp.id}>
                                                        <TableCell className="font-medium">{skp.year || skp.period}</TableCell>
                                                        <TableCell>{skp.category || '-'}</TableCell>
                                                        <TableCell className="max-w-xs truncate">
                                                            {skp.activity || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                Selesai
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="font-semibold">{rating}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className={`font-medium ${getRatingColor(rating)}`}>
                                                                {getRatingLabel(rating)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            {formatDate(skp.realisasiReviewedAt)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    // Navigate to review detail
                                                                    window.location.href = `/penilai/review-realisasi/${skp.id}`;
                                                                }}
                                                                className="h-8 w-8 p-0"
                                                                title="Lihat Detail Realisasi"
                                                            >
                                                                <Eye className="h-4 w-4 text-primary" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="chart" className="space-y-4">
                    <DistributionChart skpHistory={skpHistory} userName={selectedUser?.fullName} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default RiwayatSKP;
