import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import { toast } from 'sonner';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Toolbar from './components/Toolbar'; // Reuse existing toolbar
import SKPSection from './components/SKPSection';
import {
    FileText,
    CheckCircle,
    Clock,
    AlertTriangle,
    Send,
    Save,
    MessageSquare
} from 'lucide-react';

// Internal SimpleEditor component (to avoid new file)
// Note: Created here as user requested "Dont make new file"
const SimpleEditor = ({
    content,
    onUpdate,
    onFocus,
    readOnly = false,
    placeholder = 'Tuliskan realisasi...',
    className = ''
}) => {
    const onUpdateRef = useRef(onUpdate);
    const onFocusRef = useRef(onFocus);

    useEffect(() => {
        onUpdateRef.current = onUpdate;
        onFocusRef.current = onFocus;
    }, [onUpdate, onFocus]);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Placeholder.configure({ placeholder }),
        ],
        content: content,
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            if (!readOnly && onUpdateRef.current) {
                onUpdateRef.current(editor.getHTML());
            }
        },
        onFocus: ({ editor }) => {
            if (!readOnly && onFocusRef.current) {
                onFocusRef.current(editor);
            }
        },
        editorProps: {
            attributes: {
                class: `prose prose-sm prose-blue max-w-none outline-none text-sm w-full h-full min-h-[80px] p-3 ${className}`,
            },
        },
    }, []);

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            if (editor.isEmpty && content) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    useEffect(() => {
        if (editor) {
            editor.setEditable(!readOnly);
        }
    }, [readOnly, editor]);

    return (
        <EditorContent editor={editor} className="w-full h-full" />
    );
};

