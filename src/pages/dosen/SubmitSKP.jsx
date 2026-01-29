import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { usePeriod } from '@/context/PeriodContext';

const SectionHeader = ({ title }) => (
    <div className="bg-primary text-white font-bold py-2.5 px-4 rounded-t-md shadow-sm text-sm tracking-wide uppercase mt-8 mb-0">
        {title}
    </div>
);

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
    const location = useLocation();
    const { user } = useAuth();

    // Determine effective user (Admin acting as proxy or normal user)
    const targetUser = location.state?.targetUser;
    const effectiveUser = targetUser || user;
    const isProxyMode = !!targetUser;

    const { periodConfig, periodLabel, loading: periodLoading } = usePeriod();
    const [evaluator, setEvaluator] = useState(null);
    const [activeEditor, setActiveEditor] = useState(null);
    const [selectedEditors, setSelectedEditors] = useState([]);
    const [activeSection, setActiveSection] = useState(null);

    const [portalTarget, setPortalTarget] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [existingSkpId, setExistingSkpId] = useState(null);
    const [skpStatus, setSkpStatus] = useState(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [currentYearSkp, setCurrentYearSkp] = useState(null);

    const [selectionRange, setSelectionRange] = useState(null);

    // UI State
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentYear = new Date().getFullYear().toString();

    // Redirect Admin to election page if they access this directly without proxy target
    useEffect(() => {
        if (user && user.role === 'admin' && !isProxyMode) {
            navigate('/admin/create-skp', { replace: true });
        }
    }, [user, isProxyMode, navigate]);

    useEffect(() => {
        setPortalTarget(document.getElementById('navbar-action-area'));
    }, []);

    // Auto-save hook
    const {
        data: draftData,
        isSaving,
        lastSaved,
        clearDraft,
        setData: setDraftData
    } = useSkpDraft(INITIAL_FORM_STATE, effectiveUser?.id);

    // History Hook
    const {
        state: historyState,
        pushState,
        undo,
        redo,
        canUndo,
        canRedo,
        reset: resetHistory
    } = useHistory(INITIAL_FORM_STATE);

    const historyInitialized = useRef(false);
    const saveTimeoutRef = useRef(null);

    const migrateRows = (rows) => {
        if (!rows || rows.length === 0) return [];
        const needsMigration = rows.some(r => r.isSubRow === undefined);
        if (!needsMigration) return rows;
        return rows.map((row, index) => {
            const isEven = index % 2 === 0;
            if (isEven) {
                return { ...row, isSubRow: false, parentId: undefined };
            } else {
                const parentId = rows[index - 1]?.id;
                return { ...row, isSubRow: true, parentId: parentId };
            }
        });
    };

    const rawData = historyState || draftData;
    const data = React.useMemo(() => {
        if (!rawData) return rawData;
        return {
            ...rawData,
            utama: migrateRows(rawData.utama),
            tambahan: migrateRows(rawData.tambahan)
        };
    }, [rawData]);

    const handleDataUpdate = (newData, isTextUpdate = false) => {
        setDraftData(newData);
        if (isTextUpdate) {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
                pushState(newData);
            }, 300);
        } else {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            pushState(newData);
        }
    };

    const updateSectionWithType = (sectionKey, newRows, isTextUpdate) => {
        if (!data) return;
        const newData = {
            ...data,
            [sectionKey]: newRows
        };
        handleDataUpdate(newData, isTextUpdate);
    };

    useEffect(() => {
        if (historyState) {
            setDraftData(historyState);
        }
    }, [historyState, setDraftData]);

    useEffect(() => {
        const loadExistingSkp = async () => {
            if (!effectiveUser) return;
            try {
                if (draftData && !historyInitialized.current) {
                    const isInitial = JSON.stringify(draftData) === JSON.stringify(INITIAL_FORM_STATE);
                    if (!isInitial) {
                        resetHistory(draftData);
                    }
                    historyInitialized.current = true;
                }
                const skps = await api.skps.getByUser(effectiveUser.id);
                const currentYearSkpEntry = skps.find(s => s.period === currentYear);
                if (currentYearSkpEntry) {
                    setCurrentYearSkp(currentYearSkpEntry);
                    setExistingSkpId(currentYearSkpEntry.id);
                    setSkpStatus(currentYearSkpEntry.status);
                    if (currentYearSkpEntry.status === 'Approved') {
                        setIsReadOnly(true);
                        if (currentYearSkpEntry.details) {
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
    }, [effectiveUser, currentYear]);

    useEffect(() => {
        const fetchEvaluator = async () => {
            if (!effectiveUser) return;
            try {
                const freshUser = await api.users.getById(effectiveUser.id);
                if (freshUser.raters?.pejabatPenilaiId) {
                    const evaluatorData = await api.users.getById(freshUser.raters.pejabatPenilaiId);
                    setEvaluator(evaluatorData);
                }
            } catch (error) {
                console.error("Failed to fetch evaluator:", error);
            }
        };
        fetchEvaluator();
    }, [effectiveUser]);

    const handleConfirmSubmit = async () => {
        if (!effectiveUser || isReadOnly) return;
        setIsSubmitting(true);
        try {
            const payload = {
                userId: effectiveUser.id,
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

    return (
        <div className="max-w-7xl mx-auto pb-20">
            {/* Top Bar with Auto-save indicator */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Formulir Rencana SKP</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                            <span className="font-semibold text-gray-800">{periodConfig?.year || new Date().getFullYear()}</span>
                            <span className="border-l border-gray-300 pl-2">
                                {periodLabel || 'Memuat periode...'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 bg-white/50 px-4 py-2 rounded-full border border-gray-100 shadow-sm backdrop-blur-sm">
                    {!isReadOnly && (
                        isSaving ? (
                            <span className="animate-pulse text-primary">Menyimpan draf...</span>
                        ) : lastSaved ? (
                            <span className="flex items-center gap-1 text-primary">
                                <Save size={12} />
                                Disimpan {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        ) : (
                            <span>Draf tersimpan otomatis</span>
                        )
                    )}
                </div>
            </div>

            {/* Proxy Mode Banner */}
            {
                isProxyMode && (
                    <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-2 rounded-full">
                                <Info className="text-purple-600" size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-purple-900">Mode Admin / Proxy</h3>
                                <p className="text-purple-700 text-sm">
                                    Anda sedang membuat/mengedit SKP atas nama: <span className="font-bold">{effectiveUser.fullName}</span> ({effectiveUser.role})
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(-1)}
                            className="text-purple-700 hover:bg-purple-100"
                        >
                            Kembali
                        </Button>
                    </div>
                )
            }

            {/* APPROVED NOTICE */}
            {
                skpStatus === 'Approved' && (
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
                )
            }

            {/* REVISION NOTICE */}
            {
                skpStatus === 'Rejected' && feedback && (
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
                )
            }

            {/* PENDING NOTICE */}
            {
                skpStatus === 'Pending' && (
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
                )
            }

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleConfirmSubmit}
                isSubmitting={isSubmitting}
            />

            {/* PORTAL TOOLBAR */}
            {
                portalTarget && createPortal(
                    <div className="w-full flex justify-center animate-in fade-in zoom-in duration-300">
                        <div className="max-w-2xl w-full">
                            <Toolbar
                                editor={activeEditor}
                                selectedEditors={selectedEditors}
                            />
                        </div>
                    </div>,
                    portalTarget
                )
            }

            {/* Page Title & Status */}
            <div className="mb-6 flex justify-between items-end">
            </div>

            {/* Top Info Card */}
            <SKPHeader employee={effectiveUser} evaluator={evaluator} />

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

            {/* SECTION 3: LAMPIRAN */}
            <SectionHeader title="C. LAMPIRAN SASARAN KINERJA PEGAWAI" />

            {/* C.1 Dukungan Sumber Daya */}
            <div className="mb-4">
                <SKPSection
                    title="1. Dukungan Sumber Daya"
                    rows={data.dukungan}
                    onChange={(newRows, isTextUpdate) => updateSectionWithType('dukungan', newRows, isTextUpdate)}
                    onEditorFocus={setActiveEditor}
                    feedback={feedback?.sections?.dukungan}
                    readOnly={isReadOnly}
                    isActiveSection={activeSection === 'dukungan'}
                    onSectionActive={() => setActiveSection('dukungan')}
                    onSelectionChange={(editors, range) => {
                        if (activeSection === 'dukungan') {
                            setSelectedEditors(editors);
                            setSelectionRange(range);
                        }
                    }}
                    columnHeaders={['Dukungan Sumber Daya']}
                    showNumbers={true}
                    simpleRow={true}
                />
            </div>

            {/* C.2 Skema Pertanggungjawaban */}
            <div className="mb-4">
                <SKPSection
                    title="2. Skema Pertanggungjawaban"
                    rows={data.skema}
                    onChange={(newRows, isTextUpdate) => updateSectionWithType('skema', newRows, isTextUpdate)}
                    onEditorFocus={setActiveEditor}
                    feedback={feedback?.sections?.skema}
                    readOnly={isReadOnly}
                    isActiveSection={activeSection === 'skema'}
                    onSectionActive={() => setActiveSection('skema')}
                    onSelectionChange={(editors, range) => {
                        if (activeSection === 'skema') {
                            setSelectedEditors(editors);
                            setSelectionRange(range);
                        }
                    }}
                    columnHeaders={['Skema Pertanggungjawaban']}
                    showNumbers={true}
                    simpleRow={true}
                />
            </div>

            {/* C.3 Konsekuensi */}
            <div className="mb-4">
                <SKPSection
                    title="3. Konsekuensi"
                    rows={data.konsekuensi}
                    onChange={(newRows, isTextUpdate) => updateSectionWithType('konsekuensi', newRows, isTextUpdate)}
                    onEditorFocus={setActiveEditor}
                    feedback={feedback?.sections?.konsekuensi}
                    readOnly={isReadOnly}
                    isActiveSection={activeSection === 'konsekuensi'}
                    onSectionActive={() => setActiveSection('konsekuensi')}
                    onSelectionChange={(editors, range) => {
                        if (activeSection === 'konsekuensi') {
                            setSelectedEditors(editors);
                            setSelectionRange(range);
                        }
                    }}
                    columnHeaders={['Konsekuensi']}
                    showNumbers={true}
                    simpleRow={true}
                />
            </div>



            {/* Submit Button */}
            {
                !isReadOnly && skpStatus !== 'Approved' && (
                    <div className="mt-10 flex justify-end gap-4 border-t pt-6">
                        <Button
                            variant="gradient"
                            size="lg"
                            className="w-full sm:w-auto shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all text-base px-8 font-bold tracking-wide"
                            onClick={() => setShowConfirm(true)}
                            icon={Send}
                        >
                            Ajukan Rencana SKP
                        </Button>
                    </div>
                )
            }
        </div >
    );
};

export default SubmitSKP;
