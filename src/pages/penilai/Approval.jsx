import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { DataTable } from '@/components/common/Table';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Check, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Approval = () => {
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const allSkps = await api.skps.getAll();
            // Filter only pending
            setSubmissions(allSkps.filter(s => s.status === 'Pending'));
        } catch (err) {
            toast.error("Failed to fetch queue");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const handleAction = async (id, action) => {
        try {
            // Simulate status update
            const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
            await api.skps.update(id, {
                status: newStatus,
                approvedAt: new Date().toISOString()
            });
            toast[action === 'approve' ? 'success' : 'error'](`Submission ${newStatus}`);
            fetchSubmissions();
        } catch (err) {
            toast.error("Action failed");
        }
    };

    const columns = [
        {
            header: "User",
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-primary">
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
            header: "Submission",
            cell: (row) => (
                <div>
                    <div className="font-medium text-gray-900">Periode {row.year}</div>
                    <div className="text-xs text-gray-500">Submitted: {new Date(row.createdAt).toLocaleDateString()}</div>
                </div>
            )
        },
        {
            header: "Status",
            cell: () => <Badge variant="warning">Pending Review</Badge>
        },
        {
            header: "Actions",
            cell: (row) => (
                <Button
                    size="sm"
                    variant="gradient"
                    onClick={() => navigate(`/penilai/approval/${row.id}`, { state: { returnTo: '/penilai/approvals' } })}
                >
                    Review
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
                <p className="text-gray-500">Review and approve SKP submissions</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <DataTable
                    columns={columns}
                    data={submissions}
                    pagination={{ page: 1, limit: 10, total: submissions.length }}
                    onPageChange={() => { }}
                />
            </div>
        </div>
    );
};

export default Approval;
