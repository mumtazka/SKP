import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useEvaluator } from '@/context/EvaluatorContext';
import { usePeriod } from '@/context/PeriodContext';
import EvaluatorSelector from '@/components/common/EvaluatorSelector';
import { Table } from '@/components/common/Table';
import { Button } from '@/components/common/Button';
import { FileText, Search, Filter, Download, Eye, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateSKPFullPDF } from '@/utils/generateSKPFullPDF';

const HistorySKP = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { selectedEvaluatorId } = useEvaluator();
    const { periodConfig } = usePeriod();
    const [skps, setSkps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
    const [downloadingId, setDownloadingId] = useState(null);

    useEffect(() => {
        loadHistory();
    }, [user, selectedEvaluatorId]);

    const loadHistory = async () => {
        if (!user) return;

        const targetEvaluatorId = (user.role === 'admin' || user.role === 'superadmin')
            ? selectedEvaluatorId
            : user.id;

        if ((user.role === 'admin' || user.role === 'superadmin') && !targetEvaluatorId) {
            setSkps([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const allSkps = await api.skps.getAll();
            const allUsers = await api.users.getAll();

            const myAssignedLecturers = allUsers.filter(u =>
                u.role === 'dosen' &&
                u.raters?.pejabatPenilaiId === targetEvaluatorId
            );
            const myAssignedLecturerIds = myAssignedLecturers.map(l => l.id);

            // Filter for Approved SKPs (Final)
            const finalSkps = allSkps.filter(s =>
                s.realisasiStatus === 'Approved' &&
                myAssignedLecturerIds.includes(s.userId)
            );
            setSkps(finalSkps);
        } catch (error) {
            console.error('Failed to load history:', error);
            toast.error('Gagal memuat riwayat SKP');
        } finally {
            setLoading(false);
        }
    };

    const filteredSkps = skps.filter(skp => {
        const matchesSearch = skp.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            skp.user?.identityNumber?.includes(searchTerm);
        const matchesYear = yearFilter ? skp.period === yearFilter : true;
        return matchesSearch && matchesYear;
    });

    const uniqueYears = [...new Set(skps.map(s => s.period))].sort((a, b) => b - a);

    return (
        <div className="space-y-6">
            <EvaluatorSelector className="mb-6" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Riwayat SKP Final</h1>
                    <p className="text-gray-500 mt-1">Daftar SKP yang telah selesai dan disetujui (Final)</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama pegawai atau NIP..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <select
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                        >
                            <option value="">Semua Tahun</option>
                            {uniqueYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pegawai</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Periode</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jabatan</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal Final</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex justify-center mb-2">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                        </div>
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : filteredSkps.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        Tidak ada data SKP final yang ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredSkps.map((skp) => (
                                    <tr key={skp.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {skp.user?.fullName?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{skp.user?.fullName}</div>
                                                    <div className="text-xs text-gray-500">{skp.user?.identityNumber}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {skp.period}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {skp.user?.jabatan || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {skp.realisasiSubmittedAt ? new Date(skp.realisasiSubmittedAt).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-primary hover:text-primary hover:bg-primary/5"
                                                    onClick={() => navigate(`/penilai/review-realisasi/${skp.id}`, { state: { returnTo: '/penilai/history' } })}
                                                >
                                                    <Eye size={16} className="mr-2" />
                                                    Lihat
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={downloadingId === skp.id}
                                                    onClick={async () => {
                                                        setDownloadingId(skp.id);
                                                        try {
                                                            // Fetch official evaluator
                                                            let evaluator = null;
                                                            if (skp.userId) {
                                                                const userDetail = await api.users.getById(skp.userId);
                                                                const raterId = userDetail.raters?.pejabatPenilaiId;
                                                                if (raterId) {
                                                                    evaluator = await api.users.getById(raterId);
                                                                }
                                                            }

                                                            await generateSKPFullPDF(skp, {
                                                                evaluator,
                                                                periodConfig,
                                                                feedback: {},
                                                                perilakuRows: skp.realisasi?.perilaku || []
                                                            });
                                                            toast.success('PDF berhasil diunduh!');
                                                        } catch (error) {
                                                            console.error('PDF generation failed:', error);
                                                            toast.error('Gagal membuat PDF');
                                                        } finally {
                                                            setDownloadingId(null);
                                                        }
                                                    }}
                                                    className="flex items-center gap-1.5"
                                                >
                                                    {downloadingId === skp.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Download size={14} />
                                                    )}
                                                    PDF
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HistorySKP;
