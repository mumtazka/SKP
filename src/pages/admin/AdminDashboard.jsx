import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Users, FileCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalDosen: 0,
        unassigned: 0,
        assigned: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // In a real app, this would be an API call
                const users = await api.users.getAll();
                const dosen = users.filter(u => u.role === 'dosen');

                // Mock logic for assignment status (checking if they have "raters" property)
                // Since we haven't implemented storage for raters yet, we'll assume 0 assigned for now
                // or check if we added 'raters' to the mock data later.
                const assignedCount = dosen.filter(d => d.raters).length;

                setStats({
                    totalDosen: dosen.length,
                    unassigned: dosen.length - assignedCount,
                    assigned: assignedCount
                });
            } catch (error) {
                console.error("Failed to fetch stats", error);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-gray-500">Overview of SKP Rater Assignments</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Dosen</CardTitle>
                        <Users className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalDosen}</div>
                        <p className="text-xs text-gray-500">Active lecturers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Need Assignment</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.unassigned}</div>
                        <p className="text-xs text-gray-500">Lecturers without raters</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Assigned</CardTitle>
                        <FileCheck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.assigned}</div>
                        <p className="text-xs text-gray-500">Lecturers with assigned raters</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
