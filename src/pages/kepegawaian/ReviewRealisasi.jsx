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
    Star
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

const ReviewRealisasi = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [skp, setSkp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    const returnTo = location.state?.returnTo || '/kepegawaian/evaluations';

    useEffect(() => {
        loadSkp();
    }, [id]);

    const loadSkp = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await api.skps.getById(id);
            setSkp(data);

            // Initialize feedback from existing realisasi data
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
            if (!updated[sectionKey]) {
                updated[sectionKey] = [];
            }
            if (!updated[sectionKey][rowIndex]) {
                updated[sectionKey][rowIndex] = { id: rowIndex, umpanBalik: '', rating: '' };
            }
            updated[sectionKey][rowIndex] = {
                ...updated[sectionKey][rowIndex],
                umpanBalik: value
            };
            return updated;
        });
    };

    const handleRatingChange = (sectionKey, rowIndex, value) => {
        setFeedback(prev => {
            const updated = { ...prev };
            if (!updated[sectionKey]) {
                updated[sectionKey] = [];
            }
            if (!updated[sectionKey][rowIndex]) {
                updated[sectionKey][rowIndex] = { id: rowIndex, umpanBalik: '', rating: '' };
            }
            updated[sectionKey][rowIndex] = {
                ...updated[sectionKey][rowIndex],
                rating: value
            };
            return updated;
        });
    };

    const handleSubmitReview = async () => {
        if (!skp) return;

        setIsSubmitting(true);
        try {
            // Merge feedback into realisasi data
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



    const handleFinalize = async () => {
        if (!skp) return;
        if (!confirm('Apakah anda yakin ingin MEMFINALISASI SKP ini? SKP yang sudah difinalisasi tidak dapat diubah lagi.')) return;

        setIsSubmitting(true);
        try {
            // Update same as review but set status to Approved
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
                realisasiStatus: 'Approved', // Final status
                realisasiReviewedAt: new Date().toISOString(),
                realisasiReviewerId: user.id
            });

            toast.success('SKP berhasil difinalisasi!');
            navigate(returnTo);
        } catch (error) {
            console.error('Failed to finalize:', error);
            toast.error('Gagal memfinalisasi SKP');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadPDF = () => {
        const element = document.getElementById('print-area');
        const opt = {
            margin: [10, 10, 10, 10], // top, left, bottom, right
            filename: `SKP_${skp.user.fullName}_${skp.period}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        // Hide no-print elements before generating
        document.body.classList.add('printing-pdf');

        html2pdf().set(opt).from(element).save().then(() => {
            document.body.classList.remove('printing-pdf');
        });
    };



    const renderSection = (sectionKey, sectionTitle, planRows, realisasiRows) => {
        if (!planRows || planRows.length === 0) return null;

        // Group rows: numbered row starts a new group, sub-rows (no number) belong to previous group
        const groups = [];
        let currentGroup = null;

        planRows.forEach((row, index) => {
            const hasNumber = row.number && row.number.trim() !== '';

            if (hasNumber) {
                // Start a new group
                currentGroup = {
                    number: row.number,
                    rows: [{ ...row, originalIndex: index }],
                    startIndex: index
                };
                groups.push(currentGroup);
            } else if (currentGroup) {
                // Add to current group (sub-row)
                currentGroup.rows.push({ ...row, originalIndex: index });
            } else {
                // No current group yet (edge case: first row has no number)
                currentGroup = {
                    number: '',
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
                                <th className="border-r border-blue-300 py-2 px-3 text-xs font-bold text-blue-800 text-left">Rencana Kinerja</th>
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
                                                    className="prose prose-sm max-w-none text-gray-700 p-3 min-h-[60px]"
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
                                                        className="prose prose-sm max-w-none text-gray-700 p-3 min-h-[60px] bg-white h-full"
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
                                                    {skp.realisasiStatus === 'Approved' ? (
                                                        <div className="text-sm p-3 text-gray-700 bg-gray-50/50 flex items-center gap-2">
                                                            <Star size={14} className="text-green-600 flex-shrink-0" fill="currentColor" />
                                                            <span>{feedback[sectionKey]?.[group.startIndex]?.rating || '-'}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="p-3">
                                                            {feedback[sectionKey]?.[group.startIndex]?.rating ? (
                                                                // Show selected value as text but clickable
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                                        setDropdownPos({
                                                                            top: rect.bottom,
                                                                            left: rect.left
                                                                        });
                                                                        const key = `${sectionKey}-${group.startIndex}`;
                                                                        setOpenDropdown(openDropdown === key ? null : key);
                                                                    }}
                                                                    className="text-sm text-gray-700 flex items-center gap-2 hover:bg-gray-100 p-1.5 rounded transition-colors"
                                                                >
                                                                    <Star size={14} className="text-green-600 flex-shrink-0" fill="currentColor" />
                                                                    <span>{feedback[sectionKey]?.[group.startIndex]?.rating}</span>
                                                                </button>
                                                            ) : (
                                                                // Show button dropdown
                                                                <div className="relative no-print">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                                            setDropdownPos({
                                                                                top: rect.bottom,
                                                                                left: rect.left
                                                                            });
                                                                            const key = `${sectionKey}-${group.startIndex}`;
                                                                            setOpenDropdown(openDropdown === key ? null : key);
                                                                        }}
                                                                        className="inline-flex items-center gap-1.5 px-2 py-1 border-2 border-green-500 rounded bg-white hover:bg-green-50 transition-colors text-xs font-medium text-gray-700"
                                                                    >
                                                                        <Star size={12} className="text-green-600" fill="currentColor" />
                                                                        <span>Pilih</span>
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
                                                                        className="fixed z-[9999] bg-white border-2 border-green-500 rounded-lg shadow-lg min-w-[140px]"
                                                                        style={{
                                                                            top: `${dropdownPos.top + 5}px`, // Slight offset
                                                                            left: `${dropdownPos.left}px`
                                                                        }}
                                                                    >
                                                                        {['Sangat Buruk', 'Buruk', 'Baik', 'Sangat Baik'].map((option) => (
                                                                            <button
                                                                                key={option}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    handleRatingChange(sectionKey, group.startIndex, option);
                                                                                    setOpenDropdown(null);
                                                                                }}
                                                                                className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 transition-colors first:rounded-t-md last:rounded-b-md text-gray-700"
                                                                            >
                                                                                {option}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </>,
                                                                document.body
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="hidden print:block text-sm p-3">
                                                        {feedback[sectionKey]?.[group.startIndex]?.rating || '-'}
                                                    </div>
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
                                onClick={handleFinalize}
                                isLoading={isSubmitting}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                            >
                                <Lock size={16} />
                                Setujui & Finalisasi
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewRealisasi;
