import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Plus, Trash2, Columns, MessageSquare, MoreVertical, X, Minus, Square, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/common/Button';

// Border style options for individual rows
const BORDER_STYLES = {
    none: { class: 'border-0', label: 'Tanpa' },
    thin: { class: 'border', label: 'Tipis' },
    bold: { class: 'border-2', label: 'Tebal' }
};

// Editor Component for a single cell
const EditorCell = ({ content, onUpdate, onFocus, readOnly = false, borderStyle = 'bold' }) => {
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

    useEffect(() => {
        if (editor) {
            editor.setEditable(!readOnly);
        }
    }, [readOnly, editor]);

    const borderClass = BORDER_STYLES[borderStyle]?.class || 'border';

    return (
        <div className={`flex-1 min-w-[100px] ${borderClass} border-r border-purple-200 last:border-r-0 relative bg-white hover:bg-purple-50/30 transition-colors`}>
            <EditorContent
                editor={editor}
                className={`prose prose-sm prose-purple max-w-none p-2.5 min-h-[45px] outline-none text-sm ${readOnly ? 'cursor-default select-none bg-gray-50/50' : ''}`}
                style={{ lineHeight: '1.4' }}
            />
        </div>
    );
};

// Row Context Menu for per-row settings
const RowContextMenu = ({ isOpen, onClose, onSetBorder, currentBorder, onDelete, position }) => {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={onClose} />

            {/* Menu */}
            <div
                className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px]"
                style={{ top: position.top, right: 0 }}
            >
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase">Garis Batas Baris</div>
                {Object.entries(BORDER_STYLES).map(([key, style]) => (
                    <button
                        key={key}
                        onClick={() => { onSetBorder(key); onClose(); }}
                        className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-purple-50 ${currentBorder === key ? 'bg-purple-100 text-primary font-medium' : 'text-gray-700'}`}
                    >
                        <div className={`w-4 h-0.5 ${key === 'none' ? 'border-t border-dashed border-gray-300' : key === 'thin' ? 'bg-gray-400' : 'bg-gray-700 h-1'}`}></div>
                        {style.label}
                    </button>
                ))}
                <div className="border-t border-gray-100 my-1"></div>
                <button
                    onClick={() => { onDelete(); onClose(); }}
                    className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 text-red-600 hover:bg-red-50"
                >
                    <Trash2 size={14} />
                    Hapus Baris
                </button>
            </div>
        </>
    );
};

const RowItem = ({
    columns = [],
    displayNumber, // Use display number instead of index for proper numbering
    onUpdate,
    onFocus,
    onDelete,
    onSetBorder,
    isActive,
    readOnly = false,
    showNumbers = true,
    borderStyle = 'bold'
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const isEven = displayNumber % 2 === 0;
    const borderClass = BORDER_STYLES[borderStyle]?.class || 'border';

    return (
        <div className={`flex ${borderClass} border-b border-purple-200 last:border-b-0 group min-h-[45px] transition-all relative ${isActive ? 'bg-purple-100/50 ring-2 ring-purple-300 ring-inset' : isEven ? 'bg-white' : 'bg-purple-50/30'}`}>
            {/* Number Column - Always shows consecutive numbers */}
            {showNumbers && (
                <div className={`w-10 ${borderClass} border-r border-purple-200 flex items-center justify-center text-sm font-bold shrink-0 select-none ${isActive ? 'bg-primary text-white' : 'bg-purple-100 text-primary'}`}>
                    {displayNumber}
                </div>
            )}

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
                    borderStyle={borderStyle}
                />
            ))}

            {/* Row Actions - Click to open menu */}
            {!readOnly && (
                <div className="w-8 flex flex-col items-center justify-center bg-gray-50/50 border-l border-purple-100 relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1 text-gray-400 hover:text-primary hover:bg-purple-100 rounded transition-colors"
                        title="Opsi Baris"
                    >
                        <MoreVertical size={14} />
                    </button>

                    <RowContextMenu
                        isOpen={showMenu}
                        onClose={() => setShowMenu(false)}
                        onSetBorder={onSetBorder}
                        currentBorder={borderStyle}
                        onDelete={onDelete}
                        position={{ top: '100%' }}
                    />
                </div>
            )}
        </div>
    );
};

const SKPSection = ({ title, rows = [], onChange, onEditorFocus, feedback, readOnly = false }) => {
    const [showNumbers, setShowNumbers] = useState(true);

    const colCount = rows.length > 0 && rows[0].columns ? rows[0].columns.length : 1;

    const handleAddRow = () => {
        if (readOnly) return;
        const newRow = {
            id: Date.now(),
            columns: Array(colCount).fill(''),
            borderStyle: 'bold' // Default border style for new rows
        };
        onChange([...rows, newRow]);
    };

    const handleAddColumn = () => {
        if (readOnly) return;
        const newRows = rows.map(row => ({
            ...row,
            columns: [...(row.columns || [row.content || '']), '']
        }));

        if (newRows.length === 0) {
            const newRow = { id: Date.now(), columns: ['', ''], borderStyle: 'bold' };
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

    const handleDeleteColumn = (colIndex) => {
        if (readOnly) return;
        if (colCount <= 1) return;

        const newRows = rows.map(row => ({
            ...row,
            columns: row.columns.filter((_, i) => i !== colIndex)
        }));
        onChange(newRows);
    };

    const handleSetRowBorder = (index, borderStyle) => {
        if (readOnly) return;
        const updatedRows = [...rows];
        updatedRows[index] = { ...updatedRows[index], borderStyle };
        onChange(updatedRows);
    };

    return (
        <div className={`rounded-lg overflow-hidden bg-white shadow-sm mb-5 border ${feedback ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-purple-300'}`}>
            {/* Section Header */}
            <div className="bg-gradient-to-r from-purple-100 to-purple-50 px-3 py-2 border-b border-purple-300 flex justify-between items-center flex-wrap gap-2">
                <h3 className="font-bold text-primary text-sm uppercase tracking-wide flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    {title}
                    {readOnly && (
                        <span className="ml-2 text-xs font-medium text-gray-500 normal-case bg-gray-200 px-2 py-0.5 rounded">(Hanya Baca)</span>
                    )}
                </h3>

                {!readOnly && (
                    <div className="flex gap-1.5 items-center">
                        {/* Toggle Numbers */}
                        <button
                            onClick={() => setShowNumbers(!showNumbers)}
                            className={`h-7 px-2 flex items-center gap-1 rounded text-xs font-medium transition-colors ${showNumbers ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                            title={showNumbers ? 'Sembunyikan Nomor' : 'Tampilkan Nomor'}
                        >
                            <Grid3X3 size={12} />
                            No
                        </button>

                        <Button
                            size="sm"
                            className="h-7 px-2.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-sm flex items-center"
                            onClick={handleAddRow}
                        >
                            <Plus size={12} className="mr-0.5" />
                            Row
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleAddColumn}
                            className="h-7 px-2.5 text-xs font-semibold bg-primary hover:bg-purple-700 text-white border-none shadow-sm flex items-center"
                        >
                            <Columns size={12} className="mr-0.5" />
                            Col
                        </Button>
                    </div>
                )}
            </div>

            {feedback && (
                <div className="bg-yellow-50 text-yellow-800 text-sm p-2.5 border-b border-yellow-300 flex items-start gap-2">
                    <MessageSquare size={14} className="text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                        <span className="font-bold text-xs uppercase text-yellow-700">Revisi: </span>
                        <span className="text-yellow-800">{feedback}</span>
                    </div>
                </div>
            )}

            {/* Table Header Row */}
            <div className="flex bg-purple-100 border-b border-purple-300">
                {showNumbers && (
                    <div className="w-10 border-r border-purple-300 flex items-center justify-center py-1.5 text-xs font-bold text-primary uppercase">
                        No
                    </div>
                )}
                {Array.from({ length: colCount }).map((_, colIndex) => (
                    <div key={colIndex} className="flex-1 min-w-[100px] border-r border-purple-200 last:border-r-0 py-1.5 px-2 flex items-center justify-between group">
                        <span className="text-xs font-bold text-primary uppercase">
                            Kolom {colIndex + 1}
                        </span>
                        {!readOnly && colCount > 1 && (
                            <button
                                onClick={() => handleDeleteColumn(colIndex)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded transition-all"
                                title={`Hapus Kolom ${colIndex + 1}`}
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                ))}
                {!readOnly && <div className="w-8"></div>}
            </div>

            {/* Table Body */}
            <div>
                {rows.map((row, index) => (
                    <RowItem
                        key={row.id}
                        displayNumber={index + 1} // Always consecutive: 1, 2, 3, ... based on current position
                        columns={row.columns || [row.content || '']}
                        onUpdate={(newCols) => {
                            if (readOnly) return;
                            const updatedRows = [...rows];
                            updatedRows[index] = { ...updatedRows[index], columns: newCols };
                            delete updatedRows[index].content;
                            onChange(updatedRows);
                        }}
                        onFocus={onEditorFocus}
                        onDelete={() => handleDeleteRow(index)}
                        onSetBorder={(style) => handleSetRowBorder(index, style)}
                        readOnly={readOnly}
                        showNumbers={showNumbers}
                        borderStyle={row.borderStyle || 'bold'}
                    />
                ))}

                {rows.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm bg-purple-50/20">
                        <div className="text-2xl mb-2">📝</div>
                        <p className="font-medium text-gray-500">Belum ada isian</p>
                        <p className="text-xs mt-1">Klik <span className="font-semibold text-emerald-600">+ Row</span> untuk menambahkan</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SKPSection;
