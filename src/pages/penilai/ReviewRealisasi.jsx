import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import { toast } from 'sonner';
import {
    ArrowLeft,
    CheckCircle,
    MessageSquare,
    User,
    Calendar,
    Building2,
    Send,
    FileText,
    Printer,
    Download,
    Lock,
    Star,
    XCircle,
    AlertTriangle,
    ThumbsUp,
    ChevronDown,
    X
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import SKPSection from '../dosen/components/SKPSection';
import Toolbar from '@/pages/dosen/components/Toolbar';

const RATING_OPTIONS = [
    {
        value: 'Sangat Buruk',
        label: 'Sangat Buruk',
        color: 'text-red-700',
        bg: 'bg-red-50',
        hoverBg: 'hover:bg-red-50',
        border: 'border-red-200',
        ring: 'focus:ring-red-500',
        icon: XCircle
    },
    {
        value: 'Buruk',
        label: 'Buruk',
        color: 'text-orange-700',
        bg: 'bg-orange-50',
        hoverBg: 'hover:bg-orange-50',
        border: 'border-orange-200',
        ring: 'focus:ring-orange-500',
        icon: AlertTriangle
    },
    {
        value: 'Baik',
        label: 'Baik',
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        hoverBg: 'hover:bg-blue-50',
        border: 'border-blue-200',
        ring: 'focus:ring-blue-500',
        icon: ThumbsUp
    },
    {
        value: 'Sangat Baik',
        label: 'Sangat Baik',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        hoverBg: 'hover:bg-emerald-50',
        border: 'border-emerald-200',
        ring: 'focus:ring-emerald-500',
        icon: Star
    },
];

const ReviewRealisasi = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [skp, setSkp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Perilaku Kerja State (Dynamic Rows)
    const [perilakuRows, setPerilakuRows] = useState([]);

    const [activeEditor, setActiveEditor] = useState(null);
    const [activeSection, setActiveSection] = useState(null); // Track active section for Toolbar context

    const [openDropdown, setOpenDropdown] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const [showFinalDialog, setShowFinalDialog] = useState(false);
    const [finalRating, setFinalRating] = useState('Baik');

    // Check permissions
    const isReviewer = skp && user && skp.userId !== user.id; // User is reviewing someone else's SKP
    const canEditPerilaku = isReviewer && skp?.realisasiStatus !== 'Approved';

    const returnTo = location.state?.returnTo || '/penilai/evaluations';

    useEffect(() => {
        loadSkp();
    }, [id]);

    const loadSkp = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await api.skps.getById(id);
            setSkp(data);

            // Initialize feedback logic...
            const existingFeedback = {};
            if (data.realisasi) {
                Object.keys(data.realisasi).forEach(sectionKey => {
                    existingFeedback[sectionKey] = data.realisasi[sectionKey]?.map(row => {
                        if (!row) return { id: null, umpanBalik: '', rating: '' };
                        return {
                            id: row.id,
                            umpanBalik: row.umpanBalik || '',
                            rating: row.rating || ''
                        };
                    }) || [];
                });
            }
            setFeedback(existingFeedback);

            // Initialize Perilaku Data
            // If empty, set default structure: 1 Main Row + 1 Sub Row (2 Pairs hardcoded for ease?)
            // Or just one pair.
            let initialPerilaku = data.perilaku;
            if (!initialPerilaku || !Array.isArray(initialPerilaku) || initialPerilaku.length === 0) {
                initialPerilaku = [
                    { id: 1, columns: ['', ''], isSubRow: false, rowSpans: [1, 2] },
                    { id: 2, columns: ['', ''], isSubRow: true, parentId: 1, colHiddens: [1] }
                ];
            }
            setPerilakuRows(initialPerilaku);

        } catch (error) {
            console.error('Failed to load SKP:', error);
            toast.error('Gagal memuat data SKP');
        } finally {
            setLoading(false);
        }
    };

    const handleFeedbackChange = (sectionKey, rowIndex, value) => {
        setFeedback(prev => {
            const updated = { ...prev };
            if (!updated[sectionKey]) updated[sectionKey] = [];
            if (!updated[sectionKey][rowIndex]) updated[sectionKey][rowIndex] = { id: rowIndex, umpanBalik: '', rating: '' };
            updated[sectionKey][rowIndex] = { ...updated[sectionKey][rowIndex], umpanBalik: value };
            return updated;
        });
    };

    const handleRatingChange = (sectionKey, rowIndex, value) => {
        setFeedback(prev => {
            const updated = { ...prev };
            if (!updated[sectionKey]) updated[sectionKey] = [];
            if (!updated[sectionKey][rowIndex]) updated[sectionKey][rowIndex] = { id: rowIndex, umpanBalik: '', rating: '' };
            updated[sectionKey][rowIndex] = { ...updated[sectionKey][rowIndex], rating: value };
            return updated;
        });
    };

    const handleSubmitReview = async () => {
        if (!skp) return;

        setIsSubmitting(true);
        try {
            const updatedRealisasi = { ...skp.realisasi };
            Object.keys(feedback).forEach(sectionKey => {
                if (updatedRealisasi[sectionKey]) {
                    feedback[sectionKey].forEach((fb, index) => {
                        if (updatedRealisasi[sectionKey][index]) {
                            updatedRealisasi[sectionKey][index].umpanBalik = fb.umpanBalik;
                            updatedRealisasi[sectionKey][index].rating = fb.rating;
                        }
                    });
                }
            });

            await api.skps.update(skp.id, {
                realisasi: updatedRealisasi,
                perilaku: perilakuRows, // Save dynamic rows
                realisasiStatus: 'Reviewed',
                realisasiReviewedAt: new Date().toISOString(),
                realisasiReviewerId: user.id
            });

            toast.success('Review berhasil dikirim!');
            navigate(returnTo);
        } catch (error) {
            console.error('Failed to submit review:', error);
            toast.error('Gagal mengirim review');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFinalizeClick = () => {
        if (!skp) return;
        setShowFinalDialog(true);
    };

    const onConfirmFinalize = async () => {
        setIsSubmitting(true);
        try {
            const updatedRealisasi = { ...skp.realisasi };
            Object.keys(feedback).forEach(sectionKey => {
                if (updatedRealisasi[sectionKey]) {
                    feedback[sectionKey].forEach((fb, index) => {
                        if (updatedRealisasi[sectionKey][index]) {
                            updatedRealisasi[sectionKey][index].umpanBalik = fb.umpanBalik;
                            updatedRealisasi[sectionKey][index].rating = fb.rating;
                        }
                    });
                }
            });

            await api.skps.update(skp.id, {
                realisasi: updatedRealisasi,
                perilaku: perilakuRows, // Save dynamic rows
                predikatAkhir: finalRating,
                realisasiStatus: 'Approved',
                realisasiReviewedAt: new Date().toISOString(),
                realisasiReviewerId: user.id,
                approvedAt: new Date().toISOString(),
                evaluatorId: user.id
            });

            toast.success('SKP berhasil difinalisasi!');
            setShowFinalDialog(false);
            navigate(returnTo);
        } catch (error) {
            console.error('Failed to finalize SKP:', error);
            toast.error('Gagal memfinalisasi SKP');
        } finally {
            setIsSubmitting(false);
            setShowFinalDialog(false);
        }
    };

    const handleDownloadPDF = () => {
        if (!skp) return;

        // Evaluator Data
        const evaluator = skp.evaluator || {};
        const evaluatorName = evaluator.fullName || "_______________________";
        const evaluatorNIP = evaluator.identityNumber || "...................";
        const evaluatorJabatan = evaluator.jabatan || "Pejabat Penilai Kinerja";
        const evaluatorPangkat = evaluator.pangkat || "-";
        const evaluatorUnit = evaluator.departmentName || "-";

        // Helper to strip HTML tags
        const stripHtml = (html) => {
            if (!html) return '-';
            const tmp = document.createElement("DIV");
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || '-';
        };

        // Helper to render rows for hasil kerja tables
        const renderHasilKerjaRows = (planRows, realisasiRows, feedbackData) => {
            if (!planRows || planRows.length === 0) {
                return '<tr><td colspan="5" style="text-align: center; padding: 12px; font-style: italic; color: #666;">Tidak ada data</td></tr>';
            }

            // Group rows by main row (same logic as renderSection)
            const groups = [];
            let mainRowCounter = 0;
            let currentGroup = null;

            planRows.forEach((row, index) => {
                const isMainRow = !row.isSubRow;
                if (isMainRow) {
                    mainRowCounter++;
                    currentGroup = {
                        number: mainRowCounter,
                        rows: [{ ...row, originalIndex: index }],
                        startIndex: index
                    };
                    groups.push(currentGroup);
                } else if (currentGroup) {
                    currentGroup.rows.push({ ...row, originalIndex: index });
                }
            });

            return groups.map((group) => {
                // Combine all plan content for this group
                const planContent = group.rows.map(row => {
                    const content = row.columns?.[0] || '';
                    return stripHtml(content);
                }).join('\n• ');

                const realisasiContent = stripHtml(realisasiRows?.[group.startIndex]?.realisasi || '-');
                const umpanBalik = feedbackData?.[group.startIndex]?.umpanBalik || '-';
                const rating = feedbackData?.[group.startIndex]?.rating || '-';

                return `
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: top; width: 40px;">${group.number}</td>
                        <td style="border: 1px solid #000; padding: 8px; vertical-align: top; width: 30%;">${planContent}</td>
                        <td style="border: 1px solid #000; padding: 8px; vertical-align: top; width: 25%;">${realisasiContent}</td>
                        <td style="border: 1px solid #000; padding: 8px; vertical-align: top; width: 25%;">${umpanBalik}</td>
                        <td style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: top; width: 15%;">${rating}</td>
                    </tr>
                `;
            }).join('');
        };

        // Create HTML content
        const element = document.createElement('div');
        element.innerHTML = `
            <div style="font-family: 'Times New Roman', Times, serif; padding: 20px; color: #000; line-height: 1.4; font-size: 11pt;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 25px;">
                    <h2 style="font-size: 14pt; font-weight: bold; margin: 0;">SASARAN KINERJA PEGAWAI</h2>
                    <h3 style="font-size: 12pt; font-weight: bold; margin: 5px 0;">PENDEKATAN HASIL KERJA KUALITATIF</h3>
                    <h4 style="font-size: 11pt; font-weight: normal; margin: 5px 0;">BAGI PEJABAT ADMINISTRASI / FUNGSIONAL</h4>
                    <p style="font-size: 11pt; margin: 10px 0;">Periode: ${skp.period || skp.year || '-'}</p>
                </div>

                <!-- Employee Info Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11pt;">
                    <thead>
                        <tr>
                            <th style="width: 50%; border: 1px solid #000; padding: 8px; text-align: left; background-color: #f0f0f0;">PEGAWAI YANG DINILAI</th>
                            <th style="width: 50%; border: 1px solid #000; padding: 8px; text-align: left; background-color: #f0f0f0;">PEJABAT PENILAI KINERJA</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #000; padding: 10px; vertical-align: top;">
                                <table style="width: 100%; border: none; font-size: 11pt;">
                                    <tr><td style="width: 100px; padding: 2px 0;">1. Nama</td><td style="padding: 2px 0;">: ${skp.user?.fullName || '-'}</td></tr>
                                    <tr><td style="padding: 2px 0;">2. NIP</td><td style="padding: 2px 0;">: ${skp.user?.identityNumber || '-'}</td></tr>
                                    <tr><td style="padding: 2px 0;">3. Pangkat/Gol.</td><td style="padding: 2px 0;">: ${skp.user?.pangkat || '-'}</td></tr>
                                    <tr><td style="padding: 2px 0;">4. Jabatan</td><td style="padding: 2px 0;">: ${skp.user?.jabatan || '-'}</td></tr>
                                    <tr><td style="padding: 2px 0;">5. Unit Kerja</td><td style="padding: 2px 0;">: ${skp.user?.departmentName || '-'}</td></tr>
                                </table>
                            </td>
                            <td style="border: 1px solid #000; padding: 10px; vertical-align: top;">
                                <table style="width: 100%; border: none; font-size: 11pt;">
                                    <tr><td style="width: 100px; padding: 2px 0;">1. Nama</td><td style="padding: 2px 0;">: ${evaluatorName}</td></tr>
                                    <tr><td style="padding: 2px 0;">2. NIP</td><td style="padding: 2px 0;">: ${evaluatorNIP}</td></tr>
                                    <tr><td style="padding: 2px 0;">3. Pangkat/Gol.</td><td style="padding: 2px 0;">: ${evaluatorPangkat}</td></tr>
                                    <tr><td style="padding: 2px 0;">4. Jabatan</td><td style="padding: 2px 0;">: ${evaluatorJabatan}</td></tr>
                                    <tr><td style="padding: 2px 0;">5. Unit Kerja</td><td style="padding: 2px 0;">: ${evaluatorUnit}</td></tr>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Hasil Kerja Section -->
                <div style="margin-bottom: 20px;">
                    <h3 style="font-size: 12pt; font-weight: bold; margin-bottom: 15px;">HASIL KERJA</h3>
                    
                    <!-- A. Utama -->
                    <div style="margin-bottom: 15px;">
                        <h4 style="font-size: 11pt; font-weight: bold; margin-bottom: 8px;">A. Utama</h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 11pt;">
                            <thead>
                                <tr style="background-color: #f0f0f0;">
                                    <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 40px;">No</th>
                                    <th style="border: 1px solid #000; padding: 8px; text-align: center;">Kegiatan</th>
                                    <th style="border: 1px solid #000; padding: 8px; text-align: center;">Realisasi</th>
                                    <th style="border: 1px solid #000; padding: 8px; text-align: center;">Umpan Balik</th>
                                    <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 100px;">Nilai</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${renderHasilKerjaRows(skp.details?.utama, skp.realisasi?.utama, feedback.utama)}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- B. Tambahan -->
                    <div style="margin-bottom: 15px;">
                        <h4 style="font-size: 11pt; font-weight: bold; margin-bottom: 8px;">B. Tambahan</h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 11pt;">
                            <thead>
                                <tr style="background-color: #f0f0f0;">
                                    <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 40px;">No</th>
                                    <th style="border: 1px solid #000; padding: 8px; text-align: center;">Kegiatan</th>
                                    <th style="border: 1px solid #000; padding: 8px; text-align: center;">Realisasi</th>
                                    <th style="border: 1px solid #000; padding: 8px; text-align: center;">Umpan Balik</th>
                                    <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 100px;">Nilai</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${renderHasilKerjaRows(skp.details?.tambahan, skp.realisasi?.tambahan, feedback.tambahan)}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Rating Summary -->
                ${skp.predikatAkhir ? `
                <div style="margin: 20px 0; padding: 15px; border: 1px solid #000; background-color: #f9f9f9;">
                    <table style="width: 100%; font-size: 11pt;">
                        <tr>
                            <td style="width: 200px; font-weight: bold;">RATING HASIL KERJA</td>
                            <td>: ${skp.predikatAkhir}</td>
                        </tr>
                    </table>
                </div>
                ` : ''}

                <!-- Signature Section -->
                <div style="margin-top: 50px; display: flex; justify-content: flex-end; page-break-inside: avoid;">
                    <div style="text-align: center; width: 280px;">
                        <p style="font-size: 11pt; margin-bottom: 60px;">
                            ${new Date(skp.realisasiReviewedAt || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
                            Pejabat Penilai Kinerja
                        </p>
                        <p style="font-size: 11pt; font-weight: bold; text-decoration: underline; margin-bottom: 5px;">${evaluatorName}</p>
                        <p style="font-size: 11pt;">NIP. ${evaluatorNIP}</p>
                    </div>
                </div>
            </div>
        `;

        const opt = {
            margin: [10, 10, 10, 10],
            filename: `SKP_${skp.user?.fullName?.replace(/\s+/g, '_')}_${skp.period || skp.year}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    };




    const renderSection = (sectionKey, sectionTitle, planRows, realisasiRows) => {
        if (!planRows || planRows.length === 0) return null;

        // Group rows: numbered row starts a new group, sub-rows (no number) belong to previous group
        const groups = [];
        let mainRowCounter = 0;
        let currentGroup = null;

        planRows.forEach((row, index) => {
            const isMainRow = !row.isSubRow;

            if (isMainRow) {
                mainRowCounter++;
                // Start a new group
                currentGroup = {
                    number: mainRowCounter,
                    rows: [{ ...row, originalIndex: index }],
                    startIndex: index
                };
                groups.push(currentGroup);
            } else if (currentGroup) {
                // Add to current group
                currentGroup.rows.push({ ...row, originalIndex: index });
            } else {
                // Fallback for orphaned first row detection if data is weird
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
            <div key={sectionKey} className="mb-8">
                <h3 className="font-bold text-primary text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    {sectionTitle}
                </h3>

                <div className="border border-t-0 border-blue-300 overflow-x-auto rounded-lg">
                    <table className="w-full border-collapse">
                        <colgroup>
                            <col style={{ width: '40px' }} />
                            <col style={{ width: '38%' }} />
                            <col style={{ width: '27%' }} />
                            <col style={{ width: '25%' }} />
                            <col style={{ width: '10%' }} />
                        </colgroup>
                        <thead>
                            <tr className="bg-blue-100 border-b border-blue-300">
                                <th className="border-r border-blue-300 py-2 px-2 text-xs font-bold text-blue-800 text-center">No</th>
                                <th className="border-r border-blue-300 py-2 px-3 text-xs font-bold text-blue-800 text-left">Kegiatan</th>
                                <th className="border-r border-blue-300 py-2 px-3 text-xs font-bold text-blue-800 text-left">Realisasi</th>
                                <th className="border-r border-blue-300 py-2 px-3 text-xs font-bold text-blue-800 text-left">Umpan Balik</th>
                                <th className="py-2 px-3 text-xs font-bold text-blue-800 text-left">Nilai</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map((group, groupIndex) => {
                                const groupRowCount = group.rows.length;

                                return group.rows.map((row, rowInGroup) => {
                                    const isFirstInGroup = rowInGroup === 0;
                                    const planContent = row.columns?.[0] || '';
                                    const realisasiRow = realisasiRows?.[row.originalIndex] || {};
                                    const feedbackRow = feedback[sectionKey]?.[row.originalIndex] || {};

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

                                            {/* Plan Content */}
                                            <td className="border-r border-blue-200 p-0 align-top">
                                                <div
                                                    className="prose prose-sm max-w-none text-gray-700 p-3 min-h-[60px] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                                                    dangerouslySetInnerHTML={{ __html: planContent }}
                                                />
                                            </td>

                                            {/* Realization - Only show for first row in group, with rowSpan */}
                                            {isFirstInGroup && (
                                                <td
                                                    className="border-r border-blue-200 p-0 align-top"
                                                    rowSpan={groupRowCount}
                                                >
                                                    {/* Use data from the start index of the group */}
                                                    <div
                                                        className="prose prose-sm max-w-none text-gray-700 p-3 min-h-[60px] bg-white h-full [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                                                        dangerouslySetInnerHTML={{
                                                            __html: realisasiRows?.[group.startIndex]?.realisasi || '<span class="text-gray-400 italic">Belum diisi</span>'
                                                        }}
                                                    />
                                                </td>
                                            )}

                                            {/* Feedback - Only show for first row in group, with rowSpan */}
                                            {isFirstInGroup && (
                                                <td
                                                    className="border-r border-blue-200 p-0 align-top"
                                                    rowSpan={groupRowCount}
                                                    style={{ height: '1px' }}
                                                >
                                                    {skp.realisasiStatus === 'Approved' ? (
                                                        <div className="text-sm p-3 min-h-[100px] whitespace-pre-wrap text-gray-700 bg-gray-50/50">
                                                            {feedback[sectionKey]?.[group.startIndex]?.umpanBalik || '-'}
                                                        </div>
                                                    ) : (
                                                        <textarea
                                                            value={feedback[sectionKey]?.[group.startIndex]?.umpanBalik || ''}
                                                            onChange={(e) => handleFeedbackChange(sectionKey, group.startIndex, e.target.value)}
                                                            placeholder="Tuliskan umpan balik..."
                                                            className="w-full h-full p-3 border-0 bg-amber-50 focus:ring-2 focus:ring-amber-200 focus:bg-amber-50/80 outline-none text-sm resize-none block no-print"
                                                            style={{ minHeight: '100px' }}
                                                        />
                                                    )}
                                                    <div className="hidden print:block text-sm p-3 min-h-[100px] whitespace-pre-wrap">
                                                        {feedback[sectionKey]?.[group.startIndex]?.umpanBalik || '-'}
                                                    </div>
                                                </td>
                                            )}

                                            {/* Rating - Only show for first row in group, with rowSpan */}
                                            {isFirstInGroup && (
                                                <td
                                                    className="p-0 align-top"
                                                    rowSpan={groupRowCount}
                                                    style={{ height: '1px' }}
                                                >
                                                    {(() => {
                                                        const currentRatingValue = feedback[sectionKey]?.[group.startIndex]?.rating;
                                                        const selectedOption = RATING_OPTIONS.find(r => r.value === currentRatingValue);
                                                        const RatingIcon = selectedOption ? selectedOption.icon : Star;
                                                        const isApproved = skp.realisasiStatus === 'Approved';

                                                        if (isApproved) {
                                                            return (
                                                                <div className={`text-sm p-3 h-full flex items-center gap-2 ${selectedOption ? selectedOption.bg : 'bg-gray-50/50'}`}>
                                                                    {selectedOption ? (
                                                                        <>
                                                                            <RatingIcon size={16} className={selectedOption.color} />
                                                                            <span className={`font-medium ${selectedOption.color}`}>{selectedOption.label}</span>
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-gray-500">-</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <div className="p-3">
                                                                {currentRatingValue ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                                            const spaceBelow = window.innerHeight - rect.bottom;
                                                                            const showAbove = spaceBelow < 250;
                                                                            setDropdownPos({
                                                                                top: showAbove ? 'auto' : rect.bottom + 8,
                                                                                bottom: showAbove ? window.innerHeight - rect.top + 8 : 'auto',
                                                                                right: window.innerWidth - rect.right
                                                                            });
                                                                            const key = `${sectionKey}-${group.startIndex}`;
                                                                            setOpenDropdown(openDropdown === key ? null : key);
                                                                        }}
                                                                        className={`w-full text-sm flex items-center gap-2 p-2 rounded-lg border transition-all ${selectedOption ? `${selectedOption.bg} ${selectedOption.border}` : 'bg-white border-gray-200'} hover:shadow-sm group`}
                                                                    >
                                                                        {selectedOption && <RatingIcon size={16} className={selectedOption.color} />}
                                                                        <span className={`font-medium ${selectedOption ? selectedOption.color : 'text-gray-700'}`}>
                                                                            {selectedOption ? selectedOption.label : currentRatingValue}
                                                                        </span>
                                                                        <ChevronDown size={14} className={`ml-auto opacity-50 group-hover:opacity-100 ${selectedOption ? selectedOption.color : 'text-gray-400'}`} />
                                                                    </button>
                                                                ) : (
                                                                    <div className="relative no-print">
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                                const spaceBelow = window.innerHeight - rect.bottom;
                                                                                const showAbove = spaceBelow < 250;
                                                                                setDropdownPos({
                                                                                    top: showAbove ? 'auto' : rect.bottom + 8,
                                                                                    bottom: showAbove ? window.innerHeight - rect.top + 8 : 'auto',
                                                                                    right: window.innerWidth - rect.right
                                                                                });
                                                                                const key = `${sectionKey}-${group.startIndex}`;
                                                                                setOpenDropdown(openDropdown === key ? null : key);
                                                                            }}
                                                                            className="w-full inline-flex items-center justify-between gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-primary hover:border-primary hover:bg-purple-50 transition-all text-xs font-medium"
                                                                        >
                                                                            <span className="flex items-center gap-2">
                                                                                <Star size={14} />
                                                                                <span>Beri Nilai</span>
                                                                            </span>
                                                                            <ChevronDown size={14} />
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                {openDropdown === `${sectionKey}-${group.startIndex}` && createPortal(
                                                                    <>
                                                                        <div
                                                                            className="fixed inset-0 z-[9999]"
                                                                            onClick={() => setOpenDropdown(null)}
                                                                        />
                                                                        <div
                                                                            className="fixed z-[9999] bg-white border border-gray-100 rounded-xl shadow-xl min-w-[180px] overflow-hidden p-1 animate-in zoom-in-95 duration-100"
                                                                            style={{
                                                                                top: dropdownPos.top === 'auto' ? 'auto' : `${dropdownPos.top}px`,
                                                                                bottom: dropdownPos.bottom === 'auto' ? 'auto' : `${dropdownPos.bottom}px`,
                                                                                right: `${dropdownPos.right}px`
                                                                            }}
                                                                        >
                                                                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                                                                Pilih Penilaian
                                                                            </div>
                                                                            {RATING_OPTIONS.map((option) => {
                                                                                const Icon = option.icon;
                                                                                const isSelected = currentRatingValue === option.value;
                                                                                return (
                                                                                    <button
                                                                                        key={option.value}
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            handleRatingChange(sectionKey, group.startIndex, option.value);
                                                                                            setOpenDropdown(null);
                                                                                        }}
                                                                                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all flex items-center gap-3 mb-0.5
                                                                                            ${isSelected ? `${option.bg} ${option.color} font-medium` : `text-gray-600 hover:bg-gray-50`}
                                                                                        `}
                                                                                    >
                                                                                        <div className={`p-1.5 rounded-full ${isSelected ? 'bg-white/50' : 'bg-gray-100 group-hover:bg-white'}`}>
                                                                                            <Icon size={14} className={isSelected ? option.color : 'text-gray-500'} />
                                                                                        </div>
                                                                                        {option.label}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </>,
                                                                    document.body
                                                                )}
                                                                <div className="hidden print:block text-sm mt-1 p-2">
                                                                    {currentRatingValue || '-'}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
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

    if (!skp) {
        return (
            <div className="text-center py-16">
                <p className="text-gray-500">SKP tidak ditemukan</p>
            </div>
        );
    }

    return (
        <div id="print-area" className="max-w-6xl mx-auto space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate(returnTo)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors no-print"
            >
                <ArrowLeft size={18} />
                <span>Kembali</span>
            </button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Review Realisasi SKP</h1>
                    <p className="text-gray-500 mt-1">Periode: {skp.period}</p>
                </div>
                <div className="flex gap-2 no-print">
                    <Button
                        variant="outline"
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2"
                    >
                        <Download size={16} />
                        Download PDF
                    </Button>
                </div>
            </div>

            {/* User Info Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                        {skp.user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-gray-900">{skp.user?.fullName}</h2>
                        <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <User size={14} />
                                NIP. {skp.user?.identityNumber || '-'}
                            </span>
                            <span className="flex items-center gap-1">
                                <Building2 size={14} />
                                {skp.user?.departmentName || '-'}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                Dikirim: {skp.realisasiSubmittedAt ? new Date(skp.realisasiSubmittedAt).toLocaleDateString('id-ID') : '-'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sections */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FileText size={20} className="text-primary" />
                    Hasil Kerja
                </h2>

                {renderSection('utama', 'A. Utama', skp.details?.utama, skp.realisasi?.utama)}
                {renderSection('tambahan', 'B. Tambahan', skp.details?.tambahan, skp.realisasi?.tambahan)}
            </div>

            {/* PERILAKU KERJA SECTION (DYNAMIC) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full relative">
                {/* Sticky Header with Title and Toolbar */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-20 py-3 mb-2 border-b border-gray-100 transition-all">
                    <div className="flex justify-between items-center gap-4 min-h-[42px]">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 shrink-0">
                            <User size={20} className="text-primary" />
                            Perilaku Kerja
                        </h2>

                        {/* Toolbar - Only visible if active editor in this section */}
                        {activeEditor && activeSection === 'perilaku' && canEditPerilaku && (
                            <div className="animate-in slide-in-from-right-2 duration-200">
                                <Toolbar editor={activeEditor} />
                            </div>
                        )}
                    </div>
                </div>

                <SKPSection
                    title="Perilaku Kerja"
                    rows={perilakuRows}
                    onChange={(newRows) => setPerilakuRows(newRows)}
                    onEditorFocus={setActiveEditor}
                    readOnly={!canEditPerilaku}
                    showNumbers={true}
                    isActiveSection={activeSection === 'perilaku'}
                    onSectionActive={() => setActiveSection('perilaku')}
                    columnHeaders={['Perilaku Kerja', 'Ekspektasi Khusus']}
                    isPerilakuMode={true}
                />
            </div>

            {/* Action Button */}
            <div className="flex justify-end items-center pt-4 border-t border-gray-100 no-print">
                <div className="flex gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(returnTo)}
                    >
                        {skp.realisasiStatus === 'Approved' ? 'Kembali' : 'Batal'}
                    </Button>

                    {skp.realisasiStatus !== 'Approved' && (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleSubmitReview}
                                isLoading={isSubmitting}
                                className="flex items-center gap-2"
                            >
                                <CheckCircle size={16} />
                                Simpan & Review (Belum Final)
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleFinalizeClick}
                                isLoading={isSubmitting}
                                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-none shadow-md shadow-emerald-200 transition-all hover:shadow-lg hover:shadow-emerald-300 transform hover:-translate-y-0.5"
                            >
                                <Lock size={16} />
                                Setujui & Finalisasi
                            </Button>
                        </>
                    )}
                </div>
            </div>
            {/* Finalize Confirmation Dialog */}
            {showFinalDialog && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Lock size={18} className="text-emerald-600" />
                                Konfirmasi Finalisasi
                            </h3>
                            <button
                                onClick={() => setShowFinalDialog(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            <div className="flex gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800">
                                <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                                <div className="text-sm">
                                    <p className="font-semibold mb-1">Perhatian!</p>
                                    <p>Tindakan ini tidak dapat dibatalkan. Pastikan semua penilaian dan umpan balik sudah sesuai.</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-gray-700">Predikat Akhir SKP</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {RATING_OPTIONS.map((option) => {
                                        const Icon = option.icon;
                                        const isSelected = finalRating === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => setFinalRating(option.value)}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${isSelected
                                                    ? `${option.border} ${option.bg} ring-1 ring-offset-1 ${option.ring}`
                                                    : 'border-transparent bg-gray-50 hover:bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                <div className={`p-2 rounded-full ${isSelected ? 'bg-white' : 'bg-gray-200'} transition-colors`}>
                                                    <Icon size={18} className={isSelected ? option.color : 'text-gray-500'} />
                                                </div>
                                                <span className={`font-semibold ${isSelected ? option.color : 'text-gray-600'}`}>
                                                    {option.label}
                                                </span>
                                                {isSelected && <CheckCircle size={18} className={`ml-auto ${option.color}`} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => setShowFinalDialog(false)}
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={onConfirmFinalize}
                                isLoading={isSubmitting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 border-none"
                            >
                                <Lock size={16} className="mr-2" />
                                Ya, Finalisasi SKP
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ReviewRealisasi;
