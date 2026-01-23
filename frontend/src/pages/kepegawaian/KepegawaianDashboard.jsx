import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import StatCard from '@/components/dashboard/StatCard';
import { FileText, CheckSquare, Clock, Users } from 'lucide-react';

const KepegawaianDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        pendingApprovals: 0,
        totalEmployees: 0, // Mock
        evaluationsDone: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const skps = await api.skps.getAll();
                setStats({
                    pendingApprovals: skps.filter(s => s.status === 'Pending').length,
                    totalEmployees: 30, // Mock from data size
                    evaluationsDone: skps.filter(s => s.evaluatorId === user.id).length
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
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Kepegawaian</h1>
                <p className="text-gray-500">Overview of SKP submissions and evaluations</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Perlu Persetujuan"
                    value={stats.pendingApprovals}
                    icon={Clock}
                    color="warning"
                    description="Submission menunggu review"
                />
                <StatCard
                    title="Sudah Dinilai"
                    value={stats.evaluationsDone}
                    icon={CheckSquare}
                    color="success"
                    description="SKP yang telah anda nilai"
                />
                <StatCard
                    title="Total Pegawai"
                    value={stats.totalEmployees}
                    icon={Users}
                    color="info"
                    description="Pegawai aktif"
                />
            </div>

            {/* Queue Placeholder */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Antrian Persetujuan Mendesak</h2>
                <div className="text-gray-500 text-sm py-8 text-center bg-yellow-50 rounded-lg border-dashed border border-yellow-200">
                    Tidak ada item mendesak saat ini.
                </div>
            </div>
        </div>
    );
};

export default KepegawaianDashboard;
