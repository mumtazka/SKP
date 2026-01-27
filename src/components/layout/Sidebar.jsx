import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    FileText,
    History,
    CheckSquare,
    ClipboardList,
    Users,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    PieChart,
    Building
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
    const { user, logout } = useAuth();

    if (!user) return null;

    const roleMenus = {
        dosen: [
            { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
            { name: 'Ajukan SKP', icon: FileText, path: '/dosen/submit' },
            { name: 'Riwayat', icon: History, path: '/dosen/history' },
        ],
        kepegawaian: [
            { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
            { name: 'Persetujuan', icon: CheckSquare, path: '/kepegawaian/approvals' },
            { name: 'SKP', icon: FileText, path: '/kepegawaian/skp-list' },
            { name: 'Penilaian', icon: ClipboardList, path: '/kepegawaian/evaluations' },
            { name: 'Riwayat Pegawai', icon: Users, path: '/kepegawaian/history' },
        ],
        superadmin: [
            { name: 'Dashboard', icon: LayoutDashboard, path: '/superadmin/dashboard' },
            { name: 'User Management', icon: Users, path: '/superadmin/users' },
            { name: 'Departments', icon: Building, path: '/superadmin/departments' },
            { name: 'Settings', icon: Settings, path: '/superadmin/settings' },
            { name: 'Reports', icon: PieChart, path: '/superadmin/reports' },
        ],
        admin: [
            { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
            { name: 'User Management', icon: Users, path: '/admin/users' },
            { name: 'Assign Rater', icon: Users, path: '/admin/assign' },
        ]
    };

    const menus = roleMenus[user.role] || [];

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col",
                isOpen ? "w-64" : "w-20",
                isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"
            )}
        >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
                <div className={cn("flex items-center gap-2 overflow-hidden", !isOpen && "justify-center w-full")}>
                    <div className="h-8 w-8 min-w-[2rem] rounded-lg bg-primary flex items-center justify-center text-white font-bold shrink-0">S</div>
                    {isOpen && <span className="font-bold text-lg tracking-tight truncate">SKP System</span>}
                </div>
                {!isMobile && (
                    <button
                        onClick={toggleSidebar}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                    >
                        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                    </button>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {menus.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative",
                            isActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                            !isOpen && "justify-center"
                        )}
                    >
                        <item.icon className={cn("h-5 w-5 shrink-0", !isOpen && "mr-0")} />
                        {isOpen && <span className="truncate">{item.name}</span>}
                        {!isOpen && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                {item.name}
                            </div>
                        )}
                    </NavLink>
                ))}
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t border-gray-100 space-y-1">
                {/* Settings for everyone if not already in menu logic, but admin has it in menu. Adding general settings here if needed or just logout */}
                <button
                    onClick={logout}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-gray-600 hover:bg-red-50 hover:text-red-600 group relative",
                        !isOpen && "justify-center"
                    )}
                >
                    <LogOut className="h-5 w-5 shrink-0" />
                    {isOpen && <span>Logout</span>}
                    {!isOpen && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            Logout
                        </div>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
