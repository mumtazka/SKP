import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Plus, Trash2, Columns, MessageSquare } from 'lucide-react';
import { Button } from '@/components/common/Button';

// Editor Component for a single cell
const EditorCell = ({ content, onUpdate, onFocus, readOnly = false }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({ placeholder: 'Klik untuk mengisi...' }),
        ],
        content: content,
        editable: !readOnly,
        onUpdate: ({ editor }) => !readOnly && onUpdate(editor.getHTML()),
        onFocus: ({ editor }) => !readOnly && onFocus(editor),
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            if (editor.isEmpty && content) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    // Update editable state when readOnly changes
    useEffect(() => {
        if (editor) {
            editor.setEditable(!readOnly);
        }
    }, [readOnly, editor]);

    return (
        <div className="flex-1 min-w-[200px] border-r-2 border-purple-200 last:border-r-0 relative bg-white hover:bg-purple-50/30 transition-colors">
            <EditorContent
                editor={editor}
                className={`prose prose-sm prose-purple max-w-none p-4 min-h-[60px] outline-none ${readOnly ? 'cursor-default select-none bg-gray-50/50' : ''}`}
                style={{ lineHeight: '1.6' }}
            />
        </div>
    );
};

const RowItem = ({ columns = [], index, onUpdate, onFocus, onDelete, isActive, readOnly = false }) => {
    const isEven = index % 2 === 0;

    return (
        <div className={`flex border-b-2 border-purple-200 last:border-b-0 group min-h-[60px] transition-all ${isActive ? 'bg-purple-100/50 ring-2 ring-purple-300 ring-inset' : isEven ? 'bg-white' : 'bg-purple-50/20'}`}>
            {/* Number Column */}
            <div className={`w-12 sm:w-16 border-r-2 border-purple-200 flex items-center justify-center text-sm font-bold shrink-0 select-none ${isActive ? 'bg-primary text-white' : 'bg-purple-100 text-primary'}`}>
                {index + 1}
            </div>

            {/* Dynamic Columns */}
            {columns.map((colContent, colIndex) => (
                <EditorCell
                    key={colIndex}
                    content={colContent}
                    onUpdate={(newHtml) => {
                        const newCols = [...columns];
                        newCols[colIndex] = newHtml;
                        onUpdate(newCols);
                    }}
                    onFocus={onFocus}
                    readOnly={readOnly}
                />
            ))}

            {/* Action Column - Only visible when not read-only */}
            {!readOnly && (
                <div className="w-10 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 bg-gray-50 border-l-2 border-purple-200">
                    <button
                        onClick={onDelete}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Hapus Baris"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

const SKPSection = ({ title, rows = [], onChange, onEditorFocus, feedback, readOnly = false }) => {
    const handleAddRow = () => {
        if (readOnly) return;
        // Find how many columns current rows have, default to 1
        const colCount = rows.length > 0 && rows[0].columns ? rows[0].columns.length : 1;
        const newRow = {
            id: Date.now(),
            columns: Array(colCount).fill('')
        };
        onChange([...rows, newRow]);
    };

    const handleAddColumn = () => {
        if (readOnly) return;
        const newRows = rows.map(row => ({
            ...row,
            columns: [...(row.columns || [row.content || '']), ''] // append empty column
        }));

        if (newRows.length === 0) {
            const newRow = { id: Date.now(), columns: ['', ''] };
            onChange([newRow]);
        } else {
            onChange(newRows);
        }
    };

    const handleDeleteRow = (index) => {
        if (readOnly) return;
        const newRows = rows.filter((_, i) => i !== index);
        onChange(newRows);
    };

    return (
        <div className={`rounded-xl overflow-hidden bg-white shadow-md mb-6 border-2 ${feedback ? 'border-yellow-400 ring-4 ring-yellow-100' : 'border-purple-300'}`}>
            {/* Section Header */}
            <div className="bg-gradient-to-r from-purple-100 to-purple-50 px-4 py-3 border-b-2 border-purple-300 flex justify-between items-center">
                <h3 className="font-bold text-primary text-sm uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    {title}
                    {readOnly && (
                        <span className="ml-2 text-xs font-medium text-gray-500 normal-case bg-gray-200 px-2 py-0.5 rounded">(Hanya Baca)</span>
                    )}
                </h3>
                {/* Action buttons - only show when not read-only */}
                {!readOnly && (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="h-8 px-4 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-md flex items-center"
                            onClick={handleAddRow}
                        >
                            <Plus size={14} className="mr-1" />
                            Row
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleAddColumn}
                            className="h-8 px-4 text-xs font-semibold bg-primary hover:bg-purple-700 text-white border-none shadow-md flex items-center"
                        >
                            <Columns size={14} className="mr-1" />
                            Col
                        </Button>
                    </div>
                )}
            </div>

            {feedback && (
                <div className="bg-yellow-50 text-yellow-800 text-sm p-4 border-b-2 border-yellow-300 flex items-start gap-3 animate-in slide-in-from-top-2">
                    <div className="bg-yellow-200 p-1.5 rounded-full">
                        <MessageSquare size={16} className="text-yellow-700" />
                    </div>
                    <div className="flex-1">
                        <span className="font-bold block text-xs uppercase mb-1 text-yellow-700">Catatan Revisi:</span>
                        <p className="text-yellow-800">{feedback}</p>
                    </div>
                </div>
            )}

            {/* Table Header Row */}
            <div className="flex bg-purple-100 border-b-2 border-purple-300">
                <div className="w-12 sm:w-16 border-r-2 border-purple-300 flex items-center justify-center py-2 text-xs font-bold text-primary uppercase">
                    No
                </div>
                <div className="flex-1 py-2 px-4 text-xs font-bold text-primary uppercase">
                    Uraian Kegiatan
                </div>
            </div>

            {/* Table Body */}
            <div className="divide-y-0">
                {rows.map((row, index) => (
                    <RowItem
                        key={row.id}
                        index={index}
                        columns={row.columns || [row.content || '']} // fallback for old data
                        onUpdate={(newCols) => {
                            if (readOnly) return;
                            const updatedRows = [...rows];
                            updatedRows[index] = { ...updatedRows[index], columns: newCols };
                            delete updatedRows[index].content;
                            onChange(updatedRows);
                        }}
                        onFocus={onEditorFocus}
                        onDelete={() => handleDeleteRow(index)}
                        readOnly={readOnly}
                    />
                ))}

                {rows.length === 0 && (
                    <div className="p-12 text-center text-gray-400 text-sm bg-purple-50/30 border-t-2 border-purple-200">
                        <div className="text-4xl mb-3">📝</div>
                        <p className="font-medium text-gray-500">Belum ada isian</p>
                        <p className="text-xs mt-1">Klik tombol <span className="font-semibold text-emerald-600">+ Row</span> untuk menambahkan baris</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SKPSection;
