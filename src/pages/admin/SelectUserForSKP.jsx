import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, FileText, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const SelectUserForSKP = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const allUsers = await api.users.getAll();
            setUsers(allUsers);
        } catch (error) {
            console.error("Failed to load users", error);
            toast.error("Gagal memuat pengguna");
        } finally {
            setLoading(false);
        }
    };

    // Filter users: Dosen and Penilai can have SKP
    const eligibleUsers = users.filter(u => ['dosen', 'penilai', 'kepegawaian'].includes(u.role));

    const filteredUsers = eligibleUsers.filter(u =>
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectUser = (user) => {
        navigate('/dosen/submit', { state: { targetUser: user } });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Ajukan SKP (Admin)</h1>
                    <p className="text-gray-500">Pilih pengguna untuk dibuatkan SKP atas nama mereka</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Cari pengguna..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Users Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.map((user) => (
                    <Card key={user.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => handleSelectUser(user)}>
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <img
                                src={user.photo}
                                alt={user.fullName}
                                className="h-12 w-12 rounded-full object-cover border border-gray-100 group-hover:border-primary/50 transition-colors"
                            />
                            <div className="overflow-hidden">
                                <CardTitle className="text-base truncate group-hover:text-primary transition-colors" title={user.fullName}>
                                    {user.fullName}
                                </CardTitle>
                                <CardDescription className="truncate capitalize">
                                    {user.role} • {user.departmentName || 'No Dept'}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Button
                                className="w-full mt-2 gap-2 group-hover:bg-primary group-hover:text-white transition-colors"
                                variant="outline"
                            >
                                <FileText className="h-4 w-4" />
                                Buat SKP
                                <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}

                {filteredUsers.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        Tidak ada pengguna yang cocok.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SelectUserForSKP;
