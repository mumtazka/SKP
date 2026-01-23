import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import ProgressBar from '@/components/common/ProgressBar';
import { Edit2, Eye } from 'lucide-react';
import { toast } from 'sonner';

const Progress = () => {
    const { user } = useAuth();
    const [skps, setSkps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSkps = async () => {
            try {
                const data = await api.skps.getByUser(user.id);
                // Filter for active/in-progress/pending
                setSkps(data);
            } catch (err) {
                toast.error("Failed to load progress");
            } finally {
                setLoading(false);
            }
        };
        fetchSkps();
    }, [user.id]);

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Approved': return 'success';
            case 'Pending': return 'warning';
            case 'Rejected': return 'destructive';
            default: return 'info';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">SKP Progress</h1>
                    <p className="text-gray-500">Track status and update progress of your targets</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {skps.map((skp) => (
                    <div key={skp.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <Badge variant={getStatusVariant(skp.status)}>{skp.status}</Badge>
                            <span className="text-xs text-gray-500 font-medium">{skp.year}</span>
                        </div>

                        <h3 className="font-bold text-gray-900 mb-2 truncate" title={skp.activity}>
                            {skp.activity}
                        </h3>

                        <div className="space-y-4">
                            <div className="text-sm text-gray-600 line-clamp-2">
                                {skp.target}
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Progress</span>
                                    <span>{skp.progress}%</span>
                                </div>
                                <ProgressBar value={skp.progress} className="h-2" />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" size="sm" className="w-full">
                                    <Eye className="mr-2 h-3 w-3" /> View
                                </Button>
                                <Button size="sm" className="w-full" disabled={skp.status === 'Completed'}>
                                    <Edit2 className="mr-2 h-3 w-3" /> Update
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
                {skps.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500">
                        No SKP entries found. Start by submitting a new proposal.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Progress;
