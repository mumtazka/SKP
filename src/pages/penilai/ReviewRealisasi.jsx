import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import { toast } from 'sonner';
import { debounce } from 'lodash';
import {
    ArrowLeft,
    CheckCircle,
    MessageSquare,
    User,
    Calendar,
    Building2,
    Send,
    FileText,
    TrendingUp,
    Printer,
    Download,
    Lock,
    Star,
    XCircle,
    AlertTriangle,
    ThumbsUp,
    ChevronDown,
    X,
    Save
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import SKPSection from '../dosen/components/SKPSection';
import Toolbar from '@/pages/dosen/components/Toolbar';
import DynamicDistributionChart from './components/DynamicDistributionChart';
import { generateSKPFullPDF } from '@/utils/generateSKPFullPDF';
import { usePeriod } from '@/context/PeriodContext';

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

const INITIAL_PERILAKU = [
    { id: 1, columns: ['', ''], isSubRow: false, rowSpans: [1, 2] },
    { id: 2, columns: ['', ''], isSubRow: true, parentId: 1, colHiddens: [1] }
];

const ReviewRealisasi = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { periodConfig } = usePeriod();

    const [skp, setSkp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State to store the REAL official evaluator from user master data
    const [officialEvaluator, setOfficialEvaluator] = useState(null);

    // Draft Logic for Perilaku Kerja - Scoped by SKP ID
    const [perilakuRows, setPerilakuRows] = useState(INITIAL_PERILAKU);
    const [savingStatus, setSavingStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'

    // DB Auto-save logic
    const savePerilakuToDb = useCallback(
        debounce(async (rows, skpId, currentRealisasi) => {
            if (!skpId) return;
            try {
                // Save Perilaku data INSIDE realisasi JSON bucket
                const updatedRealisasi = { ...currentRealisasi, perilaku: rows };
                await api.skps.update(skpId, {
                    realisasi: updatedRealisasi
                });
                setSavingStatus('saved');
                setTimeout(() => setSavingStatus('idle'), 2000);
            } catch (error) {
                console.error("Auto-save failed:", error);
                setSavingStatus('error');
            }
        }, 1000),
        []
    );

    const handlePerilakuChange = (newRows) => {
        setPerilakuRows(newRows);
        setSavingStatus('saving');
        // Pass current skp.realisasi (or empty object if null) to properly merge
        savePerilakuToDb(newRows, id, skp?.realisasi || {});
    };

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

            // Fetch Official Evaluator from User Master Data
            if (data.userId) {
                try {
                    const userDetail = await api.users.getById(data.userId);

                    // Logic: ID Penilai tersimpan di dalam object `raters`
                    const raterId = userDetail.raters?.pejabatPenilaiId;

                    if (raterId) {
                        const raterDetail = await api.users.getById(raterId);
                        setOfficialEvaluator(raterDetail);
                    } else {
                        // Fallback mechanism if structure differs
                        const realEvaluator = userDetail.evaluator || userDetail.penilai || userDetail.pejabatPenilai || null;
                        setOfficialEvaluator(realEvaluator);
                    }
                } catch (err) {
                    console.warn("Could not fetch official evaluator for user:", err);
                }
            }

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

            // Load Perilaku from Realisasi JSON bucket
            const savedPerilaku = data.realisasi?.perilaku;
            if (savedPerilaku && Array.isArray(savedPerilaku) && savedPerilaku.length > 0) {
                setPerilakuRows(savedPerilaku);
            } else {
                setPerilakuRows(INITIAL_PERILAKU);
            }

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

            // Ensure perilaku is saved inside realisasi
            updatedRealisasi.perilaku = perilakuRows;

            await api.skps.update(skp.id, {
                realisasi: updatedRealisasi,
                // perilaku: perilakuRows, // Removed direct mapping
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

            // Ensure perilaku is saved inside realisasi
            updatedRealisasi.perilaku = perilakuRows;

            await api.skps.update(skp.id, {
                realisasi: updatedRealisasi,
                // perilaku: perilakuRows, // Removed direct mapping
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

        // 1. Logic Evaluator Data (Fix)
        // Prioritaskan data yang tersimpan di SKP (snapshot/relation) daripada current user
        let evaluatorSource = {};

        if (officialEvaluator && (officialEvaluator.fullName || officialEvaluator.nama)) {
            evaluatorSource = officialEvaluator;
        } else if (skp.pejabatPenilai && skp.pejabatPenilai.fullName) {
            evaluatorSource = skp.pejabatPenilai;
        } else if (skp.evaluator && skp.evaluator.fullName) {
            evaluatorSource = skp.evaluator;
        } else if (isReviewer) {
            evaluatorSource = user;
        }

        const evaluatorName = evaluatorSource.fullName || (skp.pejabatPenilai?.nama || "_______________________");
        const evaluatorNIP = evaluatorSource.identityNumber || (skp.pejabatPenilai?.nip || "...................");
        const evaluatorJabatan = evaluatorSource.jabatan || (skp.pejabatPenilai?.jabatan || "Pejabat Penilai Kinerja");
        const evaluatorPangkat = evaluatorSource.pangkat || "-";
        const evaluatorUnit = evaluatorSource.departmentName || (skp.pejabatPenilai?.unitKerja || "-");

        // Helper strip HTML
        const stripHtml = (html) => {
            if (!html) return '-';
            const tmp = document.createElement("DIV");
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || '-';
        };

        // 2. Determine Distribution Template (Based on Dominant Rating)
        const counts = {
            'Sangat Kurang': 0,
            'Kurang/Misconduct': 0,
            'Butuh Perbaikan': 0,
            'Baik': 0,
            'Sangat Baik': 0
        };

        const allItems = [
            ...(skp.realisasi?.utama || []),
            ...(skp.realisasi?.tambahan || [])
        ];

        allItems.forEach(item => {
            if (!item || !item.rating) return;
            const r = item.rating.toLowerCase();
            if (r.includes('sangat buruk') || r.includes('sangat kurang')) counts['Sangat Kurang']++;
            else if (r.includes('buruk') || r.includes('kurang') || r.includes('misconduct')) counts['Kurang/Misconduct']++;
            else if (r.includes('cukup') || r.includes('butuh perbaikan')) counts['Butuh Perbaikan']++;
            else if (r.includes('sangat baik')) counts['Sangat Baik']++;
            else if (r.includes('baik')) counts['Baik']++;
        });

        // Helper to format NIP to avoid "NIP. NIP. ..."
        const formatNIP = (nip) => {
            if (!nip) return '-';
            return nip.toString().replace(/^(NIP\.?|NIP|nip\.?|nip)\s*/i, '').trim();
        };

        const signatureDate = skp.approvedAt
            ? new Date(skp.approvedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
            : (skp.realisasiReviewedAt
                ? new Date(skp.realisasiReviewedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));

        let dominantCategory = 'Baik';
        let maxCount = -1;
        Object.entries(counts).forEach(([cat, count]) => {
            if (count > maxCount) {
                maxCount = count;
                dominantCategory = cat;
            }
        });

        // Path Templates (Adjusted for PDF SVG Width 500, Height 120, Baseline 100)
        const templates = {
            'Sangat Baik': {
                // J-Curve Strict
                path: "M50,100 C350,100 420,80 450,10",
                fill: "M50,100 C350,100 420,80 450,10 L450,100 L50,100 Z"
            },
            'Baik': {
                // Skewed Right Bell
                path: "M50,100 C250,100 300,20 350,20 C400,20 450,80 450,80",
                fill: "M50,100 C250,100 300,20 350,20 C400,20 450,80 450,80 L450,100 L50,100 Z"
            },
            'Butuh Perbaikan': {
                // Normal Bell
                path: "M50,100 C80,100 150,20 250,20 C350,20 420,100 450,100",
                fill: "M50,100 C80,100 150,20 250,20 C350,20 420,100 450,100 L450,100 L50,100 Z"
            },
            'Kurang/Misconduct': {
                // Skewed Left Bell
                path: "M50,80 C50,80 100,20 150,20 C200,20 250,100 450,100",
                fill: "M50,80 C50,80 100,20 150,20 C200,20 250,100 450,100 L450,100 L50,100 Z"
            },
            'Sangat Kurang': {
                // Convex Exponential Decay
                path: "M50,10 C80,80 180,100 450,100",
                fill: "M50,10 C80,80 180,100 450,100 L450,100 L50,100 Z"
            }
        };

        const template = templates[dominantCategory] || templates['Baik'];

        const pathD = template.path;
        const fillPathD = template.fill;
        const points = [
            { x: 50, val: counts['Sangat Kurang'] },
            { x: 150, val: counts['Kurang/Misconduct'] },
            { x: 250, val: counts['Butuh Perbaikan'] },
            { x: 350, val: counts['Baik'] },
            { x: 450, val: counts['Sangat Baik'] }
        ];

        const svgWidth = 500;
        const svgHeight = 120;
        const graphBottomY = 100;

        // Render Hasil Kerja Rows
        const renderHasilKerjaRows = (planRows, realisasiRows, feedbackData) => {
            if (!planRows || planRows.length === 0) {
                return '<tr><td colspan="4" style="text-align: center; padding: 12px;">Tidak ada data</td></tr>';
            }

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
                let planContentHTML = '';
                const mainRow = group.rows[0];
                const mainText = stripHtml(mainRow.columns?.[0] || '');
                planContentHTML += `<div style="margin-bottom: 8px;">1. ${mainText}</div>`;

                if (group.rows.length > 1) {
                    planContentHTML += `<div style="margin-bottom: 4px;">Ukuran keberhasilan / Indikator Kinerja Individu, dan Target:</div>`;
                    planContentHTML += `<ul style="margin: 0; padding-left: 20px; list-style-type: disc;">`;
                    for (let i = 1; i < group.rows.length; i++) {
                        const subRow = group.rows[i];
                        const subText = stripHtml(subRow.columns?.[0] || '');
                        planContentHTML += `<li>${subText}</li>`;
                    }
                    planContentHTML += `</ul>`;
                }

                const realisasiText = realisasiRows?.[group.startIndex]?.realisasi || '-';
                // Try to detect if realisasi is HTML or plain text
                const formattedRealisasi = realisasiText;

                const umpanBalikText = feedbackData?.[group.startIndex]?.umpanBalik || '-';

                return `
                    <tr>
                        <td style="border: 1px solid #000; padding: 5px; text-align: center; vertical-align: top; width: 30px;">${group.number}</td>
                        <td style="border: 1px solid #000; padding: 5px; vertical-align: top;">${planContentHTML}</td>
                        <td style="border: 1px solid #000; padding: 5px; vertical-align: top;">${formattedRealisasi}</td>
                        <td style="border: 1px solid #000; padding: 5px; vertical-align: top;">${umpanBalikText}</td>
                    </tr>
                `;
            }).join('');
        };

        const renderPerilakuRows = (rows) => {
            if (!rows || rows.length === 0) return '<tr><td colspan="3" style="text-align: center;">Tidak ada data</td></tr>';
            let html = '';
            let mainRowNumber = 0;
            rows.forEach((row) => {
                const isMain = !row.isSubRow;
                const col0 = stripHtml(row.columns?.[0] || '');
                const col1 = stripHtml(row.columns?.[1] || '');
                if (isMain) {
                    mainRowNumber++;
                    const rowSpan = row.rowSpans?.[1] || 1;
                    html += `<tr>
                        <td style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: top; width: 40px;">${mainRowNumber}</td>
                        <td style="border: 1px solid #000; padding: 8px; vertical-align: top; font-weight: bold;">${col0}</td>
                        <td rowspan="${rowSpan}" style="border: 1px solid #000; padding: 8px; vertical-align: top;">${col1}</td>
                    </tr>`;
                } else {
                    const isCol1Hidden = row.colHiddens?.includes(1);
                    html += `<tr>
                        <td style="border: 1px solid #000; padding: 8px;"></td>
                        <td style="border: 1px solid #000; padding: 8px; vertical-align: top; padding-left: 20px;">- ${col0}</td>
                        ${!isCol1Hidden ? `<td style="border: 1px solid #000; padding: 8px; vertical-align: top;">${col1}</td>` : ''}
                    </tr>`;
                }
            });
            return html;
        };

        const currentYear = new Date().getFullYear();
        const startPeriod = `01 Januari ${skp.year || currentYear}`;
        const endPeriod = `31 Desember ${skp.year || currentYear}`;

        const element = document.createElement('div');
        element.innerHTML = `
            <style>
                @page { size: A4; margin: 10mm 15mm 10mm 15mm; }
                body { font-family: 'Times New Roman', Times, serif; color: #000; line-height: 1.3; font-size: 10pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 10px; page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
                td, th { border: 1px solid #000; padding: 6px 8px !important; vertical-align: top; word-wrap: break-word; }
                .text-bold { font-weight: bold; }
                .text-center { text-align: center; }
                .signature-section { display: flex; justify-content: space-between; page-break-inside: avoid; margin-top: 30px; }
                table.no-border td { border: none !important; padding: 1px !important; }
            </style>
            <div style="font-family: 'Times New Roman', Times, serif; color: #000; line-height: 1.3; font-size: 10pt;">
                
                <!-- HEADER -->
                <div style="margin-bottom: 20px; position: relative;">
                    <div style="position: absolute; left: 0; top: 0; font-size: 10pt;">
                        Kementerian Pendidikan Tinggi, Sains dan Teknologi
                    </div>
                     <div style="text-align: right; font-size: 10pt;">
                        Periode: ${startPeriod} s/d ${endPeriod}
                    </div>
                </div>

                <div style="text-align: center; margin-bottom: 20px; clear: both;">
                    <h2 style="font-size: 12pt; font-weight: bold; margin: 0;">EVALUASI KINERJA PEGAWAI</h2>
                    <h3 style="font-size: 12pt; font-weight: bold; margin: 0;">PENDEKATAN HASIL KERJA KUALITATIF</h3>
                    <h3 style="font-size: 12pt; font-weight: bold; margin: 0;">BAGI PEJABAT ADMINISTRASI / FUNGSIONAL</h3>
                    <p style="font-size: 11pt; margin: 5px 0 0 0;">PERIODE: TRIWULAN I/II/III/IV-AKHIR*</p>
                </div>

                <!-- INFO TABLE -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 5px; border: 1px solid #000;">
                    <thead>
                        <tr>
                            <th style="width: 50%; border: 1px solid #000; padding: 4px; text-align: center;">Pegawai yang Dinilai</th>
                            <th style="width: 50%; border: 1px solid #000; padding: 4px; text-align: center;">Pejabat Penilai Kinerja</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #000; padding: 5px; vertical-align: top;">
                                <table class="no-border" style="width: 100%; border: none; font-size: 10pt;">
                                    <tr><td style="width: 20px;">1.</td><td style="width: 90px;">Nama</td><td>: ${skp.user?.fullName || '-'}</td></tr>
                                    <tr><td>2.</td><td>NIP</td><td>: ${formatNIP(skp.user?.identityNumber)}</td></tr>
                                    <tr><td>3.</td><td>Pangkat / Gol.</td><td>: ${skp.user?.pangkat || '-'}</td></tr>
                                    <tr><td>4.</td><td>Jabatan</td><td>: ${skp.user?.jabatan || '-'}</td></tr>
                                    <tr><td>5.</td><td>Unit Kerja</td><td>: ${skp.user?.departmentName || '-'}</td></tr>
                                </table>
                            </td>
                            <td style="border: 1px solid #000; padding: 5px; vertical-align: top;">
                                <table class="no-border" style="width: 100%; border: none; font-size: 10pt;">
                                    <tr><td style="width: 20px;">1.</td><td style="width: 90px;">Nama</td><td>: ${evaluatorName}</td></tr>
                                    <tr><td>2.</td><td>NIP</td><td>: ${formatNIP(evaluatorNIP)}</td></tr>
                                    <tr><td>3.</td><td>Pangkat / Gol.</td><td>: ${evaluatorPangkat}</td></tr>
                                    <tr><td>4.</td><td>Jabatan</td><td>: ${evaluatorJabatan}</td></tr>
                                    <tr><td>5.</td><td>Unit Kerja</td><td>: ${evaluatorUnit}</td></tr>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- CAPAIAN ORG -->
                <div style="border: 1px solid #000; border-top: none; padding: 5px 10px; margin-bottom: 0;">
                    <span style="font-weight: bold;">CAPAIAN KINERJA ORGANISASI:</span> ${skp.predikatAkhir || 'BAIK'}
                </div>

                <!-- DYNAMIC CHART SVG -->
                <div style="border: 1px solid #000; border-top: none; padding: 10px; margin-bottom: 20px; height: 180px; position: relative;">
                    <div style="font-weight: bold; margin-bottom: 5px;">POLA DISTRIBUSI:</div>
                    
                    <div style="display: flex; justify-content: center; align-items: flex-end; height: 120px; padding-bottom: 20px;">
                        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" style="overflow: visible;">
                            <!-- X Axis -->
                            <line x1="0" y1="${graphBottomY}" x2="${svgWidth}" y2="${graphBottomY}" stroke="black" stroke-width="1" />
                            
                            <!-- Area Fill -->
                             <path d="${fillPathD}" fill="#ecfdf5" opacity="0.5" />

                            <!-- Curve -->
                            <path d="${pathD}" fill="none" stroke="black" stroke-width="2" />
                            
                            <!-- Labels -->
                            <text x="${points[0].x}" y="${graphBottomY + 15}" font-family="Times New Roman" font-size="10" text-anchor="middle">Sangat</text>
                            <text x="${points[0].x}" y="${graphBottomY + 25}" font-family="Times New Roman" font-size="10" text-anchor="middle">Kurang</text>
                            
                            <text x="${points[1].x}" y="${graphBottomY + 15}" font-family="Times New Roman" font-size="10" text-anchor="middle">Kurang/</text>
                            <text x="${points[1].x}" y="${graphBottomY + 25}" font-family="Times New Roman" font-size="10" text-anchor="middle">Misconduct</text>
                            
                            <text x="${points[2].x}" y="${graphBottomY + 15}" font-family="Times New Roman" font-size="10" text-anchor="middle">Butuh</text>
                            <text x="${points[2].x}" y="${graphBottomY + 25}" font-family="Times New Roman" font-size="10" text-anchor="middle">Perbaikan</text>
                            
                            <text x="${points[3].x}" y="${graphBottomY + 15}" font-family="Times New Roman" font-size="10" text-anchor="middle">Baik</text>
                             
                            <text x="${points[4].x}" y="${graphBottomY + 15}" font-family="Times New Roman" font-size="10" text-anchor="middle">Sangat Baik</text>
                            
                            <text x="250" y="${graphBottomY + 45}" font-family="Times New Roman" font-size="10" text-anchor="middle">Predikat Kinerja Pegawai</text>

                             <!-- Count Markers Removed for cleaner look -->

                        </svg>
                    </div>
                </div>

                <!-- HASIL KERJA TITLE -->
                <div style="font-weight: bold; font-size: 11pt; margin-bottom: 5px; border: 1px solid #000; padding: 5px; background-color: #f0f0f0; border-bottom: none;">
                    HASIL KERJA
                </div>

                <!-- UTAMA -->
                <div style="border: 1px solid #000; padding: 5px 10px; font-weight: bold; border-bottom: none;">A. Utama</div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 0; border: 1px solid #000;">
                    <thead>
                        <tr>
                            <th style="border: 1px solid #000; padding: 5px; width: 30px;">No</th>
                            <th style="border: 1px solid #000; padding: 5px;">Rencana Hasil Kerja</th>
                            <th style="border: 1px solid #000; padding: 5px;">Realisasi Berdasarkan Bukti Dukung</th>
                            <th style="border: 1px solid #000; padding: 5px;">Umpan Balik Berkelanjutan Berdasarkan Bukti Dukung</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderHasilKerjaRows(skp.details?.utama, skp.realisasi?.utama, feedback.utama)}
                    </tbody>
                </table>

                <!-- TAMBAHAN -->
                ${skp.details?.tambahan && skp.details.tambahan.length > 0 ? `
                    <div style="border: 1px solid #000; border-top: none; padding: 5px 10px; font-weight: bold;">B. Tambahan</div>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #000; border-top: none;">
                        <thead>
                            <tr>
                                <th style="border: 1px solid #000; padding: 5px; width: 30px;">No</th>
                                <th style="border: 1px solid #000; padding: 5px;">Rencana Hasil Kerja</th>
                                <th style="border: 1px solid #000; padding: 5px;">Realisasi Berdasarkan Bukti Dukung</th>
                                <th style="border: 1px solid #000; padding: 5px;">Umpan Balik Berkelanjutan Berdasarkan Bukti Dukung</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderHasilKerjaRows(skp.details?.tambahan, skp.realisasi?.tambahan, feedback.tambahan)}
                        </tbody>
                    </table>
                ` : '<div style="margin-bottom: 20px;"></div>'}

                 <!-- PERILAKU KERJA -->
                <div style="margin-bottom: 20px;">
                    <h3 style="font-size: 12pt; font-weight: bold; margin-bottom: 15px;">PERILAKU KERJA</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 11pt;">
                        <thead>
                            <tr style="background-color: #f0f0f0;">
                                <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 40px;">No</th>
                                <th style="border: 1px solid #000; padding: 8px; text-align: center;">Perilaku Kerja</th>
                                <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 35%;">Ekspektasi Khusus</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderPerilakuRows(perilakuRows)}
                        </tbody>
                    </table>
                </div>

                <!-- RATING FINAL -->
                 <div style="margin-bottom: 20px;"></div>
                 <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 10pt; page-break-inside: avoid;">
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px; width: 300px; font-weight: bold; background-color: #f0f0f0;">
                            RATING PERILAKU
                        </td>
                        <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">
                             Diatas Ekspektasi
                        </td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px; width: 300px; font-weight: bold; background-color: #f0f0f0;">
                            PREDIKAT KINERJA PEGAWAI
                        </td>
                        <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">
                             ${skp.predikatAkhir || 'BAIK'}
                        </td>
                    </tr>
                 </table>
                
                <!-- SIGNATURE -->
                <div class="signature-section">
                    <div class="signature-box">
                        <div style="margin-bottom: 70px;">
                            <br/>
                            Pegawai yang Dinilai,
                        </div>
                        <div style="font-weight: bold; text-decoration: underline;">${skp.user?.fullName || ''}</div>
                        <div>NIP. ${formatNIP(skp.user?.identityNumber)}</div>
                    </div>
                    <div class="signature-box">
                        <div style="margin-bottom: 70px;">
                            Yogyakarta, ${signatureDate}
                            <br/>
                            Pejabat Penilai Kinerja,
                        </div>
                        <div style="font-weight: bold; text-decoration: underline;">${evaluatorName}</div>
                        <div>NIP. ${formatNIP(evaluatorNIP)}</div>
                    </div>
                </div>

            </div>
        `;

        const opt = {
            margin: [10, 15, 10, 15],
            filename: `Evaluasi_Kinerja_${skp.user?.fullName?.replace(/\s+/g, '_')}_${skp.period || skp.year}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        toast.promise(
            html2pdf().set(opt).from(element).save(),
            {
                loading: 'Sedang membuat PDF...',
                success: 'PDF berhasil diunduh!',
                error: 'Gagal membuat PDF'
            }
        );
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
                    <div className="relative group">
                        <Button
                            variant="outline"
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2"
                        >
                            <Download size={16} />
                            Download Evaluasi
                        </Button>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => {
                            toast.promise(
                                generateSKPFullPDF(skp, {
                                    evaluator: officialEvaluator,
                                    periodConfig,
                                    feedback,
                                    perilakuRows
                                }),
                                {
                                    loading: 'Membuat PDF lengkap...',
                                    success: 'PDF lengkap berhasil diunduh!',
                                    error: 'Gagal membuat PDF'
                                }
                            );
                        }}
                        className="flex items-center gap-2"
                    >
                        <FileText size={16} />
                        Download Full PDF
                    </Button>
                </div>
            </div>

            {/* User & Evaluator Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pegawai Card */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-purple-50 px-6 py-3 border-b border-purple-100">
                        <h3 className="font-bold text-purple-700 text-sm flex items-center gap-2">
                            <User size={16} />
                            Pegawai yang Dinilai
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                            <div className="text-gray-500 font-medium">Nama</div>
                            <div className="text-gray-900 font-bold">{skp.user?.fullName || '-'}</div>

                            <div className="text-gray-500 font-medium">NIP</div>
                            <div className="text-gray-900">{skp.user?.identityNumber || '-'}</div>

                            <div className="text-gray-500 font-medium">Pangkat/Gol.</div>
                            <div className="text-gray-900">{skp.user?.pangkat || '-'}</div>

                            <div className="text-gray-500 font-medium">Jabatan</div>
                            <div className="text-gray-900">{skp.user?.jabatan || '-'}</div>

                            <div className="text-gray-500 font-medium">Unit Kerja</div>
                            <div className="text-gray-900">{skp.user?.departmentName || '-'}</div>
                        </div>
                        <div className="pt-4 mt-4 border-t border-gray-50 text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={12} />
                            Dikirim: {skp.realisasiSubmittedAt ? new Date(skp.realisasiSubmittedAt).toLocaleDateString('id-ID') : '-'}
                        </div>
                    </div>
                </div>

                {/* Pejabat Penilai Card */}
                {(() => {
                    const penilai = officialEvaluator || skp.pejabatPenilai || skp.evaluator || {};
                    return (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="bg-purple-50 px-6 py-3 border-b border-purple-100">
                                <h3 className="font-bold text-purple-700 text-sm flex items-center gap-2">
                                    <User size={16} />
                                    Pejabat Penilai Kinerja
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                                    <div className="text-gray-500 font-medium">Nama</div>
                                    <div className="text-gray-900 font-bold">{penilai.fullName || penilai.nama || '-'}</div>

                                    <div className="text-gray-500 font-medium">NIP</div>
                                    <div className="text-gray-900">{penilai.identityNumber || penilai.nip || '-'}</div>

                                    <div className="text-gray-500 font-medium">Pangkat/Gol.</div>
                                    <div className="text-gray-900">{penilai.pangkat || '-'}</div>

                                    <div className="text-gray-500 font-medium">Jabatan</div>
                                    <div className="text-gray-900">{penilai.jabatan || '-'}</div>

                                    <div className="text-gray-500 font-medium">Unit Kerja</div>
                                    <div className="text-gray-900">{penilai.departmentName || penilai.unitKerja || '-'}</div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Distribution Curve Visualization (Dynamic) */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700">CAPAIAN KINERJA ORGANISASI:</span>
                        <span className={`font-bold px-3 py-1 rounded-full text-sm ${(skp.predikatAkhir || 'BAIK').toUpperCase() === 'SANGAT BAIK' || (skp.predikatAkhir || 'BAIK').toUpperCase() === 'ISTIMEWA' ? 'bg-primary/10 text-primary' :
                            (skp.predikatAkhir || 'BAIK').toUpperCase() === 'BAIK' ? 'bg-blue-100 text-blue-700' :
                                (skp.predikatAkhir || 'BAIK').toUpperCase() === 'BUTUH PERBAIKAN' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                            }`}>
                            {(skp.predikatAkhir || 'BAIK').toUpperCase()}
                        </span>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-gray-500" />
                        POLA DISTRIBUSI
                    </h3>

                    <DynamicDistributionChart skp={skp} />

                    <div className="text-center mt-4 text-xs text-gray-400">
                        *Grafik menampilkan frekuensi rating dari setiap item kegiatan berdasarkan data riil.
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

                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-primary text-sm uppercase tracking-wide flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        Perilaku Kerja
                    </h3>
                    <div className="text-xs font-medium text-gray-500">
                        {savingStatus === 'saving' && <span className="text-blue-600 animate-pulse">Menyimpan...</span>}
                        {savingStatus === 'saved' && <span className="text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Tersimpan</span>}
                        {savingStatus === 'error' && <span className="text-red-500">Gagal menyimpan</span>}
                    </div>
                </div>
                <SKPSection
                    title="" // Empty title because we rendered custom header above
                    rows={perilakuRows}
                    onChange={handlePerilakuChange}
                    onEditorFocus={setActiveEditor}
                    readOnly={!canEditPerilaku}
                    showNumbers={true}
                    isActiveSection={activeSection === 'perilaku'}
                    onSectionActive={() => setActiveSection('perilaku')}
                    columnHeaders={['Perilaku Kerja', 'Ekspektasi Khusus']}
                    isPerilakuMode={true}
                />
            </div>

            {/* Lampiran Section (Read Only) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FileText size={20} className="text-primary" />
                    Lampiran Sasaran Kinerja Pegawai
                </h2>

                {/* C.1 Dukungan Sumber Daya */}
                <div className="mb-4">
                    <SKPSection
                        title="1. Dukungan Sumber Daya"
                        rows={skp.details?.dukungan}
                        readOnly={true}
                        simpleRow={true}
                        showNumbers={true}
                        columnHeaders={['Dukungan Sumber Daya']}
                    />
                </div>
                {/* C.2 Skema Pertanggungjawaban */}
                <div className="mb-4">
                    <SKPSection
                        title="2. Skema Pertanggungjawaban"
                        rows={skp.details?.skema}
                        readOnly={true}
                        simpleRow={true}
                        showNumbers={true}
                        columnHeaders={['Skema Pertanggungjawaban']}
                    />
                </div>
                {/* C.3 Konsekuensi */}
                <div className="mb-4">
                    <SKPSection
                        title="3. Konsekuensi"
                        rows={skp.details?.konsekuensi}
                        readOnly={true}
                        simpleRow={true}
                        showNumbers={true}
                        columnHeaders={['Konsekuensi']}
                    />
                </div>
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
