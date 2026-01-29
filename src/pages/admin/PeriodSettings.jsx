import React, { useState, useEffect } from 'react';
import { usePeriod } from '@/context/PeriodContext';
import { toast } from 'sonner';
import { Calendar, Save, Clock, CheckCircle, Edit3, Zap } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// New Auto Types included
const PERIOD_TYPES = [
    { value: 'annual', label: 'Tahunan (Manual)', description: 'Pilih tahun secara manual', type: 'manual' },
    { value: 'auto_quarter', label: 'Otomatis (Per Kuartal)', description: 'Mengikuti kuartal berjalan secara otomatis', type: 'auto' },
    { value: 'auto_semester', label: 'Otomatis (Per Semester)', description: 'Mengikuti semester berjalan secara otomatis', type: 'auto' },
    { value: 'custom', label: 'Kustom', description: 'Tentukan periode secara manual', type: 'manual' }
];

const DETAILED_TYPES = [
    { value: 'semester1', label: 'Semester 1', description: '1 Januari - 30 Juni' },
    { value: 'semester2', label: 'Semester 2', description: '1 Juli - 31 Desember' },
    { value: 'quarter1', label: 'Kuartal 1', description: '1 Januari - 31 Maret' },
    { value: 'quarter2', label: 'Kuartal 2', description: '1 April - 30 Juni' },
    { value: 'quarter3', label: 'Kuartal 3', description: '1 Juli - 30 September' },
    { value: 'quarter4', label: 'Kuartal 4', description: '1 Oktober - 31 Desember' },
];

const calculateDates = (type, year) => {
    switch (type) {
        case 'annual':
            return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
        case 'semester1':
            return { startDate: `${year}-01-01`, endDate: `${year}-06-30` };
        case 'semester2':
            return { startDate: `${year}-07-01`, endDate: `${year}-12-31` };
        case 'quarter1':
            return { startDate: `${year}-01-01`, endDate: `${year}-03-31` };
        case 'quarter2':
            return { startDate: `${year}-04-01`, endDate: `${year}-06-30` };
        case 'quarter3':
            return { startDate: `${year}-07-01`, endDate: `${year}-09-30` };
        case 'quarter4':
            return { startDate: `${year}-10-01`, endDate: `${year}-12-31` };
        default:
            return null;
    }
};

