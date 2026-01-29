import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ArrowLeft, MessageSquare, User, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/common/Button';
import SKPSection from '@/pages/dosen/components/SKPSection'; // Reusing component
import Modal from '@/components/common/Modal';

const ReviewSKP = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const returnTo = location.state?.returnTo || '/penilai/approvals';
    const [skp, setSkp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [rejectionNote, setRejectionNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchSKP = async () => {
            try {
                // We'll fetch all and find (not efficient but works for now with existing API)
                // Or better, implement getById in API if not exists. 
                // Currently API has getAll and getByUser. Ideally we add getById.
                // For now, let's assume we can filter from getAll or add getById.
                // Let's check api.js... it doesn't have getById for SKP.
                // I'll add getById to api.js first or just filter from getAll relative to the user context?
                // Actually, as admin/penilai, I can see all.
                const all = await api.skps.getAll();
                const found = all.find(s => s.id === id);
                if (found) {
                    setSkp(found);
                } else {
                    toast.error("SKP not found");
                    navigate(returnTo);
                }
            } catch (err) {
                toast.error("Failed to load SKP details");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSKP();
    }, [id, navigate, returnTo]);

    const executeApprove = async () => {
        setIsSubmitting(true);
        try {
            await api.skps.update(id, {
                status: 'Approved',
                feedback: null, // Clear any previous rejection feedback
                approvedAt: new Date().toISOString()
            });
            toast.success("SKP Approved Successfully");
            setApproveModalOpen(false);
            navigate(returnTo);
        } catch (err) {
            toast.error("Failed to approve SKP");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionNote.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.skps.update(id, {
                status: 'Rejected',
                feedback: { global: rejectionNote } // Simple global feedback structure
            });
            toast.success("SKP Rejected and returned for revision");
            setRejectModalOpen(false);
            navigate(returnTo);
        } catch (err) {
            toast.error("Failed to reject SKP");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading SKP...</div>;
    if (!skp) return null;

    const details = skp.details || { utama: [], tambahan: [], dukungan: [], skema: [], konsekuensi: [] };

    return (
        <div className="max-w-5xl mx-auto pb-24">
            {/* Header / Nav */}
            <div className="mb-6">
                <Button variant="ghost" onClick={() => navigate(returnTo)} className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
                    <ArrowLeft size={16} className="mr-2" /> Back
                </Button>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Review SKP Submission</h1>
                        <p className="text-gray-500">Period: {skp.year}</p>
                    </div>
                    <div className="flex gap-2">
                        {skp.status === 'Pending' && (
                            <>
                                <Button
                                    variant="outline"
                                    className="bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                    onClick={() => setRejectModalOpen(true)}
                                >
                                    <XCircle size={18} className="mr-2" /> Reject
                                </Button>
                                <Button
                                    variant="gradient"
                                    onClick={() => setApproveModalOpen(true)}
                                >
                                    <CheckCircle size={18} className="mr-2" /> Approve
                                </Button>
                            </>
                        )}

                        {skp.status === 'Approved' && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-10"
                                    onClick={() => setRejectModalOpen(true)}
                                    title="Reject (Correct Mistake)"
                                >
                                    <XCircle size={18} className="mr-2" /> Reject
                                </Button>
                                <div className="px-4 py-2 rounded-lg font-bold flex items-center gap-2 bg-emerald-100 text-emerald-700">
                                    <CheckCircle size={18} /> Approved
                                </div>
                            </div>
                        )}

                        {skp.status === 'Rejected' && (
                            <div className="px-4 py-2 rounded-lg font-bold flex items-center gap-2 bg-red-100 text-red-700">
                                <XCircle size={18} /> Rejected
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* User Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6 mb-8 flex flex-col md:flex-row gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center text-2xl font-bold text-primary">
                        {skp.user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">{skp.user?.fullName}</h3>
                        <p className="text-gray-500 text-sm flex items-center gap-1">
                            <User size={14} /> {skp.user?.identityNumber || 'No NIP'}
                        </p>
                        <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                            <MapPin size={14} /> {skp.user?.departmentName || '-'}
                        </p>
                    </div>
                </div>
                <div className="flex-1 md:border-l md:border-gray-100 md:pl-6 flex flex-col justify-center">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-xs text-gray-400 uppercase font-semibold">Jabatan</span>
                            <p className="font-medium text-gray-900">{skp.user?.jabatan || '-'}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 uppercase font-semibold">Tgl Pengajuan</span>
                            <p className="font-medium text-gray-900 flex items-center gap-1">
                                <Calendar size={14} />
                                {new Date(skp.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-6">
                {/* Helper to render sections reliably */}
                <SKPSection
                    title="A. UTAMA"
                    rows={details.utama || []}
                    readOnly={true}
                    onChange={() => { }}
                />
                <SKPSection
                    title="B. TAMBAHAN"
                    rows={details.tambahan || []}
                    readOnly={true}
                    onChange={() => { }}
                />
                <SKPSection
                    title="LAMPIRAN: DUKUNGAN SUMBER DAYA"
                    rows={details.dukungan || []}
                    readOnly={true}
                    onChange={() => { }}
                />
                <SKPSection
                    title="LAMPIRAN: SKEMA PERTANGGUNGJAWABAN"
                    rows={details.skema || []}
                    readOnly={true}
                    onChange={() => { }}
                />
                <SKPSection
                    title="LAMPIRAN: KONSEKUENSI"
                    rows={details.konsekuensi || []}
                    readOnly={true}
                    onChange={() => { }}
                />
            </div>

            {/* Reject Modal */}
            <Modal
                isOpen={rejectModalOpen}
                onClose={() => setRejectModalOpen(false)}
                title="Reject Submission"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleReject}
                            disabled={isSubmitting}
                        >
                            Confirm Rejection
                        </Button>
                    </>
                }
            >
                <div>
                    <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejecting this submission. This will be sent to the user.</p>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Notes</label>
                    <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition-all h-32 resize-none"
                        placeholder="e.g. Target kuantitas pada poin 2 kurang realistis..."
                        value={rejectionNote}
                        onChange={(e) => setRejectionNote(e.target.value)}
                    ></textarea>
                </div>
            </Modal>

            {/* Approve Confirmation Modal */}
            <Modal
                isOpen={approveModalOpen}
                onClose={() => setApproveModalOpen(false)}
                title="Confirm Approval"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setApproveModalOpen(false)}>Cancel</Button>
                        <Button
                            variant="gradient"
                            onClick={executeApprove}
                            disabled={isSubmitting}
                        >
                            Confirm Approval
                        </Button>
                    </>
                }
            >
                <div className="text-center py-4">
                    <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Approve this SKP?</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        This will mark the SKP as approved and official. You can still reject it later if needed.
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default ReviewSKP;
