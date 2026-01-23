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
    Edit2,
    Save,
    X,
    Camera
} from 'lucide-react';

const Profile = () => {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        email: '',
        phoneNumber: '',
        address: ''
    });

    useEffect(() => {
        loadProfile();
    }, [user]);

    const loadProfile = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await api.users.getById(user.id);
            setProfileData(data);
            setEditForm({
                email: data.email || '',
                phoneNumber: data.phoneNumber || '',
                address: data.address || ''
            });
        } catch (error) {
            console.error('Failed to load profile:', error);
            // Fallback to user data from context
            setProfileData(user);
            setEditForm({
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                address: user.address || ''
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
            setEditing(false);
            loadProfile();
        } catch (error) {
            toast.error('Failed to update profile');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const getRoleBadge = (role) => {
        const roleConfig = {
            admin: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Administrator' },
            kepegawaian: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Kepegawaian' },
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
                {!editing ? (
                    <Button
                        variant="outline"
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2"
                    >
                        <Edit2 size={16} />
                        Edit Profile
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setEditing(false);
                                setEditForm({
                                    email: data.email || '',
                                    phoneNumber: data.phoneNumber || '',
                                    address: data.address || ''
                                });
                            }}
                            className="flex items-center gap-2"
                        >
                            <X size={16} />
                            Cancel
                        </Button>
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
                )}
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
                                src={data.photo}
                                alt={data.fullName}
                                className="h-32 w-32 rounded-2xl border-4 border-white shadow-lg object-cover bg-gray-100"
                            />
                            <button className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors">
                                <Camera size={16} className="text-gray-600" />
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
                                    {editing ? (
                                        <Input
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            placeholder="Enter email"
                                            className="mt-1"
                                        />
                                    ) : (
                                        <p className="font-medium text-gray-900">{data.email}</p>
                                    )}
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <Phone size={18} className="text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Phone Number</p>
                                    {editing ? (
                                        <Input
                                            value={editForm.phoneNumber}
                                            onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                            placeholder="Enter phone number"
                                            className="mt-1"
                                        />
                                    ) : (
                                        <p className="font-medium text-gray-900">{data.phoneNumber || '-'}</p>
                                    )}
                                </div>
                            </div>

                            {/* Address */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <MapPin size={18} className="text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Address</p>
                                    {editing ? (
                                        <textarea
                                            value={editForm.address}
                                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                            placeholder="Enter address"
                                            rows={2}
                                            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                                        />
                                    ) : (
                                        <p className="font-medium text-gray-900">{data.address || '-'}</p>
                                    )}
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
                                    <p className="font-medium text-gray-900">{data.identityNumber || '-'}</p>
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

                            {/* Jabatan */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <Briefcase size={18} className="text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Jabatan</p>
                                    <p className="font-medium text-gray-900">{data.jabatan || '-'}</p>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <BadgeCheck size={18} className="text-gray-600" />
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

                    {/* Timestamps */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-500">
                                <Calendar size={14} />
                                <span>Created: {formatDate(data.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                                <Calendar size={14} />
                                <span>Last Updated: {formatDate(data.updatedAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
