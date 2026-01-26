import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import StatCard from '@/components/dashboard/StatCard';
import { Users, FileText, CheckCircle, Database } from 'lucide-react';

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalSkps: 0,
        totalDepts: 0,
        avgScore: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [users, skps, depts] = await Promise.all([
                    api.users.getAll(),
                    api.skps.getAll(),
                    api.departments.getAll()
                ]);

                const scoredSkps = skps.filter(s => s.score);
                const avg = scoredSkps.length > 0
                    ? (scoredSkps.reduce((acc, curr) => acc + (curr.score || 0), 0) / scoredSkps.length).toFixed(1)
                    : 0;

                setStats({
                    totalUsers: users.length,
                    totalSkps: skps.length,
                    totalDepts: depts.length,
                    avgScore: avg
                });
            } catch (error) {
                console.error("Failed to fetch admin stats", error);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
                <p className="text-gray-500">Administrative Monitoring Dashboard</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    color="primary"
                    trend="+5 this week"
                    trendUp={true}
                />
                <StatCard
                    title="Total Submissions"
                    value={stats.totalSkps}
                    icon={FileText}
                    color="info"
                />
                <StatCard
                    title="Departments"
                    value={stats.totalDepts}
                    icon={Database}
                    color="warning"
                />
                <StatCard
                    title="Average Score"
                    value={stats.avgScore}
                    icon={CheckCircle}
                    color="success"
                    description="System-wide performance"
                />
            </div>

            {/* Analytics Chart Placeholder */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 h-64 flex items-center justify-center bg-gray-50">
                <p className="text-gray-400">Activity Analytics Chart (Recharts) Placeholder</p>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