const PeriodSettings = () => {
    const { periodConfig, updatePeriodConfig, loading } = usePeriod();
    const currentYear = new Date().getFullYear();

    // We separate 'mainType' (Auto/Manual/Custom) from specific sub-types
    const [mainType, setMainType] = useState('annual');
    const [subType, setSubType] = useState(''); // For manual sub-selection like Q1, Q2

    const [formData, setFormData] = useState({
        type: 'annual',
        year: currentYear,
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (periodConfig) {
            setFormData({
                type: periodConfig.type || 'annual',
                year: periodConfig.year || currentYear,
                startDate: periodConfig.startDate || `${currentYear}-01-01`,
                endDate: periodConfig.endDate || `${currentYear}-12-31`
            });

            // Derive UI state from config
            const type = periodConfig.type;
            if (type.startsWith('auto_')) {
                setMainType(type);
                setSubType('');
            } else if (['semester1', 'semester2', 'quarter1', 'quarter2', 'quarter3', 'quarter4'].includes(type)) {
                setMainType('manual_sub');
                setSubType(type);
            } else if (type === 'custom') {
                setMainType('custom');
            } else {
                setMainType('annual');
            }
        }
    }, [periodConfig, currentYear]);

    const handleMainTypeChange = (value) => {
        setMainType(value);

        if (value.startsWith('auto_')) {
            // For auto types, we set the type directly and let Context handle date resolution
            setFormData(prev => ({
                ...prev,
                type: value
                // dates will be resolved by context/backend logic, specifically for saving `type`
            }));
            setSubType('');
        } else if (value === 'annual') {
            const dates = calculateDates('annual', formData.year);
            setFormData(prev => ({
                ...prev,
                type: 'annual',
                ...dates
            }));
            setSubType('');
        } else if (value === 'custom') {
            setFormData(prev => ({
                ...prev,
                type: 'custom'
            }));
            setSubType('');
        } else if (value === 'manual_sub') {
            // Default to something if switching to manual sub
            setSubType('semester1');
            const dates = calculateDates('semester1', formData.year);
            setFormData(prev => ({
                ...prev,
                type: 'semester1',
                ...dates
            }));
        }
    };

    const handleSubTypeChange = (val) => {
        setSubType(val);
        const dates = calculateDates(val, formData.year);
        setFormData(prev => ({
            ...prev,
            type: val,
            ...dates
        }));
    };

    const handleYearChange = (year) => {
        // If auto, updating year might not be relevant (it uses current), 
        // but maybe for manual overrides? No, auto uses current year.
        // Let's assume year selection applies to MANUAL modes.
        const currentType = formData.type;

        let dates = {};
        if (!currentType.startsWith('auto_') && currentType !== 'custom') {
            dates = calculateDates(currentType, year);
        }

        setFormData(prev => ({
            ...prev,
            year,
            ...dates
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const success = await updatePeriodConfig(formData);
            if (success) {
                toast.success('Pengaturan periode berhasil disimpan!');
            } else {
                toast.error('Gagal menyimpan pengaturan periode.');
            }
        } catch (error) {
            toast.error('Gagal menyimpan pengaturan periode.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Pengaturan Periode SKP</h1>
                <p className="text-gray-500 mt-1">Tentukan periode aktif untuk pengisian SKP</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="text-primary" size={20} />
                        Konfigurasi Periode
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Main Type Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Automatic Options */}
                        <button
                            onClick={() => handleMainTypeChange('auto_quarter')}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${mainType === 'auto_quarter'
                                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                                : 'border-gray-200 hover:border-purple-200'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Zap size={16} className={mainType === 'auto_quarter' ? 'text-purple-600' : 'text-gray-400'} />
                                <span className={`font-semibold ${mainType === 'auto_quarter' ? 'text-purple-700' : 'text-gray-800'}`}>
                                    Otomatis (Per Kuartal)
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Periode aktif berubah otomatis mengikuti kuartal saat ini.</p>
                        </button>

                        <button
                            onClick={() => handleMainTypeChange('auto_semester')}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${mainType === 'auto_semester'
                                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                                : 'border-gray-200 hover:border-purple-200'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Zap size={16} className={mainType === 'auto_semester' ? 'text-purple-600' : 'text-gray-400'} />
                                <span className={`font-semibold ${mainType === 'auto_semester' ? 'text-purple-700' : 'text-gray-800'}`}>
                                    Otomatis (Per Semester)
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Periode aktif berubah otomatis mengikuti semester saat ini.</p>
                        </button>

                        {/* Manual Options */}
                        <button
                            onClick={() => handleMainTypeChange('annual')}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${mainType === 'annual'
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {mainType === 'annual' && <CheckCircle size={16} className="text-primary" />}
                                <span className={`font-semibold ${mainType === 'annual' ? 'text-primary' : 'text-gray-800'}`}>
                                    Tahunan (Manual)
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">1 Januari - 31 Desember</p>
                        </button>

                        <button
                            onClick={() => handleMainTypeChange('manual_sub')}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${mainType === 'manual_sub'
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {mainType === 'manual_sub' && <CheckCircle size={16} className="text-primary" />}
                                <span className={`font-semibold ${mainType === 'manual_sub' ? 'text-primary' : 'text-gray-800'}`}>
                                    Manual (Semester/Kuartal)
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Pilih manual semester atau kuartal tertentu.</p>
                        </button>

                        <button
                            onClick={() => handleMainTypeChange('custom')}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${mainType === 'custom'
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {mainType === 'custom' && <CheckCircle size={16} className="text-primary" />}
                                <span className={`font-semibold ${mainType === 'custom' ? 'text-primary' : 'text-gray-800'}`}>
                                    Kustom
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Tentukan tanggal secara bebas.</p>
                        </button>
                    </div>

                    {/* Conditional: Manual Sub Selection */}
                    {mainType === 'manual_sub' && (
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in slide-in-from-top-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Spesifik Periode</label>
                            <div className="grid grid-cols-2 gap-2">
                                {DETAILED_TYPES.map(dt => (
                                    <button
                                        key={dt.value}
                                        onClick={() => handleSubTypeChange(dt.value)}
                                        className={`px-3 py-2 text-sm rounded-lg border transition-all text-left ${subType === dt.value
                                                ? 'bg-white border-primary text-primary font-medium shadow-sm'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {dt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Conditional: Year Selection (Available for all except Auto) */}
                    {!mainType.startsWith('auto_') && (
                        <div className="animate-in fade-in">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
                            <div className="flex gap-2 flex-wrap">
                                {years.map(year => (
                                    <button
                                        key={year}
                                        onClick={() => handleYearChange(year)}
                                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${formData.year === year
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                            }`}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Custom Date Range */}
                    {mainType === 'custom' && (
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-4 animate-in fade-in">
                            <div className="flex items-center gap-2 text-amber-800">
                                <Edit3 size={16} />
                                <span className="font-semibold text-sm">Tentukan Periode Manual</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Auto Notice */}
                    {mainType.startsWith('auto_') && (
                        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex gap-3 animate-in fade-in">
                            <Zap className="text-purple-600 mt-0.5" size={18} />
                            <div>
                                <h4 className="font-semibold text-purple-900 text-sm">Mode Otomatis Aktif</h4>
                                <p className="text-purple-700 text-sm mt-1">
                                    Sistem akan otomatis menentukan periode berdasarkan tanggal hari ini ({new Date().toLocaleDateString('id-ID')}).
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Preview (Dynamic) */}
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-800 mb-2">
                            <Clock size={16} />
                            <span className="font-semibold text-sm">Preview Periode Aktif</span>
                        </div>
                        <p className="text-blue-900 font-medium">
                            {/* If auto, show active label from context if available, otherwise "Calculating..." 
                                Actually, form data might not reflect active auto dates immediately until saved. 
                                But we can calculate preview here too just for display.
                            */}
                            {mainType.startsWith('auto_')
                                ? "Periode akan mengikuti tanggal berjalan saat ini."
                                : (formData.startDate && formData.endDate
                                    ? `${new Date(formData.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} — ${new Date(formData.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`
                                    : 'Pilih periode untuk melihat preview')
                            }
                        </p>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t">
                        <Button
                            onClick={handleSave}
                            isLoading={isSaving}
                            className="flex items-center gap-2"
                        >
                            <Save size={16} />
                            Simpan Pengaturan
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PeriodSettings;
