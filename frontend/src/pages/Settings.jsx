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
    Lock,
    Save,
    Shield,
    Image,
    AlertCircle
} from 'lucide-react';

const Settings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);

    // Profile Form State
    const [profileForm, setProfileForm] = useState({
        email: '',
        phoneNumber: '',
        address: '',
        photo: ''
    });

    // Password Form State
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (user) {
            setProfileForm({
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                address: user.address || '',
                photo: user.photo || ''
            });
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.auth.updateProfile(user.id, profileForm);
            toast.success('Profile settings updated successfully');
            // Force reload to reflect changes in context/navbar
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
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

        setLoading(true);
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
            setLoading(false);
        }
    };

    const TabButton = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500">Manage your account preferences and security</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Tabs Header */}
                <div className="flex border-b border-gray-100">
                    <TabButton id="general" icon={User} label="General" />
                    <TabButton id="security" icon={Lock} label="Security" />
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <form onSubmit={handleProfileUpdate} className="space-y-6">
                            <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                                <img
                                    src={profileForm.photo}
                                    alt="Preview"
                                    className="h-20 w-20 rounded-full border border-gray-200 object-cover"
                                />
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Profile Photo</h3>
                                    <div className="flex gap-4">
                                        <Input
                                            icon={Image}
                                            placeholder="Paste image URL here..."
                                            value={profileForm.photo}
                                            onChange={(e) => setProfileForm({ ...profileForm, photo: e.target.value })}
                                            className="flex-1"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        We support direct image URLs (e.g., from ui-avatars.com or imgur).
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                                    <Input
                                        icon={Mail}
                                        type="email"
                                        value={profileForm.email}
                                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                    <Input
                                        icon={Phone}
                                        type="tel"
                                        value={profileForm.phoneNumber}
                                        onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                                        placeholder="+62 8..."
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700">Address</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <textarea
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm min-h-[100px]"
                                            value={profileForm.address}
                                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                            placeholder="Full address..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-100">
                                <Button
                                    type="submit"
                                    variant="gradient"
                                    isLoading={loading}
                                    className="flex items-center gap-2"
                                >
                                    <Save size={16} />
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <form onSubmit={handlePasswordChange} className="max-w-md space-y-6">
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
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">New Password</label>
                                    <Input
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                        placeholder="Enter new password"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                                    <Input
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                        placeholder="Confirm new password"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-100">
                                <Button
                                    type="submit"
                                    variant="gradient"
                                    isLoading={loading}
                                    className="flex items-center gap-2"
                                >
                                    <Shield size={16} />
                                    Change Password
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
