import React from 'react';
import { Pencil } from 'lucide-react';

const InfoRow = ({ label, value }) => (
    <div className="grid grid-cols-[140px,1fr] py-1">
        <span className="text-gray-600 font-medium text-xs sm:text-sm">{label}</span>
        <span className="text-gray-900 font-semibold text-xs sm:text-sm">{value}</span>
    </div>
);

const SKPHeader = ({ employee, evaluator }) => {
    return (
        <div className="bg-purple-50/50 border border-purple-200 rounded-lg overflow-hidden flex flex-col md:flex-row">
            {/* Employee Section */}
            <div className="flex-1 p-4 border-b md:border-b-0 md:border-r border-purple-200">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-purple-700 font-bold text-sm tracking-wide bg-purple-100 px-3 py-1 rounded inline-block border border-purple-200">
                        Pegawai yang Dinilai
                    </h3>
                    <button className="text-purple-500 hover:text-purple-700 transition-colors">
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

            {/* Evaluator Section */}
            <div className="flex-1 p-4 bg-purple-50/80">
                <div className="mb-3">
                    <h3 className="text-purple-700 font-bold text-sm tracking-wide bg-purple-100 px-3 py-1 rounded inline-block border border-purple-200">
                        Pejabat Penilai Kinerja
                    </h3>
                </div>
                <div className="space-y-1">
                    <InfoRow label="Nama" value={evaluator?.fullName || 'Prof. Dr. ALI SATIA GRAHA, S.Pd., M.Kes.'} />
                    <InfoRow label="NIP" value={evaluator?.identityNumber || '197504162003121002'} />
                    <InfoRow label="Pangkat/Gol." value={evaluator?.pangkat || 'Pembina Utama Madya, IV/d'} />
                    <InfoRow label="Jabatan" value={evaluator?.jabatan || 'S.3.4.5'} />
                    <InfoRow label="Unit Kerja" value={evaluator?.unit || 'Universitas Negeri Yogyakarta'} />
                </div>
            </div>
        </div>
    );
};

export default SKPHeader;
