import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { DataTable } from '@/components/common/Table';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Check, X, FileText } from 'lucide-react';
import { toast } from 'sonner';

const Approval = () => {
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
            header: "Activity",
            cell: (row) => (
                <div>
                    <div className="font-medium text-gray-900">{row.activity}</div>
                    <div className="text-xs text-gray-500">{row.category} ({row.year})</div>
                    <div className="text-xs text-gray-400 mt-0.5">Submitted: {new Date(row.createdAt).toLocaleDateString()}</div>
                </div>
            )
        },
        {
            header: "Priority",
            cell: () => <Badge variant="warning">Normal</Badge> // Mock priority
        },
        {
            header: "Actions",
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                        <FileText size={16} className="text-gray-500" />
                    </Button>
                    <Button
                        size="sm"
                        className="bg-green-100 text-green-700 hover:bg-green-200"
                        onClick={() => handleAction(row.id, 'approve')}
                    >
                        <Check size={16} className="mr-1" /> Approve
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => handleAction(row.id, 'reject')}
                    >
                        <X size={16} />
                    </Button>
                </div>
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
