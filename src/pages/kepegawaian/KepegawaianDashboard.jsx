import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import StatCard from '@/components/dashboard/StatCard';
import { FileText, CheckSquare, Clock, Users, CheckCircle, XCircle, Eye, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const KepegawaianDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        pendingApprovals: 0,
        totalEmployees: 0,
        evaluationsDone: 0
    });
    const [pendingSkps, setPendingSkps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [selectedSkp, setSelectedSkp] = useState(null);

    // Feedback State
    const [feedbackMode, setFeedbackMode] = useState(false);
    const [globalFeedback, setGlobalFeedback] = useState('');
    const [sectionFeedback, setSectionFeedback] = useState({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const skps = await api.skps.getAll();
            const pending = skps.filter(s => s.status === 'Pending' || s.status === 'Rejected'); // Show Rejected too? Maybe not, usually they go back to user. Show Pending.

            setPendingSkps(pending.filter(s => s.status === 'Pending'));
            setStats({
                pendingApprovals: pending.length,
                totalEmployees: 30, // Mock
                evaluationsDone: skps.filter(s => s.status === 'Approved').length
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
    }, [user.id]);

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
                    {items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 border-b border-gray-100 pb-3 last:border-0 text-sm text-gray-700">
                            <div className="w-6 font-semibold text-gray-400 shrink-0 select-none pt-1">{idx + 1}.</div>

                            {/* Dynamic Grid for Columns */}
                            <div className={`flex-1 grid gap-4 ${item.columns?.length > 1 ? `grid-cols-${item.columns.length}` : 'grid-cols-1'}`}>
                                {(item.columns || [item.content]).map((col, cIdx) => (
                                    <div
                                        key={cIdx}
                                        className="prose prose-sm max-w-none prose-purple bg-white p-3 rounded border border-gray-50 shadow-sm"
                                        dangerouslySetInnerHTML={{ __html: col || '<span class="text-gray-400 italic">Kosong</span>' }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 relative">
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
                                    <span className="text-gray-500 block text-xs uppercase tracking-wide">Unit Kerja</span>
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
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white hover:bg-gray-50 transition-colors shrink-0 z-10 rounded-b-xl">
                            <button
                                onClick={() => setSelectedSkp(null)}
                                className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Batal
                            </button>

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
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Kepegawaian</h1>
                <p className="text-gray-500">Overview of SKP submissions and evaluations</p>
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
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Antrian Persetujuan SKP</h2>
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        {pendingSkps.length} Pending
                    </span>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading data...</div>
                ) : pendingSkps.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <CheckCircle className="text-gray-300" size={24} />
                        </div>
                        <p className="text-gray-900 font-medium">Semua beres!</p>
                        <p className="text-gray-500 text-sm">Tidak ada pengajuan SKP yang perlu disetujui saat ini.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Pegawai</th>
                                    <th className="px-6 py-3">Unit Kerja</th>
                                    <th className="px-6 py-3">Tanggal Pengajuan</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pendingSkps.map(skp => (
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
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(skp.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                Pending Review
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(skp)}
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
