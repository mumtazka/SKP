import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useEvaluator } from '@/context/EvaluatorContext';
import EvaluatorSelector from '@/components/common/EvaluatorSelector';
import { api } from '@/services/api';
import StatCard from '@/components/dashboard/StatCard';
import { FileText, CheckSquare, Clock, Users, CheckCircle, XCircle, Eye, MessageSquare, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const KepegawaianDashboard = () => {
    const { user } = useAuth();
    const { selectedEvaluatorId } = useEvaluator();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        pendingApprovals: 0,
        totalEmployees: 0,
        evaluationsDone: 0
    });
    const [pendingSkps, setPendingSkps] = useState([]);
    const [allSkps, setAllSkps] = useState([]); // All SKPs from assigned lecturers
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'all'
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [selectedSkp, setSelectedSkp] = useState(null);

    // Feedback State
    const [feedbackMode, setFeedbackMode] = useState(false);
    const [globalFeedback, setGlobalFeedback] = useState('');
    const [sectionFeedback, setSectionFeedback] = useState({});

    const fetchData = async () => {
        if (!user) return;

        const targetEvaluatorId = (user.role === 'admin' || user.role === 'superadmin')
            ? selectedEvaluatorId
            : user.id;

        if ((user.role === 'admin' || user.role === 'superadmin') && !targetEvaluatorId) {
            setPendingSkps([]);
            setAllSkps([]);
            setStats({
                pendingApprovals: 0,
                totalEmployees: 0,
                evaluationsDone: 0
            });
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const skps = await api.skps.getAll();
            const allUsers = await api.users.getAll();

            // Filter SKPs to only show those from lecturers assigned to this target evaluator
            const myAssignedLecturers = allUsers.filter(u =>
                u.role === 'dosen' &&
                u.raters?.pejabatPenilaiId === targetEvaluatorId
            );
            const myAssignedLecturerIds = myAssignedLecturers.map(l => l.id);

            // Filter to only show SKPs from assigned lecturers
            const mySkps = skps.filter(s => myAssignedLecturerIds.includes(s.userId));
            const pending = mySkps.filter(s => s.status === 'Pending');

            setPendingSkps(pending);
            setAllSkps(mySkps); // Store all SKPs
            setStats({
                pendingApprovals: pending.length,
                totalEmployees: myAssignedLecturers.length,
                evaluationsDone: mySkps.filter(s => s.status === 'Approved').length
            });
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
            toast.error("Gagal memuat data dashboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user.id, selectedEvaluatorId]);

    const handleOpenModal = (skp) => {
        setSelectedSkp(skp);
        setFeedbackMode(false);
        setGlobalFeedback('');
        setSectionFeedback({});
    };

    const handleApprove = async () => {
        if (!selectedSkp) return;
        setProcessingId(selectedSkp.id);
        try {
            await api.skps.update(selectedSkp.id, {
                status: 'Approved',
                approverId: user.id,
                approverName: user.fullName
            });
            toast.success("SKP berhasil disetujui");
            setSelectedSkp(null);
            fetchData();
        } catch (error) {
            toast.error("Gagal menyetujui SKP");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async () => {
        if (!selectedSkp) return;

        // Validation: Require at least one comment
        const hasComments = globalFeedback.trim() || Object.values(sectionFeedback).some(c => c.trim());
        if (!hasComments) {
            toast.error("Mohon berikan catatan/revisi sebelum menolak.");
            return;
        }

        setProcessingId(selectedSkp.id);
        try {
            await api.skps.update(selectedSkp.id, {
                status: 'Rejected',
                approverId: user.id,
                approverName: user.fullName,
                feedback: {
                    global: globalFeedback,
                    sections: sectionFeedback
                }
            });
            toast.success("SKP dikembalikan untuk revisi");
            setSelectedSkp(null);
            fetchData();
        } catch (error) {
            toast.error("Gagal menolak SKP");
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async () => {
        if (!selectedSkp) return;

        if (!window.confirm(`Anda yakin ingin menghapus SKP dari ${selectedSkp.userName}? Dosen akan dapat mengajukan SKP baru.`)) {
            return;
        }

        setProcessingId(selectedSkp.id);
        try {
            await api.skps.delete(selectedSkp.id);
            toast.success("SKP berhasil dihapus. Dosen dapat mengajukan SKP baru.");
            setSelectedSkp(null);
            fetchData();
        } catch (error) {
            toast.error("Gagal menghapus SKP");
        } finally {
            setProcessingId(null);
        }
    };

    // Helper: Render a section of the SKP content with Feedback capabilities
    const renderSection = (title, items, sectionKey) => {
        if (!items || items.length === 0) return null;

        const hasFeedback = !!sectionFeedback[sectionKey];

        return (
            <div className="mb-6 group">
                <div className="flex items-center justify-between mb-3 bg-purple-50 p-2 rounded-r-lg border-l-4 border-primary">
                    <h4 className="font-bold text-gray-800 text-sm uppercase">
                        {title}
                    </h4>
                    <button
                        onClick={() => {
                            if (!feedbackMode) setFeedbackMode(true);
                            // Toggle input visibility logic could be here if we want to hide it
                        }}
                        className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors ${hasFeedback ? 'text-primary bg-purple-100 font-medium' : 'text-gray-400 hover:text-primary hover:bg-white'}`}
                        title="Berikan Catatan"
                    >
                        <MessageSquare size={14} />
                        {hasFeedback ? 'Ada Catatan' : 'Beri Catatan'}
                    </button>
                </div>

                {/* Section Feedback Input */}
                {(feedbackMode || hasFeedback) && (
                    <div className="mb-4 px-4">
                        <textarea
                            value={sectionFeedback[sectionKey] || ''}
                            onChange={(e) => setSectionFeedback(prev => ({ ...prev, [sectionKey]: e.target.value }))}
                            placeholder={`Tuliskan catatan revisi untuk bagian ${title}...`}
                            className="w-full text-sm p-3 border border-yellow-300 bg-yellow-50 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-y min-h-[80px]"
                        />
                    </div>
                )}

                <div className="space-y-3 px-4">
                    {(() => {
                        let mainCounter = 0;
                        return items.map((item, idx) => {
                            const isMainRow = !item.isSubRow;
                            if (isMainRow) mainCounter++;

                            return (
                                <div key={idx} className="flex gap-4 border-b border-gray-100 pb-3 last:border-0 text-sm text-gray-700">
                                    <div className="w-6 font-semibold text-gray-400 shrink-0 select-none pt-1">
                                        {isMainRow ? `${mainCounter}.` : ''}
                                    </div>

                                    {/* Dynamic Grid for Columns */}
                                    <div className={`flex-1 grid gap-4 ${item.columns?.length > 1 ? `grid-cols-${item.columns.length}` : 'grid-cols-1'}`}>
                                        {(item.columns || [item.content]).map((col, cIdx) => (
                                            <div
                                                key={cIdx}
                                                className="prose prose-sm max-w-none prose-purple bg-white p-3 rounded border border-gray-50 shadow-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                                                dangerouslySetInnerHTML={{ __html: col || '<span class="text-gray-400 italic">Kosong</span>' }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        });
                    })()}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 relative">
            <EvaluatorSelector className="mb-6" />

            {/* PREVIEW MODAL */}
            {selectedSkp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Review SKP</h3>
                                <p className="text-sm text-gray-500">
                                    Pengajuan oleh <span className="font-semibold text-primary">{selectedSkp.userName}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedSkp(null)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <XCircle size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500 block text-xs uppercase tracking-wide">Departemen</span>
                                    <span className="font-medium text-gray-900">{selectedSkp.user?.departmentName || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-xs uppercase tracking-wide">Tanggal Pengajuan</span>
                                    <span className="font-medium text-gray-900">
                                        {selectedSkp.createdAt ? new Date(selectedSkp.createdAt).toLocaleDateString('id-ID', { dateStyle: 'full' }) : '-'}
                                    </span>
                                </div>
                            </div>

                            {/* Enable Feedback Mode Toggle */}
                            <div className="flex justify-end mb-4">
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600 select-none">
                                    <input
                                        type="checkbox"
                                        checked={feedbackMode}
                                        onChange={(e) => setFeedbackMode(e.target.checked)}
                                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                    />
                                    Mode Koreksi / Revisi
                                </label>
                            </div>

                            {selectedSkp.details ? (
                                <>
                                    {renderSection('A. UTAMA', selectedSkp.details.utama, 'utama')}
                                    {renderSection('B. TAMBAHAN', selectedSkp.details.tambahan, 'tambahan')}
                                    {renderSection('DUKUNGAN SUMBER DAYA', selectedSkp.details.dukungan, 'dukungan')}
                                    {renderSection('SKEMA PERTANGGUNGJAWABAN', selectedSkp.details.skema, 'skema')}
                                    {renderSection('KONSEKUENSI', selectedSkp.details.konsekuensi, 'konsekuensi')}
                                </>
                            ) : (
                                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg dashed border-2 border-gray-200">
                                    <span className="block mb-2 text-2xl">⚠️</span>
                                    Format data tidak kompatibel atau kosong.
                                </div>
                            )}

                            {/* Global Feedback Section */}
                            {(feedbackMode || globalFeedback) && (
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <div className="flex items-center gap-2 mb-3 text-gray-800">
                                        <MessageSquare size={18} className="text-yellow-500" />
                                        <h4 className="font-bold text-sm uppercase">Catatan Umum / Kesimpulan</h4>
                                    </div>
                                    <textarea
                                        value={globalFeedback}
                                        onChange={(e) => setGlobalFeedback(e.target.value)}
                                        placeholder="Tuliskan catatan umum untuk seluruh dokumen SKP ini..."
                                        className="w-full text-sm p-4 border border-yellow-300 bg-yellow-50 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-y min-h-[100px]"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-between bg-white hover:bg-gray-50 transition-colors shrink-0 z-10 rounded-b-xl">
                            {/* Left side - Delete button */}
                            <button
                                onClick={handleDelete}
                                disabled={processingId === selectedSkp.id}
                                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 border border-red-200"
                                title="Hapus SKP ini agar dosen dapat mengajukan ulang"
                            >
                                <Trash2 size={16} />
                                Hapus SKP
                            </button>

                            {/* Right side - Action buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedSkp(null)}
                                    className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Batal
                                </button>

                                {selectedSkp.status === 'Pending' && (
                                    <>
                                        <button
                                            onClick={handleReject}
                                            disabled={processingId === selectedSkp.id}
                                            className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${feedbackMode ? 'bg-red-500 hover:bg-red-600 text-white shadow-md' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                        >
                                            {processingId === selectedSkp.id && processingId.includes('reject') ? 'Memproses...' : (
                                                <>
                                                    <AlertCircle size={16} />
                                                    Tolak & Minta Revisi
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={handleApprove}
                                            disabled={processingId === selectedSkp.id || feedbackMode}
                                            className={`px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 transform active:scale-95 ${feedbackMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {processingId === selectedSkp.id && !processingId.includes('reject') ? 'Memproses...' : (
                                                <>
                                                    <CheckCircle size={16} />
                                                    Setujui & Validasi
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}

                                {selectedSkp.status === 'Approved' && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleReject}
                                            disabled={processingId === selectedSkp.id}
                                            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 border border-red-200"
                                            title="Batalkan persetujuan dan tolak"
                                        >
                                            <AlertCircle size={16} />
                                            Batalkan & Tolak
                                        </button>
                                        <span className="px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg flex items-center gap-2">
                                            <CheckCircle size={16} />
                                            Sudah Disetujui
                                        </span>
                                    </div>
                                )}

                                {selectedSkp.status === 'Rejected' && (
                                    <span className="px-4 py-2 text-sm font-medium text-yellow-600 bg-yellow-50 rounded-lg flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        Menunggu Revisi
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Penilai</h1>
                <p className="text-gray-500">Welcome back, {user.fullName}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Perlu Persetujuan"
                    value={stats.pendingApprovals}
                    icon={Clock}
                    color="warning"
                    description="Submission menunggu review"
                />
                <StatCard
                    title="Sudah Dinilai"
                    value={stats.evaluationsDone}
                    icon={CheckSquare}
                    color="success"
                    description="SKP yang telah disetujui"
                />
                <StatCard
                    title="Total Pegawai"
                    value={stats.totalEmployees}
                    icon={Users}
                    color="info"
                    description="Pegawai aktif"
                />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Tab Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === 'pending'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Antrian Persetujuan
                            {pendingSkps.length > 0 && (
                                <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {pendingSkps.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === 'all'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Semua SKP
                            <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                {allSkps.length}
                            </span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading data...</div>
                ) : (activeTab === 'pending' ? pendingSkps : allSkps).length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <CheckCircle className="text-gray-300" size={24} />
                        </div>
                        <p className="text-gray-900 font-medium">
                            {activeTab === 'pending' ? 'Semua beres!' : 'Belum ada SKP'}
                        </p>
                        <p className="text-gray-500 text-sm">
                            {activeTab === 'pending'
                                ? 'Tidak ada pengajuan SKP yang perlu disetujui saat ini.'
                                : 'Belum ada SKP yang diajukan oleh dosen yang Anda supervisi.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Pegawai</th>
                                    <th className="px-6 py-3">Departemen</th>
                                    <th className="px-6 py-3">Periode</th>
                                    <th className="px-6 py-3">Tanggal Pengajuan</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(activeTab === 'pending' ? pendingSkps : allSkps).map(skp => (
                                    <tr key={skp.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                                                    {skp.userName ? skp.userName.charAt(0) : 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{skp.userName || 'Unknown User'}</p>
                                                    <p className="text-xs text-gray-500">NIP: {skp.user?.identityNumber || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {skp.user?.departmentName || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">
                                            {skp.period || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(skp.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            {skp.status === 'Pending' && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    Pending Review
                                                </span>
                                            )}
                                            {skp.status === 'Approved' && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                    Disetujui
                                                </span>
                                            )}
                                            {skp.status === 'Rejected' && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    Ditolak
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/penilai/approval/${skp.id}`, { state: { returnTo: '/penilai/dashboard' } })}
                                                    className="p-2 text-gray-400 hover:text-primary hover:bg-purple-50 rounded-lg transition-colors group relative"
                                                    title="Lihat Detail"
                                                >
                                                    <Eye size={16} />
                                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                        Lihat Detail
                                                    </span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KepegawaianDashboard;
