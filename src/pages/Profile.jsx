import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { toast } from 'sonner';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Building2,
    GraduationCap,
    BadgeCheck,
    Briefcase,
    Calendar,
    Shield,
    Home,
    IdCard,
    Save,
    Camera,
    Lock,
    Key,
    AlertCircle
} from 'lucide-react';

const Profile = () => {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPhotoInput, setShowPhotoInput] = useState(false);

    // Profile Form State
    const [editForm, setEditForm] = useState({
        photo: '',
        email: '',
        phoneNumber: '',
        address: '',
        identityNumber: ''
    });

    // Password Form State
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordLoading, setPasswordLoading] = useState(false);

    const [pangkatOptions, setPangkatOptions] = useState([]);
    const [jabatanOptions, setJabatanOptions] = useState([]);

    useEffect(() => {
        loadProfile();
        loadOptions();
    }, [user]);

    const loadOptions = async () => {
        try {
            const [pangkats, jabatans] = await Promise.all([
                api.references.getPangkats(),
                api.references.getJabatans()
            ]);
            setPangkatOptions(pangkats);
            setJabatanOptions(jabatans);
        } catch (error) {
            console.error('Failed to load options:', error);
        }
    };

    const loadProfile = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await api.users.getById(user.id);
            setProfileData(data);
            setEditForm({
                photo: data.photo || '',
                email: data.email || '',
                phoneNumber: data.phoneNumber || '',
                address: data.address || '',
                pangkat: data.pangkat || '',
                jabatan: data.jabatan || '',
                identityNumber: data.identityNumber || ''
            });
        } catch (error) {
            console.error('Failed to load profile:', error);
            // Fallback to user data from context
            setProfileData(user);
            setEditForm({
                photo: user.photo || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                address: user.address || '',
                pangkat: user.pangkat || '',
                jabatan: user.jabatan || '',
                identityNumber: user.identityNumber || ''
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.auth.updateProfile(user.id, editForm);
            toast.success('Profile updated successfully');
            loadProfile();
            // Force reload to reflect changes in context/navbar
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            toast.error('Failed to update profile');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("New passwords don't match");
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setPasswordLoading(true);
        try {
            await api.auth.changePassword(
                user.id,
                passwordForm.currentPassword,
                passwordForm.newPassword
            );
            toast.success('Password changed successfully');
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            toast.error(error.message || 'Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    };

    const getRoleBadge = (role) => {
        const roleConfig = {
            admin: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Administrator' },
            penilai: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Penilai' },
            dosen: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Dosen' }
        };
        const config = roleConfig[role] || roleConfig.dosen;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
                <Shield size={14} />
                {config.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const data = profileData || user;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                    <p className="text-gray-500 mt-1">Manage your account information</p>
                </div>
                <Button
                    variant="gradient"
                    onClick={handleSave}
                    isLoading={saving}
                    className="flex items-center gap-2"
                >
                    <Save size={16} />
                    Save Changes
                </Button>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header Banner */}
                <div className="h-32 bg-gradient-to-r from-primary via-purple-600 to-indigo-600 relative">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50"></div>
                </div>

                {/* Profile Info Section */}
                <div className="px-6 pb-6">
                    {/* Avatar */}
                    <div className="relative -mt-16 mb-4">
                        <div className="relative inline-block">
                            <img
                                src={editForm.photo || data.photo}
                                alt={data.fullName}
                                className="h-32 w-32 rounded-2xl border-4 border-white shadow-lg object-cover bg-gray-100"
                            />
                            <div className="absolute top-full left-0 right-0 mt-2 z-10">
                                {showPhotoInput && (
                                    <div className="bg-white p-2 rounded-lg shadow-xl border border-gray-100 animate-in fade-in zoom-in duration-200">
                                        <Input
                                            value={editForm.photo}
                                            onChange={(e) => setEditForm({ ...editForm, photo: e.target.value })}
                                            placeholder="Image URL..."
                                            className="text-xs"
                                            autoFocus
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1 px-1">We support public image URLs</p>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setShowPhotoInput(!showPhotoInput)}
                                className={`absolute bottom-2 right-2 p-2 rounded-full shadow-md transition-colors ${showPhotoInput ? 'bg-primary text-white' : 'bg-white hover:bg-gray-50 text-gray-600'}`}
                            >
                                <Camera size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Name and Role */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">{data.fullName}</h2>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                            {getRoleBadge(data.role)}
                            {data.isHomebase && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                                    <Home size={14} />
                                    Homebase
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column - Account Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                                Account Information
                            </h3>

                            {/* Username */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <User size={18} className="text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Username</p>
                                    <p className="font-medium text-gray-900">@{data.username}</p>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <Mail size={18} className="text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Email</p>
                                    <Input
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        placeholder="Enter email"
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <Phone size={18} className="text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Phone Number</p>
                                    <Input
                                        value={editForm.phoneNumber}
                                        onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                        placeholder="Enter phone number"
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <MapPin size={18} className="text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Address</p>
                                    <textarea
                                        value={editForm.address}
                                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                        placeholder="Enter address"
                                        rows={2}
                                        className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Work Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                                Work Information
                            </h3>

                            {/* Identity Number */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <IdCard size={18} className="text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Identity Number (NIP/NIK)</p>
                                    <Input
                                        value={editForm.identityNumber}
                                        onChange={(e) => setEditForm({ ...editForm, identityNumber: e.target.value })}
                                        placeholder="Enter NIP"
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            {/* Department */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <Building2 size={18} className="text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Department</p>
                                    <p className="font-medium text-gray-900">{data.departmentName || '-'}</p>
                                </div>
                            </div>

                            {/* Study Program (for Dosen) */}
                            {data.role === 'dosen' && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <GraduationCap size={18} className="text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Study Program</p>
                                        <p className="font-medium text-gray-900">{data.studyProgramName || '-'}</p>
                                    </div>
                                </div>
                            )}

                            {/* Pangkat/Golongan */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <BadgeCheck size={18} className="text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Pangkat/Golongan</p>
                                    <select
                                        value={editForm.pangkat}
                                        onChange={(e) => setEditForm({ ...editForm, pangkat: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-white"
                                    >
                                        <option value="">Select Pangkat</option>
                                        {pangkatOptions.map((opt) => (
                                            <option key={opt.id} value={`${opt.name} (${opt.golongan})`}>
                                                {opt.name} ({opt.golongan})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Jabatan */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <Briefcase size={18} className="text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Jabatan</p>
                                    <select
                                        value={editForm.jabatan}
                                        onChange={(e) => setEditForm({ ...editForm, jabatan: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-white"
                                    >
                                        <option value="">Select Jabatan</option>
                                        {jabatanOptions.map((opt) => (
                                            <option key={opt.id} value={opt.name}>
                                                {opt.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <Shield size={18} className="text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Account Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${data.status
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                        }`}>
                                        {data.status ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Security Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Lock size={20} className="text-gray-500" />
                    Security & Password
                </h3>

                <form onSubmit={handlePasswordChange} className="max-w-xl space-y-6">
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg flex items-start gap-3">
                        <AlertCircle className="text-orange-600 shrink-0 mt-0.5" size={18} />
                        <div className="text-sm text-orange-800">
                            <p className="font-medium">Password Requirements</p>
                            <ul className="list-disc list-inside mt-1 text-orange-700/80 space-y-0.5">
                                <li>At least 6 characters long</li>
                                <li>Must be different from previous password</li>
                            </ul>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Current Password</label>
                            <Input
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                placeholder="Enter current password"
                                required
                                className="bg-gray-50/50"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">New Password</label>
                                <Input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    placeholder="New password"
                                    required
                                    className="bg-gray-50/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                                <Input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    placeholder="Confirm new password"
                                    required
                                    className="bg-gray-50/50"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <Button
                            type="submit"
                            variant="outline"
                            isLoading={passwordLoading}
                            className="flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                        >
                            <Key size={16} />
                            Update Password
                        </Button>
                    </div>
                </form>
            </div>

            {/* Timestamps */}
            <div className="mt-4 text-center">
                <div className="inline-flex items-center justify-center gap-6 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>Created: {formatDate(data.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>Last Updated: {formatDate(data.updatedAt)}</span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Profile;
