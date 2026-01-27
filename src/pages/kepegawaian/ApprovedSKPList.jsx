import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { DataTable } from '@/components/common/Table';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Eye, Download, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';
import Modal from '@/components/common/Modal';

const ApprovedSKPList = () => {
    const navigate = useNavigate();
    const [skps, setSkps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);

    // Reject Modal State
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedSkpId, setSelectedSkpId] = useState(null);
    const [rejectionNote, setRejectionNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchSkps = async () => {
        setLoading(true);
        try {
            const allSkps = await api.skps.getAll();
            // Filter only approved
            setSkps(allSkps.filter(s => s.status === 'Approved'));
        } catch (err) {
            toast.error("Failed to fetch SKP list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSkps();
    }, []);

    const generatePDF = async (skp) => {
        setDownloadingId(skp.id);
        const toastId = toast.loading("Generating PDF...");

        try {
            // Evaluator Data
            const evaluator = skp.evaluator || {};
            const evaluatorName = evaluator.fullName || "_______________________";
            const evaluatorNIP = evaluator.identityNumber || "...................";
            const evaluatorJabatan = evaluator.jabatan || "Pejabat Penilai Kinerja";
            const evaluatorUnit = evaluator.departmentName || "-";

            // Helper to render rows
            const renderRows = (items) => {
                if (!items || items.length === 0) return '<tr><td colspan="4" class="text-center italic text-gray-500 py-4">Tidak ada data</td></tr>';

                return items.map((item, index) => {
                    const contentValues = item.columns || [];
                    // Ensure we have cells for Rencana, Indikator, Target (3 cols) + No = 4 cols total
                    // The table header has 4 cols.
                    // But contentValues might vary. We should map them to cells.
                    // Assuming columns map to: [Rencana, Indikator, Target]

                    const cells = contentValues.map(c => `<td class="p-1 border border-black align-top" style="padding: 4px;">${c}</td>`).join('');

                    return `
                        <tr>
                            <td class="p-1 border border-black text-center w-8 align-top" style="padding: 4px;">${index + 1}</td>
                            ${cells}
                        </tr>
                    `;
                }).join('');
            };

            const details = skp.details || {};

            // Construct HTML string
            const element = document.createElement('div');
            element.innerHTML = `
                <div style="font-family: 'Times New Roman', Times, serif; padding: 20px; color: #000; line-height: 1.3; font-size: 11pt;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <h2 style="font-size: 14pt; font-weight: bold; margin: 0;">SASARAN KINERJA PEGAWAI (SKP)</h2>
                        <h3 style="font-size: 12pt; font-weight: normal; margin: 5px 0;">PERIODE PENILAIAN: 1 JANUARI ${skp.year} SD 31 DESEMBER ${skp.year}</h3>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11pt;">
                        <thead>
                            <tr>
                                <th style="width: 50%; border: 1px solid #000; padding: 6px; text-align: left;">NO. PEGAWAI YANG DINILAI</th>
                                <th style="width: 50%; border: 1px solid #000; padding: 6px; text-align: left;">NO. PEJABAT PENILAI KINERJA</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="border: 1px solid #000; padding: 8px; vertical-align: top;">
                                    <table style="width: 100%; border: none;">
                                        <tr><td style="width: 100px;">1. Nama</td><td>: ${skp.user?.fullName}</td></tr>
                                        <tr><td>2. NIP</td><td>: ${skp.user?.identityNumber || '-'}</td></tr>
                                        <tr><td>3. Pangkat/Gol</td><td>: ${skp.user?.pangkat || '-'}</td></tr>
                                        <tr><td>4. Jabatan</td><td>: ${skp.user?.jabatan || '-'}</td></tr>
                                        <tr><td>5. Unit Kerja</td><td>: ${skp.user?.departmentName || '-'}</td></tr>
                                    </table>
                                </td>
                                <td style="border: 1px solid #000; padding: 8px; vertical-align: top;">
                                    <table style="width: 100%; border: none;">
                                        <tr><td style="width: 100px;">1. Nama</td><td>: ${evaluatorName}</td></tr>
                                        <tr><td>2. NIP</td><td>: ${evaluatorNIP}</td></tr>
                                        <tr><td>3. Pangkat/Gol</td><td>: ${evaluator.pangkat || '-'}</td></tr>
                                        <tr><td>4. Jabatan</td><td>: ${evaluatorJabatan}</td></tr>
                                        <tr><td>5. Unit Kerja</td><td>: ${evaluatorUnit}</td></tr>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div style="margin-bottom: 15px;">
                        <h4 style="font-size: 11pt; font-weight: bold; margin-bottom: 6px;">A. KINERJA UTAMA</h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 11pt;">
                            <thead>
                                <tr style="background-color: #f0f0f0; text-align: center;">
                                    <th style="border: 1px solid #000; padding: 6px; width: 40px;">NO</th>
                                    <th style="border: 1px solid #000; padding: 6px;">RENCANA HASIL KERJA</th>
                                    <th style="border: 1px solid #000; padding: 6px;">INDIKATOR KINERJA INDIVIDU</th>
                                    <th style="border: 1px solid #000; padding: 6px;">TARGET</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${renderRows(details.utama)}
                            </tbody>
                        </table>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <h4 style="font-size: 11pt; font-weight: bold; margin-bottom: 6px;">B. KINERJA TAMBAHAN</h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 11pt;">
                            <thead>
                                <tr style="background-color: #f0f0f0; text-align: center;">
                                    <th style="border: 1px solid #000; padding: 6px; width: 40px;">NO</th>
                                    <th style="border: 1px solid #000; padding: 6px;">RENCANA HASIL KERJA</th>
                                    <th style="border: 1px solid #000; padding: 6px;">INDIKATOR KINERJA INDIVIDU</th>
                                    <th style="border: 1px solid #000; padding: 6px;">TARGET</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${renderRows(details.tambahan)}
                            </tbody>
                        </table>
                    </div>
                    
                    <div style="margin-top: 50px; display: flex; justify-content: flex-end; page-break-inside: avoid;">
                        <div style="text-align: center; width: 250px;">
                            <p style="font-size: 11pt; margin-bottom: 70px;">
                                Yogyakarta, ${new Date(skp.approvedAt || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
                                Pejabat Penilai Kinerja
                            </p>
                            <p style="font-size: 11pt; font-weight: bold; text-decoration: underline;">${evaluatorName}</p>
                            <p style="font-size: 11pt;">NIP. ${evaluatorNIP}</p>
                        </div>
                    </div>
                </div>
            `;

            const opt = {
                margin: [10, 10, 10, 10], // mm
                filename: `SKP_${skp.user?.fullName.replace(/\s+/g, '_')}_${skp.year}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(element).save();
            toast.success("PDF Downloaded", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate PDF", { id: toastId });
        } finally {
            setDownloadingId(null);
        }
    };

    const openRejectModal = (skpId) => {
        setSelectedSkpId(skpId);
        setRejectionNote('');
        setRejectModalOpen(true);
    };

    const handleReject = async () => {
        if (!rejectionNote.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.skps.update(selectedSkpId, {
                status: 'Rejected',
                feedback: { global: rejectionNote }
            });
            toast.success("SKP Rejected and returned for revision");
            setRejectModalOpen(false);
            fetchSkps(); // Refresh list
        } catch (err) {
            toast.error("Failed to reject SKP");
        } finally {
            setIsSubmitting(false);
            setSelectedSkpId(null);
        }
    };

    const columns = [
        {
            header: "User",
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">
                        {row.user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{row.user?.fullName}</div>
                        <div className="text-xs text-gray-500">{row.user?.identityNumber}</div>
                    </div>
                </div>
            )
        },
        {
            header: "Periode",
            accessorKey: "year",
            cell: (row) => <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs">{row.year}</span>
        },
        {
            header: "Tgl Disetujui",
            cell: (row) => (
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                    <div className={`w-2 h-2 rounded-full ${row.approvedAt ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                    {row.approvedAt
                        ? new Date(row.approvedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                        : <span className="text-gray-400 italic">Manual Approval</span>}
                </div>
            )
        },
        {
            header: "Actions",
            cell: (row) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/kepegawaian/approval/${row.id}`, { state: { returnTo: '/kepegawaian/skp-list' } })}
                        className="h-8 text-xs font-medium border-gray-200 hover:border-primary hover:text-primary transition-colors"
                    >
                        <Eye size={14} className="mr-1.5" /> Detail
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => generatePDF(row)}
                        disabled={downloadingId === row.id}
                        className={`h-8 text-xs font-medium transition-all ${downloadingId === row.id ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-purple-700 text-white shadow-sm hover:shadow-md'}`}
                        title="Download PDF"
                    >
                        {downloadingId === row.id ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <>
                                <Download size={14} className="mr-1.5" /> PDF
                            </>
                        )}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRejectModal(row.id)}
                        className="h-8 text-xs font-medium border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                        title="Reject (Correct Mistake)"
                    >
                        <XCircle size={14} className="mr-1.5" /> Reject
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Approved SKP List</h1>
                    <p className="text-gray-500 mt-1">Daftar SKP pegawai yang telah disetujui dan siap dicetak</p>
                </div>
                <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-emerald-100">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    {skps.length} Approved Documents
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={skps}
                    pagination={{ page: 1, limit: 10, total: skps.length }}
                    onPageChange={() => { }}
                    isLoading={loading}
                />
            </div>
        </div>
    );
};

export default ApprovedSKPList;
