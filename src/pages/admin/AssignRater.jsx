import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Plus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const AssignRater = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [selectedLecturer, setSelectedLecturer] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        pejabatPenilaiId: '',
        atasanPejabatPenilaiId: ''
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const allUsers = await api.users.getAll();
            setUsers(allUsers);
        } catch (error) {
            console.error("Failed to load users", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const lecturers = users.filter(u => u.role === 'dosen');
    const filteredLecturers = lecturers.filter(l =>
        l.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAssignClick = (lecturer) => {
        setSelectedLecturer(lecturer);
        // If lecturer already has assignments (mocked check), populate form
        setFormData({
            pejabatPenilaiId: lecturer.raters?.pejabatPenilaiId || '',
            atasanPejabatPenilaiId: lecturer.raters?.atasanPejabatPenilaiId || ''
        });
        setIsModalOpen(true);
    };

    const handleSaveAssignment = async () => {
        if (!formData.pejabatPenilaiId || !formData.atasanPejabatPenilaiId) {
            toast.error("Please select both raters");
            return;
        }

        try {
            // Mock API call to save assignment
            // In reality, we would call api.users.update or a dedicated endpoint
            // For now, we update local state or use api.users.update to adding a 'raters' field

            await api.users.update(selectedLecturer.id, {
                raters: {
                    pejabatPenilaiId: formData.pejabatPenilaiId,
                    atasanPejabatPenilaiId: formData.atasanPejabatPenilaiId
                }
            });

            toast.success(`Raters assigned for ${selectedLecturer.fullName}`);
            setIsModalOpen(false);
            loadUsers(); // Reload to see changes
        } catch (error) {
            toast.error("Failed to save assignment");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Assign Raters</h1>
                    <p className="text-gray-500">Manage Pejabat Penilai & Atasan Pejabat Penilai for Lecturers</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search lecturers..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Lecturers Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredLecturers.map((lecturer) => {
                    const pejabatPenilai = users.find(u => u.id === lecturer.raters?.pejabatPenilaiId);
                    const atasanPejabatPenilai = users.find(u => u.id === lecturer.raters?.atasanPejabatPenilaiId);

                    return (
                        <Card key={lecturer.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <img
                                    src={lecturer.photo}
                                    alt={lecturer.fullName}
                                    className="h-12 w-12 rounded-full object-cover border border-gray-100"
                                />
                                <div className="overflow-hidden">
                                    <CardTitle className="text-base truncate" title={lecturer.fullName}>
                                        {lecturer.fullName}
                                    </CardTitle>
                                    <CardDescription className="truncate">
                                        {lecturer.departmentName || 'No Dept'}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 pt-2">
                                    <div className="text-sm">
                                        <p className="text-gray-500 text-xs mb-1">Pejabat Penilai</p>
                                        <div className="flex items-center gap-2">
                                            {pejabatPenilai ? (
                                                <span className="font-medium truncate block">{pejabatPenilai.fullName}</span>
                                            ) : (
                                                <span className="text-gray-400 italic">Not assigned</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-sm">
                                        <p className="text-gray-500 text-xs mb-1">Atasan Pejabat Penilai</p>
                                        <div className="flex items-center gap-2">
                                            {atasanPejabatPenilai ? (
                                                <span className="font-medium truncate block">{atasanPejabatPenilai.fullName}</span>
                                            ) : (
                                                <span className="text-gray-400 italic">Not assigned</span>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full mt-2 gap-2"
                                        onClick={() => handleAssignClick(lecturer)}
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        {lecturer.raters ? 'Edit Assignment' : 'Assign Raters'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {filteredLecturers.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No lecturers found matching your search.
                    </div>
                )}
            </div>

            {/* Assignment Modal */}
            {isModalOpen && selectedLecturer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Assign Raters</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-3 mb-4">
                                <img
                                    src={selectedLecturer.photo}
                                    alt={selectedLecturer.fullName}
                                    className="h-10 w-10 rounded-full"
                                />
                                <div>
                                    <p className="text-sm text-gray-500">Assigning for:</p>
                                    <p className="font-medium text-blue-900">{selectedLecturer.fullName}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Pejabat Penilai</label>
                                <select
                                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={formData.pejabatPenilaiId}
                                    onChange={(e) => setFormData({ ...formData, pejabatPenilaiId: e.target.value })}
                                >
                                    <option value="">Select Pejabat Penilai</option>
                                    {users.filter(u => u.id !== selectedLecturer.id).map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.fullName} ({u.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Atasan Pejabat Penilai</label>
                                <select
                                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={formData.atasanPejabatPenilaiId}
                                    onChange={(e) => setFormData({ ...formData, atasanPejabatPenilaiId: e.target.value })}
                                >
                                    <option value="">Select Atasan Pejabat Penilai</option>
                                    {users.filter(u => u.id !== selectedLecturer.id).map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.fullName} ({u.role})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveAssignment}>Save Assignment</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignRater;