const RealisasiSKP = () => {
    const { user } = useAuth();
    const [approvedSkps, setApprovedSkps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSkp, setSelectedSkp] = useState(null);
    const [realisasiData, setRealisasiData] = useState({});
    const [detailsData, setDetailsData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Editor State for Toolbar
    const [activeEditor, setActiveEditor] = useState(null);
    const [portalTarget, setPortalTarget] = useState(null);

    useEffect(() => {
        // Retry finding the portal target in case of race conditions
        const findTarget = () => {
            const target = document.getElementById('navbar-action-area');
            if (target) {
                setPortalTarget(target);
                return true;
            }
            return false;
        };

        if (!findTarget()) {
            const interval = setInterval(() => {
                if (findTarget()) clearInterval(interval);
            }, 100);
            return () => clearInterval(interval);
        }
    }, []);

    useEffect(() => {
        loadApprovedSkps();
    }, [user]);

    const loadApprovedSkps = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const skps = await api.skps.getByUser(user.id);
            const approved = skps.filter(s => s.status === 'Approved');
            setApprovedSkps(approved);

            if (approved.length > 0) {
                const latest = approved[0];
                setSelectedSkp(latest);
                setRealisasiData(latest.realisasi || initializeRealisasi(latest.details));

                // Initialize local details state for Lampiran
                setDetailsData({
                    dukungan: latest.details?.dukungan || [],
                    skema: latest.details?.skema || [],
                    konsekuensi: latest.details?.konsekuensi || []
                });
            }
        } catch (error) {
            console.error('Failed to load SKPs:', error);
            toast.error('Gagal memuat data SKP');
        } finally {
            setLoading(false);
        }
    };

    const initializeRealisasi = (details) => {
        const realisasi = {};

        if (details?.utama) {
            realisasi.utama = details.utama.map(row => ({
                id: row.id,
                realisasi: '',
                umpanBalik: row.umpanBalik || ''
            }));
        }
        if (details?.tambahan) {
            realisasi.tambahan = details.tambahan.map(row => ({
                id: row.id,
                realisasi: '',
                umpanBalik: row.umpanBalik || ''
            }));
        }
        // Initialize Lampiran Sections - REMOVED (Handled by detailsData now)

        return realisasi;
    };

    const handleRealisasiChange = (sectionKey, rowIndex, value) => {
        setRealisasiData(prev => {
            const updated = { ...prev };
            if (!updated[sectionKey]) {
                updated[sectionKey] = [];
            }
            if (!updated[sectionKey][rowIndex]) {
                updated[sectionKey][rowIndex] = { id: rowIndex, realisasi: '', umpanBalik: '' };
            }
            updated[sectionKey][rowIndex] = {
                ...updated[sectionKey][rowIndex],
                realisasi: value
            };
            return updated;
        });
    };

    const handleDetailsChange = (sectionKey, newRows) => {
        setDetailsData(prev => ({
            ...prev,
            [sectionKey]: newRows
        }));
    };

    const handleSaveDraft = async () => {
        if (!selectedSkp) return;
        setIsSaving(true);
        try {
            await api.skps.update(selectedSkp.id, {
                realisasi: realisasiData,
                details: {
                    ...selectedSkp.details,
                    ...detailsData
                }
            });
            toast.success('Draft berhasil disimpan');
        } catch (error) {
            toast.error('Gagal menyimpan draft');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmitRealisasi = async () => {
        if (!selectedSkp) return;

        // Check if any realisasi field is filled
        const hasRealisasi = Object.values(realisasiData).some(section =>
            Array.isArray(section) && section.some(row => row?.realisasi?.trim())
        );

        if (!hasRealisasi) {
            // Check if user edited lampiran at least? 
            // For now, strict check on Realisasi input of Hasil Kerja
            toast.error('Mohon isi minimal satu realisasi sebelum mengirim');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.skps.update(selectedSkp.id, {
                realisasi: realisasiData,
                details: {
                    ...selectedSkp.details,
                    ...detailsData
                },
                realisasiStatus: 'Pending',
                realisasiSubmittedAt: new Date().toISOString()
            });
            toast.success('Realisasi berhasil dikirim untuk review!');
            loadApprovedSkps();
        } catch (error) {
            toast.error('Gagal mengirim realisasi');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (skp) => {
        if (skp.realisasiStatus === 'Pending') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    <Clock size={12} />
                    Menunggu Review
                </span>
            );
        }
        if (skp.realisasiStatus === 'Reviewed') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    <CheckCircle size={12} />
                    Sudah Direview
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                <FileText size={12} />
                Draft
            </span>
        );
    };

    // Check if the form should be editable
    // It is editable if it's NOT under review (Pending + Submitted date)
    // We allow editing if it is 'Reviewed' so they can make changes and resend
    const isPendingReview = selectedSkp?.realisasiStatus === 'Pending' && selectedSkp?.realisasiSubmittedAt;
    const isEditable = !isPendingReview;

    const renderSection = (sectionKey, sectionTitle, rows) => {
        if (!rows || rows.length === 0) return null;

        const realisasiSection = realisasiData[sectionKey] || [];
        // Use component-level isEditable

        // Group rows: numbered row starts a new group, sub-rows (no number) belong to previous group
        const groups = [];
        let mainRowCounter = 0;
        let currentGroup = null;

        rows.forEach((row, index) => {
            // New Logic: Use isSubRow to detect main rows
            // If isSubRow is undefined (legacy data), assume it's a main row if it's the first one or alternate? 
            // Better: The migration tool we made earlier ensures isSubRow exists.
            // If !isSubRow => It's a main row ("No 1", "No 2", etc.)

            const isMainRow = !row.isSubRow;

            if (isMainRow) {
                mainRowCounter++;
                // Start a new group
                currentGroup = {
                    number: mainRowCounter, // Assign dynamic number
                    rows: [{ ...row, originalIndex: index }],
                    startIndex: index
                };
                groups.push(currentGroup);
            } else if (currentGroup) {
                // Add to current group (sub-row)
                currentGroup.rows.push({ ...row, originalIndex: index });
            } else {
                // Orphaned sub-row (shouldn't happen with correct logic, but handle gracefully)
                // Treat as main row if we have no group yet
                mainRowCounter++;
                currentGroup = {
                    number: mainRowCounter,
                    rows: [{ ...row, originalIndex: index }],
                    startIndex: index
                };
                groups.push(currentGroup);
            }
        });

        return (
            <div key={sectionKey} className="mb-6">
                {/* Section Header */}
                <div className="bg-primary text-white font-bold py-2.5 px-4 text-sm tracking-wide uppercase">
                    {sectionTitle}
                </div>

                {/* Table */}
                <div className="border border-t-0 border-blue-300 overflow-x-auto">
                    <table className="w-full border-collapse">
                        <colgroup>
                            <col style={{ width: '40px' }} />
                            <col style={{ width: '45%' }} />
                            <col style={{ width: '25%' }} />
                            <col style={{ width: '25%' }} />
                        </colgroup>
                        <thead>
                            <tr className="bg-blue-100 border-b border-blue-300">
                                <th className="border-r border-blue-300 py-2 px-2 text-xs font-bold text-blue-800 text-center">No</th>
                                <th className="border-r border-blue-300 py-2 px-3 text-xs font-bold text-blue-800 text-left">Kegiatan</th>
                                <th className="border-r border-blue-300 py-2 px-3 text-xs font-bold text-blue-800 text-left">Realisasi</th>
                                <th className="py-2 px-3 text-xs font-bold text-blue-800 text-left">Umpan Balik</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map((group, groupIndex) => {
                                const groupRowCount = group.rows.length;
                                const realisasiRow = realisasiSection[group.startIndex] || {};

                                return group.rows.map((row, rowInGroup) => {
                                    const isFirstInGroup = rowInGroup === 0;
                                    const planContent = row.columns?.[0] || '';

                                    return (
                                        <tr
                                            key={row.id || row.originalIndex}
                                            className={`border-b border-blue-200 hover:bg-blue-50/30 transition-colors ${rowInGroup > 0 ? 'bg-blue-50/20' : ''}`}
                                        >
                                            {/* Number - Only show for first row in group, with rowSpan */}
                                            {isFirstInGroup && (
                                                <td
                                                    className="border-r border-blue-200 py-2 px-2 text-center align-top bg-blue-50"
                                                    rowSpan={groupRowCount}
                                                >
                                                    {group.number && (
                                                        <span className="text-sm font-bold text-blue-700">{group.number}</span>
                                                    )}
                                                </td>
                                            )}

                                            {/* Plan Content - Each row has its own content */}
                                            <td className="border-r border-blue-200 p-0 align-top">
                                                <div
                                                    className="prose prose-sm max-w-none text-gray-700 p-3 min-h-[60px] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                                                    dangerouslySetInnerHTML={{ __html: planContent }}
                                                />
                                            </td>

                                            {/* Realization - Only first row in group, with rowSpan */}
                                            {isFirstInGroup && (
                                                <td
                                                    className="border-r border-blue-200 p-0 align-top"
                                                    rowSpan={groupRowCount}
                                                >
                                                    {isEditable ? (
                                                        <SimpleEditor
                                                            content={realisasiRow.realisasi || ''}
                                                            onUpdate={(html) => handleRealisasiChange(sectionKey, group.startIndex, html)}
                                                            onFocus={(editor) => setActiveEditor(editor)}
                                                            placeholder="Tuliskan realisasi..."
                                                        />
                                                    ) : (
                                                        <div
                                                            className="p-3 text-sm text-gray-700 min-h-[80px] bg-gray-50 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                                                            dangerouslySetInnerHTML={{
                                                                __html: realisasiRow.realisasi || '<span class="text-gray-400 italic">-</span>'
                                                            }}
                                                        />
                                                    )}
                                                </td>
                                            )}

                                            {/* Feedback - Only first row in group, with rowSpan */}
                                            {isFirstInGroup && (
                                                <td
                                                    className="p-0 align-top"
                                                    rowSpan={groupRowCount}
                                                    style={{ height: '1px' }}
                                                >
                                                    {realisasiRow.umpanBalik ? (
                                                        <div className="w-full h-full text-sm text-gray-800 bg-amber-50 p-3 min-h-[100px]">
                                                            {realisasiRow.umpanBalik}
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full p-3 min-h-[100px] flex items-start">
                                                            <span className="text-gray-400 text-sm italic">Belum ada umpan balik</span>
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                });
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (approvedSkps.length === 0) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="bg-gray-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText size={32} className="text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Belum Ada SKP Disetujui</h2>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Anda belum memiliki SKP yang disetujui. Silakan ajukan rencana SKP terlebih dahulu.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Evaluasi Akhir SKP</h1>
                    <p className="text-gray-500 mt-1">Isi realisasi capaian kinerja Anda</p>
                </div>

                {selectedSkp && (
                    <div className="flex items-center gap-3">
                        {getStatusBadge(selectedSkp)}
                        <span className="text-sm text-gray-500">
                            Periode: <span className="font-medium text-gray-900">{selectedSkp.period}</span>
                        </span>
                    </div>
                )}
            </div>

            {/* SKP Selector */}
            {approvedSkps.length > 1 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <label className="text-sm font-medium text-gray-700 block mb-2">Pilih SKP:</label>
                    <select
                        value={selectedSkp?.id || ''}
                        onChange={(e) => {
                            const skp = approvedSkps.find(s => s.id === e.target.value);
                            setSelectedSkp(skp);
                            setRealisasiData(skp?.realisasi || initializeRealisasi(skp?.details));
                            if (skp) {
                                setDetailsData({
                                    dukungan: skp.details?.dukungan || [],
                                    skema: skp.details?.skema || [],
                                    konsekuensi: skp.details?.konsekuensi || []
                                });
                            }
                        }}
                        className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                        {approvedSkps.map(skp => (
                            <option key={skp.id} value={skp.id}>
                                Periode {skp.period} - {skp.realisasiStatus || 'Draft'}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* PORTAL TOOLBAR */}
            {selectedSkp && (!selectedSkp.realisasiStatus || !['Pending'].includes(selectedSkp.realisasiStatus)) && portalTarget && createPortal(
                <div className="w-full flex justify-center animate-in fade-in zoom-in duration-300">
                    <div className="max-w-2xl w-full">
                        <Toolbar
                            editor={activeEditor}
                        />
                    </div>
                </div>,
                portalTarget
            )}

            {/* Main Content */}
            {selectedSkp && (
                <>
                    {/* Pending Notice */}
                    {selectedSkp.realisasiStatus === 'Pending' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                            <Clock className="text-amber-600 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-semibold text-amber-900">Menunggu Review</h3>
                                <p className="text-amber-700 text-sm">
                                    Realisasi SKP Anda sedang ditinjau. Anda tidak dapat mengedit hingga review selesai.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Reviewed Notice */}
                    {selectedSkp.realisasiStatus === 'Reviewed' && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                            <CheckCircle className="text-emerald-600 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-semibold text-emerald-900">Sudah Direview</h3>
                                <p className="text-emerald-700 text-sm">
                                    SKP ini telah direview. Anda dapat <b>mengedit kembali</b> realisasi di bawah ini dan menyimpan perubahan untuk dikirim ulang.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Results Section Header */}
                    <div className="bg-blue-600 text-white font-bold py-2 px-4 rounded-t-lg text-sm uppercase tracking-wider">
                        HASIL KERJA
                    </div>

                    {/* Sections */}
                    <div className="bg-white rounded-b-2xl border border-t-0 border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4">
                            {renderSection('utama', 'A. Utama', selectedSkp.details?.utama)}
                            {renderSection('tambahan', 'B. Tambahan', selectedSkp.details?.tambahan)}
                        </div>
                    </div>

                    {/* Lampiran Section Header */}
                    <div className="bg-blue-600 text-white font-bold py-2 px-4 rounded-t-lg text-sm uppercase tracking-wider mt-6">
                        LAMPIRAN SASARAN KINERJA PEGAWAI
                    </div>

                    {/* Lampiran Sections (Editable via SKPSection) */}
                    <div className="bg-white rounded-b-2xl border border-t-0 border-gray-100 shadow-sm overflow-hidden mb-6">
                        <div className="p-4">
                            <div className="mb-4">
                                <SKPSection
                                    title="1. Dukungan Sumber Daya"
                                    rows={detailsData.dukungan}
                                    onChange={(newRows) => handleDetailsChange('dukungan', newRows)}
                                    onEditorFocus={setActiveEditor}
                                    readOnly={!isEditable}
                                    simpleRow={true}
                                    showNumbers={true}
                                    columnHeaders={['Dukungan Sumber Daya']}
                                />
                            </div>
                            <div className="mb-4">
                                <SKPSection
                                    title="2. Skema Pertanggungjawaban"
                                    rows={detailsData.skema}
                                    onChange={(newRows) => handleDetailsChange('skema', newRows)}
                                    onEditorFocus={setActiveEditor}
                                    readOnly={!isEditable}
                                    simpleRow={true}
                                    showNumbers={true}
                                    columnHeaders={['Skema Pertanggungjawaban']}
                                />
                            </div>
                            <div className="mb-4">
                                <SKPSection
                                    title="3. Konsekuensi"
                                    rows={detailsData.konsekuensi}
                                    onChange={(newRows) => handleDetailsChange('konsekuensi', newRows)}
                                    onEditorFocus={setActiveEditor}
                                    readOnly={!isEditable}
                                    simpleRow={true}
                                    showNumbers={true}
                                    columnHeaders={['Konsekuensi']}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {selectedSkp.realisasiStatus !== 'Pending' && (
                        <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                            {selectedSkp.realisasiStatus === 'Reviewed' ? (
                                <Button
                                    variant="gradient"
                                    onClick={handleSubmitRealisasi}
                                    isLoading={isSubmitting}
                                    className="flex items-center gap-2"
                                >
                                    <Send size={16} />
                                    Simpan Perubahan & Kirim Ulang
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={handleSaveDraft}
                                        isLoading={isSaving}
                                        className="flex items-center gap-2"
                                    >
                                        <Save size={16} />
                                        Simpan Draft
                                    </Button>
                                    <Button
                                        variant="gradient"
                                        onClick={handleSubmitRealisasi}
                                        isLoading={isSubmitting}
                                        className="flex items-center gap-2"
                                    >
                                        <Send size={16} />
                                        Kirim untuk Review
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RealisasiSKP;
