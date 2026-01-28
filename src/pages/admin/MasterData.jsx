import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { Plus, Search, Edit2, Trash2, Database, Briefcase, Award, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const MasterData = () => {
    const [activeTab, setActiveTab] = useState('pangkat');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({ name: '', code: '', golongan: '', head: '' });

    // For Department/Unit Kerja, we have extra fields like 'code' and 'head'.
    // For Pangkat, we have 'golongan'.
    // For Jabatan, mostly just 'name'.

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let result = [];
            if (activeTab === 'pangkat') {
                result = await api.references.getPangkats();
            } else if (activeTab === 'jabatan') {
                result = await api.references.getJabatans();
            } else if (activeTab === 'unit_kerja') {
                result = await api.departments.getAll();
            }
            setData(result || []);
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat data");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (activeTab === 'pangkat') {
                if (editingItem) {
                    await api.references.updatePangkat(editingItem.id, formData);
                } else {
                    await api.references.createPangkat(formData);
                }
            } else if (activeTab === 'jabatan') {
                if (editingItem) {
                    await api.references.updateJabatan(editingItem.id, formData);
                } else {
                    await api.references.createJabatan(formData);
                }
            } else if (activeTab === 'unit_kerja') {
                if (editingItem) {
                    await api.departments.update(editingItem.id, formData);
                } else {
                    await api.departments.create(formData);
                }
            }
            toast.success("Data berhasil disimpan");
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Gagal menyimpan data");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Apakah anda yakin ingin menghapus data ini?")) return;
        try {
            if (activeTab === 'pangkat') {
                await api.references.deletePangkat(id);
            } else if (activeTab === 'jabatan') {
                await api.references.deleteJabatan(id);
            } else if (activeTab === 'unit_kerja') {
                await api.departments.delete(id);
            }
            toast.success("Data berhasil dihapus");
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Gagal menghapus data");
        }
    };

    const columns = useMemo(() => {
        if (activeTab === 'pangkat') {
            return [
                { header: 'Nama Pangkat', accessorKey: 'name' },
                { header: 'Golongan', accessorKey: 'golongan' },
            ];
        } else if (activeTab === 'jabatan') {
            return [
                { header: 'Nama Jabatan', accessorKey: 'name' },
            ];
        } else {
            return [
                { header: 'Nama Unit Kerja', accessorKey: 'name' },
                { header: 'Kode', accessorKey: 'code' },
                { header: 'Kepala Unit', accessorKey: 'head' },
            ];
        }
    }, [activeTab]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Data Master</h1>
                <p className="text-gray-500">Kelola data referensi sistem</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 rounded-xl bg-gray-100 p-1 w-fit">
                {[
                    { id: 'pangkat', label: 'Pangkat/Golongan', icon: Award },
                    { id: 'jabatan', label: 'Jabatan', icon: Briefcase },
                    { id: 'unit_kerja', label: 'Unit Kerja', icon: Building2 },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === tab.id
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold capitalize">
                        Daftar {activeTab.replace('_', ' ')}
                    </h2>
                    <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} variant="gradient">
                        <Plus className="mr-2 h-4 w-4" /> Tambah Baru
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">No</th>
                                {activeTab === 'pangkat' && <th className="px-6 py-3">Nama Pangkat</th>}
                                {activeTab === 'pangkat' && <th className="px-6 py-3">Golongan</th>}
                                {activeTab === 'jabatan' && <th className="px-6 py-3">Nama Jabatan</th>}
                                {activeTab === 'unit_kerja' && <th className="px-6 py-3">Nama Unit</th>}
                                {activeTab === 'unit_kerja' && <th className="px-6 py-3">Kode</th>}
                                {activeTab === 'unit_kerja' && <th className="px-6 py-3">Kepala</th>}
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8">Loading...</td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500">Tidak ada data</td>
                                </tr>
                            ) : (
                                data.map((item, index) => (
                                    <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{index + 1}</td>

                                        {activeTab === 'pangkat' && (
                                            <>
                                                <td className="px-6 py-4">{item.name}</td>
                                                <td className="px-6 py-4"><Badge variant="outline">{item.golongan}</Badge></td>
                                            </>
                                        )}

                                        {activeTab === 'jabatan' && (
                                            <td className="px-6 py-4">{item.name}</td>
                                        )}

                                        {activeTab === 'unit_kerja' && (
                                            <>
                                                <td className="px-6 py-4 font-medium">{item.name}</td>
                                                <td className="px-6 py-4">{item.code || '-'}</td>
                                                <td className="px-6 py-4">{item.head || '-'}</td>
                                            </>
                                        )}

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setFormData(item); setIsModalOpen(true); }}>
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`${editingItem ? 'Edit' : 'Tambah'} ${activeTab === 'pangkat' ? 'Pangkat' : activeTab === 'jabatan' ? 'Jabatan' : 'Unit Kerja'}`}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button onClick={handleSave}>Simpan</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nama</label>
                        <Input
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder={`Nama ${activeTab}`}
                        />
                    </div>

                    {activeTab === 'pangkat' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Golongan</label>
                            <Input
                                value={formData.golongan || ''}
                                onChange={e => setFormData({ ...formData, golongan: e.target.value })}
                                placeholder="Contoh: IV/a"
                            />
                        </div>
                    )}

                    {activeTab === 'unit_kerja' && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Kode Unit</label>
                                <Input
                                    value={formData.code || ''}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="Contoh: FIK"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Kepala Unit (Nama)</label>
                                <Input
                                    value={formData.head || ''}
                                    onChange={e => setFormData({ ...formData, head: e.target.value })}
                                    placeholder="Nama Kepala Unit"
                                />
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default MasterData;
