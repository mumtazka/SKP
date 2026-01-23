import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from 'sonner';

// Authentication
import Login from '@/pages/Login';

// Layout
import Layout from '@/components/layout/Layout';

// Common Pages
import Profile from '@/pages/Profile';

// Dosen Pages
import DosenDashboard from '@/pages/dosen/DosenDashboard';
import SubmitSKP from '@/pages/dosen/SubmitSKP';
import Progress from '@/pages/dosen/Progress';

// Kepegawaian Pages
import KepegawaianDashboard from '@/pages/kepegawaian/KepegawaianDashboard';
import Approval from '@/pages/kepegawaian/Approval';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import UserManagement from '@/pages/admin/UserManagement';

// Placeholders for remaining
const ComingSoon = ({ title }) => (
    <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100 border-dashed">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p>This feature is coming soon.</p>
    </div>
);

const DashboardRedirect = () => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;

    switch (user.role) {
        case 'admin': return <Navigate to="/admin/dashboard" replace />;
        case 'kepegawaian': return <Navigate to="/kepegawaian/dashboard" replace />;
        default: return <Navigate to="/dosen/dashboard" replace />;
    }
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/" element={<Layout />}>
                        <Route index element={<DashboardRedirect />} />
                        <Route path="dashboard" element={<DashboardRedirect />} />

                        {/* Common Routes */}
                        <Route path="profile" element={<Profile />} />

                        {/* DOSEN */}
                        <Route path="dosen">
                            <Route path="dashboard" element={<DosenDashboard />} />
                            <Route path="submit" element={<SubmitSKP />} />
                            <Route path="progress" element={<Progress />} />
                            <Route path="history" element={<ComingSoon title="Riwayat SKP" />} />
                        </Route>

                        {/* KEPEGAWAIAN */}
                        <Route path="kepegawaian">
                            <Route path="dashboard" element={<KepegawaianDashboard />} />
                            <Route path="approvals" element={<Approval />} />
                            <Route path="evaluations" element={<ComingSoon title="Evaluasi Kinerja" />} />
                            <Route path="history" element={<ComingSoon title="Riwayat Pegawai" />} />
                        </Route>

                        {/* ADMIN */}
                        <Route path="admin">
                            <Route path="dashboard" element={<AdminDashboard />} />
                            <Route path="users" element={<UserManagement />} />
                            <Route path="departments" element={<ComingSoon title="Department Management" />} />
                            <Route path="settings" element={<ComingSoon title="System Settings" />} />
                            <Route path="reports" element={<ComingSoon title="Reports & Analytics" />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
                <Toaster position="top-right" richColors />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
