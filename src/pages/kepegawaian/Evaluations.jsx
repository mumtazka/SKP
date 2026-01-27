import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { DataTable } from '@/components/common/Table';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { toast } from 'sonner';
import {
    ClipboardList,
    Eye,
    Clock,
    CheckCircle,
    FileText,
    User,
    Calendar
} from 'lucide-react';

const Evaluations = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [pendingRealisasi, setPendingRealisasi] = useState([]);
    const [reviewedRealisasi, setReviewedRealisasi] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const allSkps = await api.skps.getAll();
            const allUsers = await api.users.getAll();

            // Filter SKPs to only show those from lecturers assigned to this user
            const myAssignedLecturers = allUsers.filter(u =>
                u.role === 'dosen' &&
                u.raters?.pejabatPenilaiId === user.id
            );
            const myAssignedLecturerIds = myAssignedLecturers.map(l => l.id);

            // Filter to approved SKPs with realisasi status
            const mySkps = allSkps.filter(s => myAssignedLecturerIds.includes(s.userId) && s.status === 'Approved');

            const pending = mySkps.filter(s => s.realisasiStatus === 'Pending');
            const reviewed = mySkps.filter(s => s.realisasiStatus === 'Reviewed');

            setPendingRealisasi(pending);
            setReviewedRealisasi(reviewed);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: "Pegawai",
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                        {row.user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{row.user?.fullName}</div>
                        <div className="text-xs text-gray-500">{row.user?.identityNumber || '-'}</div>
                    </div>
                </div>
            )
        },
        {
            header: "Periode",
            cell: (row) => (
                <span className="font-medium text-gray-700">{row.period}</span>
            )
        },
        {
            header: "Tanggal Kirim",
            cell: (row) => (
                <span className="text-sm text-gray-600">
                    {row.realisasiSubmittedAt
                        ? new Date(row.realisasiSubmittedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        })
                        : '-'
                    }
                </span>
            )
        },
        {
            header: "Status",
            cell: (row) => (
                row.realisasiStatus === 'Pending' ? (
                    <Badge variant="warning">Menunggu Review</Badge>
                ) : (
                    <Badge variant="success">Sudah Direview</Badge>
                )
            )
        },
        {
            header: "Aksi",
            cell: (row) => (
                <Button
                    size="sm"
                    variant={row.realisasiStatus === 'Pending' ? 'gradient' : 'outline'}
                    onClick={() => navigate(`/kepegawaian/review-realisasi/${row.id}`, { state: { returnTo: '/kepegawaian/evaluations' } })}
                    className="flex items-center gap-1.5"
                >
                    <Eye size={14} />
                    {row.realisasiStatus === 'Pending' ? 'Review' : 'Lihat'}
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Penilaian Realisasi</h1>
                    <p className="text-gray-500 mt-1">Review realisasi capaian kinerja pegawai</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-100 p-3 rounded-xl">
                            <Clock size={24} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{pendingRealisasi.length}</p>
                            <p className="text-sm text-gray-500">Menunggu Review</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-100 p-3 rounded-xl">
                            <CheckCircle size={24} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{reviewedRealisasi.length}</p>
                            <p className="text-sm text-gray-500">Sudah Direview</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'pending'
                                ? 'text-primary border-b-2 border-primary bg-purple-50/50'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Clock size={16} />
                        Menunggu Review ({pendingRealisasi.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('reviewed')}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'reviewed'
                                ? 'text-primary border-b-2 border-primary bg-purple-50/50'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <CheckCircle size={16} />
                        Sudah Direview ({reviewedRealisasi.length})
                    </button>
                </div>

                <div className="p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={activeTab === 'pending' ? pendingRealisasi : reviewedRealisasi}
                            pagination={{ page: 1, limit: 10, total: activeTab === 'pending' ? pendingRealisasi.length : reviewedRealisasi.length }}
                            onPageChange={() => { }}
                        />
                    )}

                    {!loading && (activeTab === 'pending' ? pendingRealisasi : reviewedRealisasi).length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <ClipboardList size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="font-medium">
                                {activeTab === 'pending'
                                    ? 'Tidak ada realisasi yang menunggu review'
                                    : 'Belum ada realisasi yang direview'
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Evaluations;
