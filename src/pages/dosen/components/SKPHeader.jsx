import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, X, Save, User as UserIcon, Building2, Briefcase, Hash, Award } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';

const InfoRow = ({ label, value }) => (
    <div className="grid grid-cols-[140px,1fr] py-1">
        <span className="text-gray-600 font-medium text-xs sm:text-sm">{label}</span>
        <span className="text-gray-900 font-semibold text-xs sm:text-sm">{value}</span>
    </div>
);

const SKPHeader = ({ employee, evaluator }) => {
    const [pangkatOptions, setPangkatOptions] = useState([]);
    const [jabatanOptions, setJabatanOptions] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({});

    React.useEffect(() => {
        if (isEditing) {
            const fetchOptions = async () => {
                try {
                    const [pangkats, jabatans] = await Promise.all([
                        api.references.getPangkats(),
                        api.references.getJabatans()
                    ]);
                    setPangkatOptions(pangkats);
                    setJabatanOptions(jabatans);
                } catch (error) {
                    console.error('Failed to fetch options', error);
                    toast.error('Gagal memuat opsi pangkat/jabatan');
                }
            };
            fetchOptions();
        }
    }, [isEditing]);

    const handleEditClick = () => {
        setFormData({
            fullName: employee?.fullName || '',
            identityNumber: employee?.identityNumber || '',
            pangkat: employee?.pangkat || '',
            jabatan: employee?.jabatan || '',
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!employee?.id) return;
        setIsSaving(true);
        try {
            await api.users.update(employee.id, formData);
            toast.success('Data pegawai berhasil diperbarui');
            setIsEditing(false);
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Gagal memperbarui data pegawai');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-purple-50/50 border border-purple-200 rounded-lg overflow-hidden flex flex-col md:flex-row">
            {/* Employee Section */}
            <div className="flex-1 p-4 border-b md:border-b-0 md:border-r border-purple-200">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-purple-700 font-bold text-sm tracking-wide bg-purple-100 px-3 py-1 rounded inline-block border border-purple-200">
                        Pegawai yang Dinilai
                    </h3>
                    <button
                        onClick={handleEditClick}
                        className="text-purple-500 hover:text-purple-700 transition-colors bg-purple-100 p-1 rounded-md hover:bg-purple-200"
                        title="Edit Data Pegawai"
                    >
                        <Pencil size={14} />
                    </button>
                </div>
                <div className="space-y-1">
                    <InfoRow label="Nama" value={employee?.fullName || '-'} />
                    <InfoRow label="NIP" value={employee?.identityNumber || '-'} />
                    <InfoRow label="Pangkat/Gol." value={employee?.pangkat || '-'} />
                    <InfoRow label="Jabatan" value={employee?.jabatan || '-'} />
                    <InfoRow label="Unit Kerja" value={employee?.departmentName || '-'} />
                </div>
            </div>

            {/* Edit Modal */}
            {isEditing && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900">Edit Data Pegawai</h3>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <UserIcon size={14} /> Nama Lengkap
                                </label>
                                <Input
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    placeholder="Nama Lengkap"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Hash size={14} /> NIP
                                </label>
                                <Input
                                    value={formData.identityNumber}
                                    onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
                                    placeholder="Nomor Induk Pegawai"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Award size={14} /> Pangkat/Golongan
                                </label>
                                <select
                                    value={formData.pangkat}
                                    onChange={(e) => setFormData({ ...formData, pangkat: e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="">Pilih Pangkat/Golongan</option>
                                    {pangkatOptions.map((opt) => (
                                        <option key={opt.id} value={`${opt.name} (${opt.golongan})`}>
                                            {opt.name} ({opt.golongan})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Briefcase size={14} /> Jabatan
                                </label>
                                <select
                                    value={formData.jabatan}
                                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="">Pilih Jabatan</option>
                                    {jabatanOptions.map((opt) => (
                                        <option key={opt.id} value={opt.name}>
                                            {opt.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Unit Kerja usually managed by admin/department relation, typically not direct edit here unless we want to allow text override. 
                                For safety, let's keep it informative or readonly if derived. 
                                Providing read-only view for context. */}
                            <div className="space-y-2 opacity-60">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Building2 size={14} /> Unit Kerja (Hubungi Admin untuk ubah)
                                </label>
                                <Input
                                    value={employee?.departmentName || ''}
                                    disabled
                                    className="bg-gray-50"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <Button
                                variant="ghost"
                                onClick={() => setIsEditing(false)}
                                disabled={isSaving}
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={handleSave}
                                isLoading={isSaving}
                                className="flex items-center gap-2"
                            >
                                <Save size={16} /> Simpan Perubahan
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Evaluator Section */}
            <div className="flex-1 p-4 bg-purple-50/80">
                <div className="mb-3">
                    <h3 className="text-purple-700 font-bold text-sm tracking-wide bg-purple-100 px-3 py-1 rounded inline-block border border-purple-200">
                        Pejabat Penilai Kinerja
                    </h3>
                </div>
                <div className="space-y-1">
                    <InfoRow label="Nama" value={evaluator?.fullName || '-'} />
                    <InfoRow label="NIP" value={evaluator?.identityNumber || '-'} />
                    <InfoRow label="Pangkat/Gol." value={evaluator?.pangkat || '-'} />
                    <InfoRow label="Jabatan" value={evaluator?.jabatan || '-'} />
                    <InfoRow label="Unit Kerja" value={evaluator?.unit || '-'} />
                </div>
            </div>
        </div>
    );
};

export default SKPHeader;
