import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Bell, Menu, User as UserIcon, Settings, LogOut, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { api } from '@/services/api';

const UserDropdown = ({ user, logout }) => {
    const [open, setOpen] = useState(false);
    const ref = React.useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleProfileClick = () => {
        setOpen(false);
        navigate('/profile');
    };

    const handleSettingsClick = () => {
        setOpen(false);
        navigate('/settings');
    };

    const handleLogout = () => {
        setOpen(false);
        logout();
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
                <img
                    src={user.photo}
                    alt={user.fullName}
                    className="h-8 w-8 rounded-full border border-gray-200"
                />
                <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50 animate-in fade-in zoom-in duration-200">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <img
                                src={user.photo}
                                alt={user.fullName}
                                className="h-10 w-10 rounded-full border border-gray-200"
                            />
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                        <button
                            onClick={handleProfileClick}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary flex items-center gap-3 transition-colors"
                        >
                            <UserIcon size={16} className="text-gray-400" />
                            Profile
                        </button>
                        <button
                            onClick={handleSettingsClick}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary flex items-center gap-3 transition-colors"
                        >
                            <Settings size={16} className="text-gray-400" />
                            Settings
                        </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 pt-1">
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const NotificationDropdown = ({ user }) => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const ref = React.useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [user]);

    const loadNotifications = async () => {
        try {
            const notes = await api.notifications.getAll(user.id, user.role);
            setNotifications(notes.slice(0, 5)); // Show latest 5
            const count = await api.notifications.getUnreadCount(user.id, user.role);
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to load notifications', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.read) {
            await api.notifications.markAsRead(notification.id);
            loadNotifications();
        }
        if (notification.link) {
            navigate(notification.link);
        }
        setOpen(false);
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={18} className="text-green-500" />;
            case 'error':
                return <AlertCircle size={18} className="text-red-500" />;
            default:
                return <Info size={18} className="text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 relative transition-colors"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-lg z-50 animate-in fade-in zoom-in duration-200">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/30' : ''
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        <div className="shrink-0 mt-0.5">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium text-gray-900 ${!notification.read ? 'font-semibold' : ''}`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(notification.createdAt).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <div className="shrink-0">
                                                <span className="h-2 w-2 bg-blue-500 rounded-full block"></span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-gray-100 text-center">
                            <button className="text-xs text-primary hover:text-purple-700 font-medium">
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Navbar = ({ toggleSidebar, isMobile }) => {
    const { user, logout } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 fixed top-0 right-0 left-0 z-30 transition-all duration-300">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                >
                    <Menu className="h-6 w-6" />
                </button>
                {isMobile && (
                    <span className="font-bold text-lg tracking-tight text-gray-900">SKP System</span>
                )}
            </div>

            {/* Application Action Area (Portal Target for Toolbars etc) */}
            <div id="navbar-action-area" className="flex-1 flex justify-center px-4 min-w-0"></div>

            <div className="flex items-center gap-2 sm:gap-4">
                <NotificationDropdown user={user} />
                <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
                <UserDropdown user={user} logout={logout} />
            </div>
        </header>
    );
};

export default Navbar;
