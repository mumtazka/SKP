import React, { useCallback, useState } from 'react';
import { UploadCloud, X, File } from 'lucide-react';
import { cn } from '@/lib/utils';

const FileUpload = ({ onFilesSelected, maxFiles = 3 }) => {
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState([]);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const newFiles = Array.from(e.dataTransfer.files);
            setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
            onFilesSelected && onFilesSelected([...files, ...newFiles].slice(0, maxFiles));
        }
    }, [files, maxFiles, onFilesSelected]);

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
            onFilesSelected && onFilesSelected([...files, ...newFiles].slice(0, maxFiles));
        }
    };

    const removeFile = (idx) => {
        const newFiles = files.filter((_, i) => i !== idx);
        setFiles(newFiles);
        onFilesSelected && onFilesSelected(newFiles);
    };

    return (
        <div className="space-y-4">
            <div
                className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                    dragActive ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/50"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload').click()}
            >
                <div className="flex flex-col items-center gap-2">
                    <UploadCloud className="h-10 w-10 text-primary/50" />
                    <div className="text-sm font-medium text-gray-700">
                        Click to upload or drag and drop
                    </div>
                    <p className="text-xs text-gray-500">PDF, DOCX up to 10MB</p>
                </div>
                <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleChange}
                />
            </div>

            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-3">
                                <File className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">{file.name}</p>
                                    <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button
                                onClick={() => removeFile(idx)}
                                className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileUpload;
