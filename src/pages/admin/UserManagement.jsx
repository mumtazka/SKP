import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { DataTable } from '@/components/common/Table';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const UserManagement = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [pangkatOptions, setPangkatOptions] = useState([]);
    const [jabatanOptions, setJabatanOptions] = useState([]);
    const [formData, setFormData] = useState({
        username: '', fullName: '', email: '', password: '', role: 'dosen', departmentId: '', pangkat: '', jabatan: ''
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
            toast.error("Gagal memuat daftar pengguna");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchDepartments();
        fetchOptions();
    }, []);

    const fetchOptions = async () => {
        try {
            const [pangkats, jabatans] = await Promise.all([
                api.references.getPangkats(),
                api.references.getJabatans()
            ]);
            setPangkatOptions(pangkats);
            setJabatanOptions(jabatans);
        } catch (err) {
            console.error('Failed to fetch options:', err);
        }
    };

    const fetchDepartments = async () => {
        try {
            const data = await api.departments.getAll();
            setDepartments(data);
        } catch (err) {
            console.error('Failed to fetch departments:', err);
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                const updates = { ...formData };
                if (!updates.password) delete updates.password;
                await api.users.update(editingUser.id, updates);
                toast.success("Pengguna berhasil diperbarui");
            } else {
                await api.users.create({ ...formData, status: true });
                toast.success("Pengguna berhasil dibuat");
            }
            setIsModalOpen(false);
            setEditingUser(null);
            setFormData({ username: '', fullName: '', email: '', password: '', role: 'dosen', departmentId: '', pangkat: '', jabatan: '' });
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
            departmentId: user.departmentId || '',
            pangkat: user.pangkat || '',
            jabatan: user.jabatan || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
            try {
                await api.users.delete(id);
                toast.success("Pengguna dihapus");
                fetchUsers();
            } catch (err) {
                toast.error("Gagal menghapus pengguna");
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
            header: "Pengguna",
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
            header: "Peran",
            cell: (row) => {
                const colors = { admin: 'purple', penilai: 'warning', dosen: 'info' };
                return <Badge variant={colors[row.role] || 'default'}>{row.role}</Badge>
            }
        },
        {
            header: "Departemen",
            accessorKey: "departmentName"
        },
        {
            header: "Status",
            cell: (row) => (
                <Badge variant={row.status ? "success" : "destructive"}>
                    {row.status ? "Aktif" : "Tidak Aktif"}
                </Badge>
            )
        },
        {
            header: "Aksi",
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
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
                    <p className="text-gray-500">Kelola pengguna sistem dan hak akses</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} variant="gradient">
                        <Plus className="mr-2 h-4 w-4" /> Tambah Pengguna
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                        icon={Search}
                        placeholder="Cari pengguna..."
                        className="max-w-md w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
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
                title={editingUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button onClick={handleCreateOrUpdate}>{editingUser ? "Perbarui" : "Buat"}</Button>
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
                            <label className="text-sm font-medium">Nama Lengkap</label>
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
                            <label className="text-sm font-medium">Kata Sandi</label>
                            <Input
                                type="text"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required={!editingUser}
                                placeholder={editingUser ? "Kosongkan untuk tetap" : "Masukkan kata sandi"}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Pangkat/Golongan</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.pangkat}
                                onChange={(e) => setFormData({ ...formData, pangkat: e.target.value })}
                            >
                                <option value="">Pilih Pangkat</option>
                                {pangkatOptions.map((opt) => (
                                    <option key={opt.id} value={`${opt.name} (${opt.golongan})`}>
                                        {opt.name} ({opt.golongan})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Jabatan</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.jabatan}
                                onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                            >
                                <option value="">Pilih Jabatan</option>
                                {jabatanOptions.map((opt) => (
                                    <option key={opt.id} value={opt.name}>
                                        {opt.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Peran</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="dosen">Dosen</option>
                                <option value="penilai">Penilai</option>
                                <option value="admin">Admin</option>
                                {currentUser?.role === 'superadmin' && <option value="superadmin">Superadmin</option>}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Departemen</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.departmentId}
                                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                            >
                                <option value="" disabled hidden>Pilih Departemen</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </form>
            </Modal>
        </div >
    );
};

export default UserManagement;
