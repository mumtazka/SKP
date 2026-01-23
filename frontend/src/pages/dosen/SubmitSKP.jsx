import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import ProgressBar from '@/components/common/ProgressBar';
import FileUpload from '@/components/common/FileUpload';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Save, Check } from 'lucide-react';

const steps = [
    { id: 1, title: 'Basic Information' },
    { id: 2, title: 'Details' },
    { id: 3, title: 'Timeline & Docs' },
    { id: 4, title: 'Review' }
];

const SubmitSKP = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        year: new Date().getFullYear().toString(),
        activity: '',
        category: '',
        target: '',
        objectives: '',
        output: '',
        startDate: '',
        endDate: '',
        files: []
    });

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            await api.skps.create({
                ...formData,
                files: formData.files.map(f => f.name) // Just storing names for mock
            });
            toast.success("SKP submitted successfully");
            navigate('/dosen/progress');
        } catch (err) {
            toast.error("Failed to submit SKP");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Ajukan SKP Baru</h1>
                <p className="text-gray-500">Form pengajuan sasaran kinerja pegawai</p>
            </div>

            {/* Progress */}
            <div className="space-y-2">
                <ProgressBar value={((currentStep - 1) / (steps.length - 1)) * 100} />
                <div className="flex justify-between text-sm font-medium text-gray-500">
                    {steps.map(step => (
                        <span key={step.id} className={currentStep >= step.id ? "text-primary" : ""}>
                            {step.title}
                        </span>
                    ))}
                </div>
            </div>

            {/* Form Steps */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

                {currentStep === 1 && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900">Step 1: Basic Information</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tahun SKP</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={formData.year}
                                    onChange={(e) => handleChange('year', e.target.value)}
                                >
                                    <option value="2023">2023</option>
                                    <option value="2024">2024</option>
                                    <option value="2025">2025</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kegiatan</label>
                                <Input
                                    placeholder="Contoh: Penelitian..."
                                    value={formData.activity}
                                    onChange={(e) => handleChange('activity', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={formData.category}
                                    onChange={(e) => handleChange('category', e.target.value)}
                                >
                                    <option value="">Pilih Kategori</option>
                                    <option value="Pendidikan">Pendidikan</option>
                                    <option value="Penelitian">Penelitian</option>
                                    <option value="Pengabdian">Pengabdian</option>
                                    <option value="Penunjang">Penunjang</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900">Step 2: Activity Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Target Kuantitas/Kualitas</label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="Deskripsi target..."
                                    value={formData.target}
                                    onChange={(e) => handleChange('target', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sasaran / Objectives</label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="Sasaran kegiatan..."
                                    value={formData.objectives}
                                    onChange={(e) => handleChange('objectives', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Output Expected</label>
                                <Input
                                    placeholder="Contoh: Laporan, Jurnal..."
                                    value={formData.output}
                                    onChange={(e) => handleChange('output', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900">Step 3: Timeline & Documents</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <Input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => handleChange('startDate', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <Input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => handleChange('endDate', e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supporting Documents</label>
                            <FileUpload onFilesSelected={(files) => handleChange('files', files)} />
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900">Step 4: Review & Submit</h3>
                        <div className="bg-gray-50 rounded-lg p-6 space-y-4 text-sm">
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-gray-500">Year:</span>
                                <span className="col-span-2 font-medium">{formData.year}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-gray-500">Activity:</span>
                                <span className="col-span-2 font-medium">{formData.activity}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-gray-500">Category:</span>
                                <span className="col-span-2 font-medium">{formData.category}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-gray-500">Timeline:</span>
                                <span className="col-span-2 font-medium">{formData.startDate} to {formData.endDate}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-gray-500">Files:</span>
                                <span className="col-span-2 font-medium">{formData.files.length} attached</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                            <Save className="h-4 w-4" />
                            Draft auto-saved. You can review before final submission.
                        </div>
                    </div>
                )}

            </div>

            {/* Navigation Actions */}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Button>

                {currentStep < 4 ? (
                    <Button onClick={nextStep}>
                        Next <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} variant="gradient" isLoading={isLoading}>
                        Submit Application <Check className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
};

export default SubmitSKP;
