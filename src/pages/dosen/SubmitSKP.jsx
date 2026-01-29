import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import useHistory from '@/hooks/useHistory';

// ... (SectionHeader component remains the same)
const SectionHeader = ({ title }) => (
    <div className="bg-primary text-white font-bold py-2.5 px-4 rounded-t-md shadow-sm text-sm tracking-wide uppercase mt-8 mb-0">
        {title}
    </div>
);

// ... (INITIAL_FORM_STATE remains the same)
const INITIAL_FORM_STATE = {
    utama: [
        { id: 1, columns: [''], isSubRow: false },
        { id: 2, columns: [''], isSubRow: true, parentId: 1 }
    ],
    tambahan: [
        { id: 1, columns: [''], isSubRow: false },
        { id: 2, columns: [''], isSubRow: true, parentId: 1 }
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

// ... (ConfirmationModal component remains the same)
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
    const [activeEditor, setActiveEditor] = useState(null); // Keep for backwards compat if needed, or focused single
    const [selectedEditors, setSelectedEditors] = useState([]); // Array of selected Tiptap instances
    const [activeSection, setActiveSection] = useState(null); // 'utama', 'tambahan', etc.

    const [portalTarget, setPortalTarget] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [existingSkpId, setExistingSkpId] = useState(null);
    const [skpStatus, setSkpStatus] = useState(null); // Track the current SKP status
    const [isReadOnly, setIsReadOnly] = useState(false); // Prevent editing when approved/pending
    const [currentYearSkp, setCurrentYearSkp] = useState(null); // Track current year's SKP

    const [selectionRange, setSelectionRange] = useState(null);

    // UI State
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentYear = new Date().getFullYear().toString();

    useEffect(() => {
        setPortalTarget(document.getElementById('navbar-action-area'));
    }, []);

    // Auto-save hook
    const {
        data: draftData, // Rename to specific source
        isSaving,
        lastSaved,
        clearDraft,
        setData: setDraftData // Rename to specific setter
    } = useSkpDraft(INITIAL_FORM_STATE);

    // History Hook - The Master State for Editing
    const {
        state: historyState,
        pushState,
        undo,
        redo,
        canUndo,
        canRedo,
        reset: resetHistory
    } = useHistory(INITIAL_FORM_STATE);

    // Track initialization to prevent re-resetting history on every draft load
    const historyInitialized = useRef(false);
    const saveTimeoutRef = useRef(null);

    // Migration Helper
    const migrateRows = (rows) => {
        if (!rows || rows.length === 0) return [];
        // Check if migration is needed (if any row is missing isSubRow property)
        const needsMigration = rows.some(r => r.isSubRow === undefined);
        if (!needsMigration) return rows;

        return rows.map((row, index) => {
            const isEven = index % 2 === 0;
            if (isEven) {
                return { ...row, isSubRow: false, parentId: undefined };
            } else {
                // Link to the previous row (which is a main row)
                const parentId = rows[index - 1]?.id;
                return { ...row, isSubRow: true, parentId: parentId };
            }
        });
    };

    // Derived state for rendering: Use history if available, otherwise draft or initial
    // Apply migration to ensure legacy data fits new structure
    const rawData = historyState || draftData;
    const data = React.useMemo(() => {
        if (!rawData) return rawData;
        return {
            ...rawData,
            utama: migrateRows(rawData.utama),
            tambahan: migrateRows(rawData.tambahan)
        };
    }, [rawData]);

    // Explicit Action Handler: Updates history AND drafts
    // This is the ONLY way data should be updated during editing
    const handleDataUpdate = (newData, isTextUpdate = false) => {
        setDraftData(newData); // Persist to local storage immediately for auto-save

        if (isTextUpdate) {
            // Delay history push for text updates
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
                pushState(newData);
            }, 300); // 300ms debounce for typing (more responsive)
        } else {
            // Immediate push for structure changes (buttons)
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            pushState(newData);
        }
    };

    // Helper functions for section updates
    const updateSection = (sectionKey, updateFn) => {
        if (!data) return; // Should catch this case
        // This is legacy signature without isTextUpdate flag
        // We might not use this directly anymore if we use updateSectionWithType
        // But SKPSection expects simple callback wrapper usually.
        // Wait, we updated SKPSection to call onChange(next, true).
        // The render calls: onChange={(newRows, isTextUpdate) => updateSectionWithType('utama', newRows, isTextUpdate)}
    };

    const updateSectionWithType = (sectionKey, newRows, isTextUpdate) => {
        if (!data) return;
        const newData = {
            ...data,
            [sectionKey]: newRows
        };
        handleDataUpdate(newData, isTextUpdate);
    };

    // Undo/Redo Handlers
    const handleUndo = () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        if (canUndo) {
            undo();
        }
    };

    const handleRedo = () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        if (canRedo) {
            redo();
        }
    };

    // Sync History State back to Draft Storage (Local Storage)
    // This ensures that when we Undo/Redo, the "restored" state is also saved
    useEffect(() => {
        if (historyState) {
            setDraftData(historyState);
        }
    }, [historyState, setDraftData]);

    // Initial Load: Load Draft into History ONCE
    useEffect(() => {
        const loadExistingSkp = async () => {
            if (!user) return;
            try {
                if (draftData && !historyInitialized.current) {
                    const isInitial = JSON.stringify(draftData) === JSON.stringify(INITIAL_FORM_STATE);
                    if (!isInitial) {
                        resetHistory(draftData);
                    }
                    historyInitialized.current = true;
                }

                const skps = await api.skps.getByUser(user.id);
                const currentYearSkpEntry = skps.find(s => s.period === currentYear);

                if (currentYearSkpEntry) {
                    setCurrentYearSkp(currentYearSkpEntry);
                    setExistingSkpId(currentYearSkpEntry.id);
                    setSkpStatus(currentYearSkpEntry.status);

                    if (currentYearSkpEntry.status === 'Approved') {
                        setIsReadOnly(true);
                        if (currentYearSkpEntry.details) {
                            // Migrate loaded data
                            const migratedDetails = {
                                ...currentYearSkpEntry.details,
                                utama: migrateRows(currentYearSkpEntry.details?.utama),
                                tambahan: migrateRows(currentYearSkpEntry.details?.tambahan)
                            };
                            setDraftData(migratedDetails);
                            resetHistory(migratedDetails);
                            historyInitialized.current = true;
                        }
                        toast.success("SKP tahun ini sudah disetujui. Anda hanya dapat melihat.");
                    } else if (currentYearSkpEntry.status === 'Rejected') {
                        setIsReadOnly(false);
                        setFeedback(currentYearSkpEntry.feedback);
                        if (currentYearSkpEntry.details) {
                            // Migrate loaded data
                            const migratedDetails = {
                                ...currentYearSkpEntry.details,
                                utama: migrateRows(currentYearSkpEntry.details?.utama),
                                tambahan: migrateRows(currentYearSkpEntry.details?.tambahan)
                            };
                            setDraftData(migratedDetails);
                            resetHistory(migratedDetails);
                            historyInitialized.current = true;
                        }
                        toast.warning("SKP Anda dikembalikan untuk revisi. Silakan cek catatan.");
                    } else if (currentYearSkpEntry.status === 'Pending') {
                        setIsReadOnly(true);
                        if (currentYearSkpEntry.details) {
                            // Migrate loaded data
                            const migratedDetails = {
                                ...currentYearSkpEntry.details,
                                utama: migrateRows(currentYearSkpEntry.details?.utama),
                                tambahan: migrateRows(currentYearSkpEntry.details?.tambahan)
                            };
                            setDraftData(migratedDetails);
                            resetHistory(migratedDetails);
                            historyInitialized.current = true;
                        }
                        toast.info("SKP sedang dalam proses review. Tidak dapat diedit.");
                    }
                } else {
                    setIsReadOnly(false);
                    setSkpStatus(null);
                }

            } catch (e) {
                console.error(e);
            }
        };
        loadExistingSkp();

        if (draftData && !historyInitialized.current) {
            const isInitial = JSON.stringify(draftData) === JSON.stringify(INITIAL_FORM_STATE);
            if (!isInitial) {
                resetHistory(draftData);
            }
            historyInitialized.current = true;
        }
    }, [user, currentYear]);

    useEffect(() => {
        const fetchEvaluator = async () => {
            if (!user) return;

            try {
                const freshUser = await api.users.getById(user.id);

                if (freshUser.raters?.pejabatPenilaiId) {
                    const evaluatorData = await api.users.getById(freshUser.raters.pejabatPenilaiId);
                    setEvaluator(evaluatorData);
                }
            } catch (error) {
                console.error("Failed to fetch evaluator:", error);
            }
        };

        fetchEvaluator();
    }, [user]);

    const handleConfirmSubmit = async () => {
        if (!user || isReadOnly) return;

        setIsSubmitting(true);
        try {
            const payload = {
                userId: user.id,
                period: currentYear,
                details: data,
                status: 'Pending'
            };

            if (existingSkpId) {
                await api.skps.update(existingSkpId, payload);
                toast.success("SKP berhasil diperbarui dan diajukan kembali!");
            } else {
                await api.skps.create(payload);
                toast.success("SKP berhasil diajukan!");
            }

            setSkpStatus('Pending');
            setIsReadOnly(true);
            setShowConfirm(false);
        } catch (error) {
            console.error("Submit Error:", error);
            toast.error("Gagal mengajukan SKP. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const performMerge = (start, end) => {
        if (!activeSection) return;

        let minR = Math.min(start.r, end.r);
        let maxR = Math.max(start.r, end.r);
        let minC = Math.min(start.c, end.c);
        let maxC = Math.max(start.c, end.c);

        const currentRows = data[activeSection];
        const newRows = [...currentRows]; // Shallow copy array

        const rowSpan = maxR - minR + 1;
        const colSpan = maxC - minC + 1;

        // Deep clone row at minR to avoid mutating state directly
        newRows[minR] = { ...newRows[minR] };

        // Update spans for top-left cell
        newRows[minR] = {
            ...newRows[minR],
            colSpans: { ...(newRows[minR].colSpans || {}), [minC]: colSpan },
            rowSpans: { ...(newRows[minR].rowSpans || {}), [minC]: rowSpan }
        };

        // Mark others as hidden
        for (let r = minR; r <= maxR; r++) {
            if (r !== minR) newRows[r] = { ...newRows[r] };

            let currentHiddens = [...(newRows[r].colHiddens || [])];
            for (let c = minC; c <= maxC; c++) {
                if (r === minR && c === minC) continue;
                if (!currentHiddens.includes(c)) currentHiddens.push(c);
            }
            newRows[r].colHiddens = currentHiddens;
        }

        updateSectionWithType(activeSection, newRows, false); // Structure update (not text)
    };

    const onMergeClick = () => {
        if (selectionRange) {
            performMerge(selectionRange.start, selectionRange.end);
        }
    };

    const onUnmergeClick = () => {
        if (!activeSection || !selectionRange) return;

        const { start, end } = selectionRange;
        const minR = Math.min(start.r, end.r);
        const maxR = Math.max(start.r, end.r);
        const minC = Math.min(start.c, end.c);
        const maxC = Math.max(start.c, end.c);

        const currentRows = data[activeSection];
        const newRows = [...currentRows];

        for (let r = minR; r <= maxR; r++) {
            newRows[r] = { ...newRows[r] };

            // 1. Unhide columns in this range
            // We remove any column index that falls within [minC, maxC] from colHiddens
            if (newRows[r].colHiddens) {
                newRows[r].colHiddens = newRows[r].colHiddens.filter(c => c < minC || c > maxC);
            }

            // 2. Clear spans STARTING in this range
            if (newRows[r].colSpans) {
                const newColSpans = { ...newRows[r].colSpans };
                let changed = false;
                for (let c = minC; c <= maxC; c++) {
                    if (newColSpans[c]) {
                        delete newColSpans[c];
                        changed = true;
                    }
                }
                if (changed) newRows[r].colSpans = newColSpans;
            }
            if (newRows[r].rowSpans) {
                const newRowSpans = { ...newRows[r].rowSpans };
                let changed = false;
                for (let c = minC; c <= maxC; c++) {
                    if (newRowSpans[c]) {
                        delete newRowSpans[c];
                        changed = true;
                    }
                }
                if (changed) newRows[r].rowSpans = newRowSpans;
            }
        }

        updateSectionWithType(activeSection, newRows, false); // Structure update
    };


    return (
        <div className="max-w-7xl mx-auto pb-20">
            {/* Top Bar with Auto-save indicator */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Formulir Rencana SKP</h1>
                    <p className="text-gray-500 text-sm mt-1">Periode Tahun {currentYear}</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 bg-white/50 px-4 py-2 rounded-full border border-gray-100 shadow-sm backdrop-blur-sm">
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
                        <h3 className="font-semibold text-emerald-900 text-lg">SKP Telah Disetujui</h3>
                        <p className="text-emerald-700 mt-1 leading-relaxed">
                            Rencana SKP Anda untuk tahun {currentYear} telah disetujui oleh pejabat penilai.
                            Dokumen ini sekarang bersifat final dan tidak dapat diubah kembali.
                        </p>
                    </div>
                </div>
            )}

            {/* REVISION NOTICE */}
            {skpStatus === 'Rejected' && feedback && (
                <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6 flex gap-4 animate-in slide-in-from-top-4 shadow-sm">
                    <div className="bg-amber-100 p-2 rounded-full h-fit shrink-0">
                        <AlertTriangle className="text-amber-600" size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-amber-900 text-lg">Perlu Revisi</h3>
                        <p className="text-amber-800 mt-2 p-3 bg-white/50 rounded-lg border border-amber-100 italic">
                            "{feedback?.global || (typeof feedback === 'string' ? feedback : '')}"
                        </p>
                        <p className="text-amber-700 mt-3 text-sm font-medium">
                            Silakan perbaiki poin-poin di atas dan ajukan kembali.
                        </p>
                    </div>
                </div>
            )}

            {/* PENDING NOTICE */}
            {skpStatus === 'Pending' && (
                <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6 flex gap-4 animate-in slide-in-from-top-4 shadow-sm">
                    <div className="bg-blue-100 p-2 rounded-full h-fit shrink-0">
                        <Clock className="text-blue-600" size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-blue-900 text-lg">Menunggu Review</h3>
                        <p className="text-blue-700 mt-1 leading-relaxed">
                            SKP Anda sedang ditinjau oleh pejabat penilai. Anda akan menerima notifikasi setelah review selesai.
                        </p>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
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
                        <Toolbar
                            editor={activeEditor}
                            selectedEditors={selectedEditors}
                            onMerge={onMergeClick}
                            onUnmerge={onUnmergeClick}
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                            canUndo={canUndo}
                            canRedo={canRedo}
                        />
                    </div>
                </div>,
                portalTarget
            )}

            {/* Page Title & Status */}
            <div className="mb-6 flex justify-between items-end">
            </div>

            {/* Top Info Card */}
            <SKPHeader employee={user} evaluator={evaluator} />

            {/* SECTION 1: HASIL KERJA */}
            <SectionHeader title="Hasil Kerja" />

            <SKPSection
                title="A. UTAMA"
                rows={data.utama}
                onChange={(newRows, isTextUpdate) => updateSectionWithType('utama', newRows, isTextUpdate)}
                onEditorFocus={setActiveEditor}
                feedback={feedback?.sections?.utama}
                readOnly={isReadOnly}
                isActiveSection={activeSection === 'utama'}
                onSectionActive={() => setActiveSection('utama')}
                onSelectionChange={(editors, range) => {
                    if (activeSection === 'utama') {
                        setSelectedEditors(editors);
                        setSelectionRange(range);
                    }
                }}
            />

            <SKPSection
                title="B. TAMBAHAN"
                rows={data.tambahan}
                onChange={(newRows, isTextUpdate) => updateSectionWithType('tambahan', newRows, isTextUpdate)}
                onEditorFocus={setActiveEditor}
                feedback={feedback?.sections?.tambahan}
                readOnly={isReadOnly}
                isActiveSection={activeSection === 'tambahan'}
                onSectionActive={() => setActiveSection('tambahan')}
                onSelectionChange={(editors, range) => {
                    if (activeSection === 'tambahan') {
                        setSelectedEditors(editors);
                        setSelectionRange(range);
                    }
                }}
            />

            {/* SECTION 2: PERILAKU KERJA */}
            <SectionHeader title="Perilaku Kerja" />

            <SKPSection
                title="1. Berorientasi Pelayanan"
                rows={data.dukungan || []}
                onChange={(newRows, isTextUpdate) => updateSectionWithType('dukungan', newRows, isTextUpdate)}
                onEditorFocus={setActiveEditor}
                readOnly={isReadOnly}
                isActiveSection={activeSection === 'dukungan'}
                onSectionActive={() => setActiveSection('dukungan')}
                onSelectionChange={(editors, range) => {
                    if (activeSection === 'dukungan') {
                        setSelectedEditors(editors);
                        setSelectionRange(range);
                    }
                }}
            />

            {/* Submit Button */}
            {!isReadOnly && skpStatus !== 'Approved' && (
                <div className="mt-10 flex justify-end gap-4 border-t pt-6">
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full sm:w-auto shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-base px-8"
                        onClick={() => setShowConfirm(true)}
                        icon={Send}
                    >
                        Ajukan Rencana SKP
                    </Button>
                </div>
            )}
        </div>
    );
};

export default SubmitSKP;
