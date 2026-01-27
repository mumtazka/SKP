import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Send, Save, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';
import SKPHeader from './components/SKPHeader';
import SKPSection from './components/SKPSection';
import Toolbar from './components/Toolbar';
import { useSkpDraft } from '@/hooks/useSkpDraft';
import { Button } from '@/components/common/Button';

// UI Helper for the purple headers
const SectionHeader = ({ title }) => (
    <div className="bg-primary text-white font-bold py-2.5 px-4 rounded-t-md shadow-sm text-sm tracking-wide uppercase mt-8 mb-0">
        {title}
    </div>
);

const INITIAL_FORM_STATE = {
    utama: [
        { id: 1, columns: ['<p>Tuliskan rencana kinerja utama anda disini...</p>'] }
    ],
    tambahan: [
        { id: 1, columns: [''] }
    ],
    dukungan: [
        { id: 1, columns: [''] }
    ],
    skema: [
        { id: 1, columns: [''] }
    ],
    konsekuensi: [
        { id: 1, columns: [''] }
    ]
};

// Simple Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, isSubmitting }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 animate-in zoom-in-95 duration-200">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Konfirmasi Pengajuan</h3>
                    <p className="text-gray-500 mt-2 text-sm">
                        Apakah anda yakin ingin mengajukan SKP ini? <br />
                        Setelah diajukan, data akan dikirim ke pejabat penilai untuk divalidasi.
                    </p>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                        {isSubmitting ? 'Mengirim...' : 'Ya, Ajukan SKP'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const SubmitSKP = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [evaluator, setEvaluator] = useState(null);
    const [activeEditor, setActiveEditor] = useState(null);
    const [portalTarget, setPortalTarget] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [existingSkpId, setExistingSkpId] = useState(null);
    const [skpStatus, setSkpStatus] = useState(null); // Track the current SKP status
    const [isReadOnly, setIsReadOnly] = useState(false); // Prevent editing when approved/pending
    const [currentYearSkp, setCurrentYearSkp] = useState(null); // Track current year's SKP

    // UI State
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentYear = new Date().getFullYear().toString();

    useEffect(() => {
        setPortalTarget(document.getElementById('navbar-action-area'));
    }, []);

    // Auto-save hook
    const {
        data,
        updateSection,
        isSaving,
        lastSaved,
        clearDraft,
        setData // Need this to load existing data
    } = useSkpDraft(INITIAL_FORM_STATE);

    useEffect(() => {
        const loadExistingSkp = async () => {
            if (!user) return;
            try {
                const skps = await api.skps.getByUser(user.id);

                // Find SKP for the current year
                const currentYearSkpEntry = skps.find(s => s.period === currentYear);

                if (currentYearSkpEntry) {
                    setCurrentYearSkp(currentYearSkpEntry);
                    setExistingSkpId(currentYearSkpEntry.id);
                    setSkpStatus(currentYearSkpEntry.status);

                    if (currentYearSkpEntry.status === 'Approved') {
                        // SKP is approved - read-only mode
                        setIsReadOnly(true);
                        if (currentYearSkpEntry.details) {
                            setData(currentYearSkpEntry.details);
                        }
                        toast.success("SKP tahun ini sudah disetujui. Anda hanya dapat melihat.");
                    } else if (currentYearSkpEntry.status === 'Rejected') {
                        // SKP is rejected - allow editing for revision
                        setIsReadOnly(false);
                        setFeedback(currentYearSkpEntry.feedback);
                        if (currentYearSkpEntry.details) {
                            setData(currentYearSkpEntry.details);
                        }
                        toast.warning("SKP Anda dikembalikan untuk revisi. Silakan cek catatan.");
                    } else if (currentYearSkpEntry.status === 'Pending') {
                        // SKP is pending - read-only mode
                        setIsReadOnly(true);
                        if (currentYearSkpEntry.details) {
                            setData(currentYearSkpEntry.details);
                        }
                        toast.info("SKP sedang dalam proses review. Tidak dapat diedit.");
                    }
                } else {
                    // No SKP for current year - allow new submission
                    setIsReadOnly(false);
                    setSkpStatus(null);
                }
            } catch (e) {
                console.error("Failed to load existing SKP", e);
            }
        };
        loadExistingSkp();
    }, [user, currentYear]); // Run once when user loads

    useEffect(() => {
        const fetchEvaluator = async () => {
            if (!user) return;

            try {
                console.log("=== [SubmitSKP] FETCHING EVALUATOR DATA ===");
                console.log(`[SubmitSKP] User ID: ${user.id}`);
                console.log(`[SubmitSKP] User object:`, user);

                // 1. Get fresh user data directly from storage/API to bypass stale session
                const freshUser = await api.users.getById(user.id);
                console.log("[SubmitSKP] Fresh user data:", freshUser);
                console.log("[SubmitSKP] Fresh user raters field:", freshUser.raters);

                if (freshUser.raters?.pejabatPenilaiId) {
                    console.log(`[SubmitSKP] ✓ Found Rater ID: ${freshUser.raters.pejabatPenilaiId}`);

                    // 2. If assigned, fetch the rater details
                    console.log(`[SubmitSKP] Fetching rater details for ID: ${freshUser.raters.pejabatPenilaiId}`);
                    const rater = await api.users.getById(freshUser.raters.pejabatPenilaiId);
                    console.log("[SubmitSKP] Rater details fetched:", rater);

                    const evaluatorData = {
                        id: rater.id,
                        fullName: rater.fullName,
                        identityNumber: rater.identityNumber || '-',
                        pangkat: rater.pangkat || '-',
                        jabatan: rater.jabatan || 'Pejabat Penilai',
                        unit: rater.departmentName || 'Universitas Negeri Yogyakarta'
                    };

                    console.log("[SubmitSKP] Setting evaluator data:", evaluatorData);
                    setEvaluator(evaluatorData);
                    toast.success(`Penilai ditemukan: ${rater.fullName}`);
                } else {
                    console.warn("[SubmitSKP] ✗ No rater assigned!");
                    console.warn("[SubmitSKP] Raters field is:", freshUser.raters);
                    // Default is blank/null if not set
                    setEvaluator(null);
                    toast.warning("No rater assigned for this user.");
                }

                console.log("=== [SubmitSKP] EVALUATOR FETCH COMPLETE ===");
            } catch (error) {
                console.error("=== [SubmitSKP] EVALUATOR FETCH ERROR ===");
                console.error("[SubmitSKP] Error:", error);
                setEvaluator(null);
                toast.error(`Failed to fetch rater: ${error.message}`);
            }
        };

        fetchEvaluator();

        // Add focus listener to refresh data when user switches tabs/windows
        const onFocus = () => {
            console.log("[SubmitSKP] Window focused, refreshing evaluator data...");
            fetchEvaluator();
        };

        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [user]);

    const handleConfirmSubmit = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const payload = {
                userId: user.id,
                userName: user.fullName,
                details: data,
                evaluatorId: evaluator?.id || 'mock-evaluator',
                period: new Date().getFullYear().toString(),
                status: 'Pending' // Reset to Pending on re-submit
            };

            if (existingSkpId) {
                // Update existing
                await api.skps.update(existingSkpId, payload);
            } else {
                // Create new
                await api.skps.create(payload);
            }

            clearDraft();
            setShowConfirm(false);
            toast.success("SKP berhasil diajukan! Menunggu verifikasi.");
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Gagal mengajukan SKP");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-5xl mx-auto pb-24 relative">
            <ConfirmationModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleConfirmSubmit}
                isSubmitting={isSubmitting}
            />

            {/* PORTAL TOOLBAR */}
            {portalTarget && createPortal(
                <div className="w-full flex justify-center animate-in fade-in zoom-in duration-300">
                    <div className="max-w-2xl w-full">
                        <Toolbar editor={activeEditor} />
                    </div>
                </div>,
                portalTarget
            )}

            {/* Page Title & Status */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Perencanaan Kinerja</h1>
                    <p className="text-gray-500">
                        Isi rencana hasil kerja dan lampiran kinerja pegawai
                        <span className="ml-2 text-sm font-medium text-primary">• Periode {currentYear}</span>
                    </p>
                </div>

                <div className="text-xs text-gray-400 font-medium flex items-center gap-2">
                    {!isReadOnly && (
                        isSaving ? (
                            <span className="animate-pulse text-primary">Saving draft...</span>
                        ) : lastSaved ? (
                            <span className="flex items-center gap-1 text-primary">
                                <Save size={12} />
                                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        ) : (
                            <span>Draft will auto-save</span>
                        )
                    )}
                </div>
            </div>

            {/* APPROVED NOTICE */}
            {skpStatus === 'Approved' && (
                <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex gap-4 animate-in slide-in-from-top-4 shadow-sm">
                    <div className="bg-emerald-100 p-2 rounded-full h-fit shrink-0">
                        <CheckCircle className="text-emerald-600" size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-emerald-800 text-lg mb-2">SKP Telah Disetujui</h3>
                        <p className="text-emerald-700 leading-relaxed">
                            SKP untuk periode tahun {currentYear} sudah disetujui oleh pejabat penilai.
                            SKP tidak dapat diedit lagi untuk tahun ini.
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600 font-medium bg-emerald-100/50 w-fit px-3 py-1.5 rounded-lg">
                            <Info size={14} />
                            Hubungi staff jika Anda perlu mengajukan ulang.
                        </div>
                    </div>
                </div>
            )}

            {/* PENDING NOTICE */}
            {skpStatus === 'Pending' && (
                <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6 flex gap-4 animate-in slide-in-from-top-4 shadow-sm">
                    <div className="bg-amber-100 p-2 rounded-full h-fit shrink-0">
                        <Clock className="text-amber-600" size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-amber-800 text-lg mb-2">Menunggu Persetujuan</h3>
                        <p className="text-amber-700 leading-relaxed">
                            SKP untuk periode tahun {currentYear} sedang dalam proses review oleh pejabat penilai.
                            Silakan tunggu hasil evaluasi.
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 font-medium bg-amber-100/50 w-fit px-3 py-1.5 rounded-lg">
                            <Info size={14} />
                            SKP tidak dapat diedit selama dalam proses review.
                        </div>
                    </div>
                </div>
            )}

            {/* REJECTION NOTICE */}
            {feedback && feedback.global && (
                <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6 flex gap-4 animate-in slide-in-from-top-4 shadow-sm">
                    <div className="bg-red-100 p-2 rounded-full h-fit shrink-0">
                        <AlertTriangle className="text-red-600" size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-800 text-lg mb-2">Perlu Revisi</h3>
                        <p className="text-red-700 leading-relaxed">
                            {feedback.global}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-sm text-red-600 font-medium bg-red-100/50 w-fit px-3 py-1.5 rounded-lg">
                            <Info size={14} />
                            Silakan perbaiki poin-poin yang diminta di bawah ini.
                        </div>
                    </div>
                </div>
            )}

            {/* Top Info Card */}
            <SKPHeader employee={user} evaluator={evaluator} />

            {/* SECTION 1: HASIL KERJA */}
            <SectionHeader title="Hasil Kerja" />

            <SKPSection
                title="A. UTAMA"
                rows={data.utama}
                onChange={(newRows) => updateSection('utama', () => newRows)}
                onEditorFocus={setActiveEditor}
                feedback={feedback?.sections?.utama}
                readOnly={isReadOnly}
            />

            <SKPSection
                title="B. TAMBAHAN"
                rows={data.tambahan}
                onChange={(newRows) => updateSection('tambahan', () => newRows)}
                onEditorFocus={setActiveEditor}
                feedback={feedback?.sections?.tambahan}
                readOnly={isReadOnly}
            />

            {/* SECTION 2: LAMPIRAN */}
            <SectionHeader title="Lampiran" />

            <SKPSection
                title="DUKUNGAN SUMBER DAYA"
                rows={data.dukungan}
                onChange={(newRows) => updateSection('dukungan', () => newRows)}
                onEditorFocus={setActiveEditor}
                feedback={feedback?.sections?.dukungan}
                readOnly={isReadOnly}
            />

            <SKPSection
                title="SKEMA PERTANGGUNGJAWABAN"
                rows={data.skema}
                onChange={(newRows) => updateSection('skema', () => newRows)}
                onEditorFocus={setActiveEditor}
                feedback={feedback?.sections?.skema}
                readOnly={isReadOnly}
            />

            <SKPSection
                title="KONSEKUENSI"
                rows={data.konsekuensi}
                onChange={(newRows) => updateSection('konsekuensi', () => newRows)}
                onEditorFocus={setActiveEditor}
                feedback={feedback?.sections?.konsekuensi}
                readOnly={isReadOnly}
            />

            {/* Floating Submit Button - Only show when not read-only */}
            {!isReadOnly && (
                <div className="fixed bottom-6 right-6 z-50">
                    <Button
                        onClick={() => setShowConfirm(true)}
                        variant="gradient"
                        className="shadow-xl shadow-purple-500/30 px-8 py-4 rounded-full text-base font-bold flex items-center gap-2 transform hover:scale-105 transition-all"
                    >
                        <Send size={18} />
                        {existingSkpId && skpStatus === 'Rejected' ? 'Kirim Revisi SKP' : 'Ajukan SKP'}
                    </Button>
                </div>
            )}
        </div>
    );
};


export default SubmitSKP;
