import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    FileText,
    History,
    CheckSquare,
    ClipboardList,
    Users,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Building,
    Calendar,
    ChevronDown,
    UserCircle,
    Briefcase
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';

const SidebarItem = ({ item, isOpen, isMobile }) => {
    const location = useLocation();
    const [isExpanded, setIsExpanded] = useState(false);

    // Auto-expand if child is active
    React.useEffect(() => {
        if (item.subMenus) {
            const hasActiveChild = item.subMenus.some(sub => location.pathname.startsWith(sub.path));
            if (hasActiveChild) {
                setIsExpanded(true);
            }
        }
    }, [location.pathname, item.subMenus]);

    if (item.subMenus) {
        return (
            <div className="mb-1">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-gray-700 hover:bg-gray-50 hover:text-gray-900 group relative",
                        !isOpen && "justify-center"
                    )}
                    title={!isOpen ? item.name : undefined}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <item.icon className={cn("h-5 w-5 shrink-0 text-gray-500", !isOpen && "mr-0")} />
                        {isOpen && <span className="font-semibold text-sm">{item.name}</span>}
                    </div>
                    {isOpen && (
                        <ChevronDown
                            size={16}
                            className={cn("transition-transform duration-200 text-gray-400", isExpanded && "rotate-180")}
                        />
                    )}
                </button>

                {/* Submenu Items */}
                <div className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out space-y-0.5",
                    isExpanded ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
                )}>
                    {item.subMenus.map(subItem => (
                        <NavLink
                            key={subItem.path}
                            to={subItem.path}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative text-sm",
                                isOpen ? "ml-4" : "justify-center",
                                isActive
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                            title={!isOpen ? subItem.name : undefined}
                        >
                            {/* In collapsed mode, we might want to show icon if distinct, or just rely on parent hover? 
                                User asked for simple. Let's show nested items with sub-icons if expanded, 
                                but in collapsed mode sidebar, nested items are tricky. 
                                Usually collapsed sidebar only shows top level icons.
                                Let's show icons for subitems too.
                            */}
                            <subItem.icon className={cn("h-4 w-4 shrink-0", !isOpen && "h-5 w-5")} />
                            {isOpen && <span>{subItem.name}</span>}
                        </NavLink>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <NavLink
            to={item.path}
            className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative mb-1",
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
    );
};

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
    const { user, logout } = useAuth();

    if (!user) return null;

    const roleMenus = {
        dosen: [
            { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
            { name: 'Ajukan SKP', icon: FileText, path: '/dosen/submit' },
            { name: 'Evaluasi Akhir', icon: ClipboardList, path: '/dosen/realisasi' },
            { name: 'Riwayat', icon: History, path: '/dosen/history' },
        ],
        penilai: [
            { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
            {
                name: 'Pribadi',
                icon: UserCircle,
                subMenus: [
                    { name: 'Ajukan SKP', icon: FileText, path: '/dosen/submit' },
                    { name: 'Evaluasi Akhir', icon: ClipboardList, path: '/dosen/realisasi' },
                    { name: 'Riwayat Pribadi', icon: History, path: '/dosen/history' },
                ]
            },
            {
                name: 'Penilai',
                icon: Briefcase,
                subMenus: [
                    { name: 'Persetujuan', icon: CheckSquare, path: '/penilai/approvals' },
                    { name: 'Daftar SKP', icon: FileText, path: '/penilai/skp-list' },
                    { name: 'Penilaian', icon: ClipboardList, path: '/penilai/evaluations' },
                    { name: 'Riwayat Pegawai', icon: Users, path: '/penilai/history' },
                ]
            },
            { name: 'Riwayat', icon: History, path: '/penilai/riwayat' },
        ],
        superadmin: [
            { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
            {
                name: 'Administrasi',
                icon: Building,
                subMenus: [
                    { name: 'Manajemen Pengguna', icon: Users, path: '/admin/users' },
                    { name: 'Departemen', icon: Building, path: '/superadmin/departments' },
                ]
            },
            {
                name: 'Penilai',
                icon: Briefcase,
                subMenus: [
                    { name: 'Persetujuan', icon: CheckSquare, path: '/penilai/approvals' },
                    { name: 'Daftar SKP', icon: FileText, path: '/penilai/skp-list' },
                    { name: 'Riwayat Pegawai', icon: Users, path: '/penilai/history' },
                ]
            },
            { name: 'Ajukan SKP', icon: FileText, path: '/dosen/submit' },
            { name: 'Riwayat SKP', icon: History, path: '/superadmin/riwayat' },
        ],
        admin: [
            { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
            {
                name: 'Administrasi',
                icon: Building,
                subMenus: [
                    { name: 'Manajemen Pengguna', icon: Users, path: '/admin/users' },
                    { name: 'Data Master', icon: Building, path: '/admin/master-data' },
                    { name: 'Atur Penilai', icon: Users, path: '/admin/assign' },
                    { name: 'Periode SKP', icon: Calendar, path: '/admin/period-settings' },
                    { name: 'Buat SKP User', icon: FileText, path: '/admin/create-skp' },
                ]
            },

            {
                name: 'Penilai',
                icon: Briefcase,
                subMenus: [
                    { name: 'Persetujuan', icon: CheckSquare, path: '/penilai/approvals' },
                    { name: 'Daftar SKP', icon: FileText, path: '/penilai/skp-list' },
                    { name: 'Penilaian', icon: ClipboardList, path: '/penilai/evaluations' },
                    { name: 'Riwayat Pegawai', icon: Users, path: '/penilai/history' },
                ]
            },
            { name: 'Riwayat SKP', icon: History, path: '/admin/riwayat' },
        ]
    };

    const normalizedRole = user.role === 'kepegawaian' ? 'penilai' : user.role;
    const menus = roleMenus[normalizedRole] || [];

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
                <div className={cn("flex items-center gap-3 overflow-hidden", !isOpen && "justify-center w-full")}>
                    <Logo showText={isOpen} size={isOpen ? 40 : 32} />
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
                {menus.map((item, index) => (
                    <SidebarItem key={index} item={item} isOpen={isOpen} isMobile={isMobile} />
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
