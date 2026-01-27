import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { DataTable } from '@/components/common/Table';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { Plus, Search, Edit2, Trash2, Filter, Download } from 'lucide-react';
import { toast } from 'sonner';

const UserManagement = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '', fullName: '', email: '', password: '', role: 'dosen', department: 'Teknik Informatika'
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await api.users.getAll();
            // Filter: If current user is 'admin', hide 'superadmin' users
            const filteredData = currentUser?.role === 'admin'
                ? data.filter(u => u.role !== 'superadmin')
                : data;
            setUsers(filteredData);
        } catch (err) {
            toast.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                const updates = { ...formData };
                if (!updates.password) delete updates.password;
                await api.users.update(editingUser.id, updates);
                toast.success("User updated successfully");
            } else {
                await api.users.create({ ...formData, status: true });
                toast.success("User created successfully");
            }
            setIsModalOpen(false);
            setEditingUser(null);
            setFormData({ username: '', fullName: '', email: '', password: '', role: 'dosen', department: 'Teknik Informatika' });
            fetchUsers();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            password: '',
            role: user.role,
            department: user.department || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await api.users.delete(id);
                toast.success("User deleted");
                fetchUsers();
            } catch (err) {
                toast.error("Failed to delete user");
            }
        }
    };

    const filteredUsers = users.filter(u =>
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            header: "User",
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <img src={row.photo} alt={row.username} className="h-8 w-8 rounded-full" />
                    <div>
                        <div className="font-medium text-gray-900">{row.fullName}</div>
                        <div className="text-xs text-gray-500">@{row.username}</div>
                    </div>
                </div>
            )
        },
        {
            header: "Role",
            cell: (row) => {
                const colors = { admin: 'purple', kepegawaian: 'warning', dosen: 'info' };
                return <Badge variant={colors[row.role]}>{row.role}</Badge>
            }
        },
        {
            header: "Department",
            accessorKey: "department"
        },
        {
            header: "Status",
            cell: (row) => (
                <Badge variant={row.status ? "success" : "destructive"}>
                    {row.status ? "Active" : "Inactive"}
                </Badge>
            )
        },
        {
            header: "Actions",
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
                        <Edit2 size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(row.id)}>
                        <Trash2 size={16} />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500">Manage system users and access roles</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} variant="gradient">
                        <Plus className="mr-2 h-4 w-4" /> Add User
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                        icon={Search}
                        placeholder="Search users..."
                        className="max-w-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button variant="outline" className="sm:ml-auto">
                        <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredUsers}
                    pagination={{ page: 1, limit: 10, total: filteredUsers.length }} // Mock pagination logic
                    onPageChange={() => { }}
                />
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingUser ? "Edit User" : "Add New User"}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateOrUpdate}>{editingUser ? "Update" : "Create"}</Button>
                    </>
                }
            >
                <form id="user-form" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Username</label>
                            <Input
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <Input
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <Input
                                type="text"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required={!editingUser}
                                placeholder={editingUser ? "Blank to keep current" : "Enter password"}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="dosen">Dosen</option>
                                <option value="kepegawaian">Kepegawaian</option>
                                <option value="admin">Admin</option>
                                {currentUser?.role === 'superadmin' && <option value="superadmin">Superadmin</option>}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Department</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            >
                                <option value="Teknik Informatika">Teknik Informatika</option>
                                <option value="Sistem Informasi">Sistem Informasi</option>
                                <option value="Teknik Elektro">Teknik Elektro</option>
                                <option value="HRD">HRD</option>
                            </select>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UserManagement;
