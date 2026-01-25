import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Plus, Trash2, Columns, MessageSquare } from 'lucide-react';
import { Button } from '@/components/common/Button';

// Editor Component for a single cell
const EditorCell = ({ content, onUpdate, onFocus }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({ placeholder: '' }),
        ],
        content: content,
        onUpdate: ({ editor }) => onUpdate(editor.getHTML()),
        onFocus: ({ editor }) => onFocus(editor),
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            if (editor.isEmpty && content) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    return (
        <div className="flex-1 min-w-[200px] border-r border-gray-100 last:border-r-0 relative">
            <EditorContent
                editor={editor}
                className="prose prose-sm prose-purple max-w-none p-3 min-h-[50px] outline-none"
                style={{ lineHeight: '1.5' }}
            />
        </div>
    );
};

const RowItem = ({ columns = [], index, onUpdate, onFocus, onDelete, isActive }) => {
    return (
        <div className={`flex border-b border-gray-100 last:border-b-0 group min-h-[50px] transition-colors ${isActive ? 'bg-purple-50/30' : ''}`}>
            {/* Number Column */}
            <div className={`w-10 sm:w-14 border-r border-gray-100 flex items-start justify-center pt-3 text-sm font-semibold shrink-0 select-none ${isActive ? 'text-primary' : 'text-gray-500'}`}>
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
                />
            ))}

            {/* Action Column */}
            <div className="w-8 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center pt-2 gap-1 border-l border-transparent group-hover:border-gray-100 bg-gray-50/10">
                <button
                    onClick={onDelete}
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                    title="Delete Row"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

const SKPSection = ({ title, rows = [], onChange, onEditorFocus, feedback }) => {
    const handleAddRow = () => {
        // Find how many columns current rows have, default to 1
        const colCount = rows.length > 0 && rows[0].columns ? rows[0].columns.length : 1;
        const newRow = {
            id: Date.now(),
            columns: Array(colCount).fill('')
        };
        onChange([...rows, newRow]);
    };

    const handleAddColumn = () => {
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
        const newRows = rows.filter((_, i) => i !== index);
        onChange(newRows);
    };

    return (
        <div className={`rounded-lg overflow-hidden bg-white shadow-sm mb-6 border ${feedback ? 'border-yellow-300 ring-2 ring-yellow-100/50' : 'border-purple-100'}`}>
            <div className="bg-purple-50 px-4 py-2 border-b border-purple-100 flex justify-between items-center">
                <h3 className="font-bold text-primary text-sm uppercase tracking-wide">
                    {title}
                </h3>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        className="h-7 px-3 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-sm flex items-center"
                        onClick={handleAddRow}
                    >
                        <Plus size={12} className="mr-1" />
                        Row
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleAddColumn}
                        className="h-7 px-3 text-xs font-medium bg-primary hover:bg-purple-700 text-white border-none shadow-sm flex items-center"
                    >
                        <Columns size={12} className="mr-1" />
                        Col
                    </Button>
                </div>
            </div>

            {feedback && (
                <div className="bg-yellow-50 text-yellow-800 text-sm p-3 border-b border-yellow-200 flex items-start gap-2 animate-in slide-in-from-top-2">
                    <MessageSquare size={16} className="mt-0.5 shrink-0 text-yellow-600" />
                    <div className="flex-1">
                        <span className="font-bold block text-xs uppercase mb-1 text-yellow-700">Catatan Revisi:</span>
                        <p>{feedback}</p>
                    </div>
                </div>
            )}

            <div className="divide-y divide-purple-50">
                {rows.map((row, index) => (
                    <RowItem
                        key={row.id}
                        index={index}
                        columns={row.columns || [row.content || '']} // fallback for old data
                        onUpdate={(newCols) => {
                            const updatedRows = [...rows];
                            updatedRows[index] = { ...updatedRows[index], columns: newCols };
                            delete updatedRows[index].content;
                            onChange(updatedRows);
                        }}
                        onFocus={onEditorFocus}
                        onDelete={() => handleDeleteRow(index)}
                    />
                ))}

                {rows.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm italic bg-purple-50/10">
                        No rows added. Click "+ Row" to start adding items.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SKPSection;
