import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import StatCard from '@/components/dashboard/StatCard';
import { FileText, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useNavigate } from 'react-router-dom';

const DosenDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const skps = await api.skps.getByUser(user.id);
                setStats({
                    total: skps.length,
                    approved: skps.filter(s => s.status === 'Approved' || s.status === 'Completed').length,
                    pending: skps.filter(s => s.status === 'Pending').length,
                    rejected: skps.filter(s => s.status === 'Rejected').length
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
        };
        fetchStats();
    }, [user.id]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Welcome back, {user.fullName}</p>
                </div>
                <Button onClick={() => navigate('/dosen/submit')} variant="gradient">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajukan SKP Baru
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total SKP"
                    value={stats.total}
                    icon={FileText}
                    color="primary"
                    description="Total submissions"
                />
                <StatCard
                    title="Disetujui"
                    value={stats.approved}
                    icon={CheckCircle}
                    color="success"
                    trend="+2% from last month"
                    trendUp={true}
                    description="Completed & Approved"
                />
                <StatCard
                    title="Menunggu"
                    value={stats.pending}
                    icon={Clock}
                    color="warning"
                    description="Pending approval"
                />
                <StatCard
                    title="Ditolak"
                    value={stats.rejected}
                    icon={XCircle}
                    color="danger"
                    description="Needs revision"
                />
            </div>

            {/* Recent Activity Placeholder */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Aktivitas Terakhir</h2>
                <div className="text-gray-500 text-sm py-8 text-center bg-gray-50 rounded-lg border-dashed border border-gray-200">
                    Belum ada aktivitas baru minggu ini.
                </div>
            </div>
        </div>
    );
};

export default DosenDashboard;
