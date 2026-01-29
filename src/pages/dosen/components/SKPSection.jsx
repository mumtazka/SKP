import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Plus, Trash2, MessageSquare, MoreVertical, Grid3X3, GripVertical, AlertCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';

// Border style options for individual rows
const BORDER_STYLES = {
    none: { class: 'border-0', label: 'Tanpa' },
    thin: { class: 'border', label: 'Tipis' },
    bold: { class: 'border-2', label: 'Tebal' }
};

// Helper to get editor key
const getEditorKey = (rowIndex, colIndex) => `${rowIndex}-${colIndex}`;

// Editor Component for a single cell (Wrapped in td)
const EditorCell = ({
    content,
    onUpdate,
    onFocus,
    readOnly = false,
    borderStyle = 'bold',
    rowIndex,
    colIndex,
    onRegister,
    onUnregister,
    onKeyDown,
    onMouseDown,
    onMouseEnter,
    isSelected,
    placeholder = 'Klik untuk mengisi...',
    // width prop is handled by colgroup usually, but we can override if needed
    colSpan = 1,
    rowSpan = 1, // NEW: rowSpan support
    isHidden = false, // Support for cells hidden by merge
    autoList = false // NEW: Auto-bullet list mode
}) => {
    // If hidden (covered by another merged cell), don't render td
    if (isHidden) return null;

    // Use refs for callbacks to avoid re-initializing editor when callbacks change
    const onUpdateRef = useRef(onUpdate);
    const onFocusRef = useRef(onFocus);

    useEffect(() => {
        onUpdateRef.current = onUpdate;
        onFocusRef.current = onFocus;
    }, [onUpdate, onFocus]);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Placeholder.configure({ placeholder: placeholder }),
        ],
        content: content,
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            if (!readOnly && onUpdateRef.current) {
                onUpdateRef.current(editor.getHTML());
            }
        },
        onFocus: ({ editor }) => {
            if (autoList && !editor.isActive('bulletList')) {
                editor.commands.toggleBulletList();
            }
            if (!readOnly && onFocusRef.current) {
                onFocusRef.current(editor);
            }
        },
        editorProps: {
            handleKeyDown: (view, event) => {
                if (onKeyDown) {
                    return onKeyDown(event, rowIndex, colIndex, editor);
                }
                return false;
            }
        }
    }, []); // Dependency array to prevent re-initialization on every render

    useEffect(() => {
        if (editor && onRegister) {
            onRegister(rowIndex, colIndex, editor);
        }
        return () => {
            if (onUnregister) onUnregister(rowIndex, colIndex);
        };
    }, [editor, rowIndex, colIndex, onRegister, onUnregister]);

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
    const isMerged = colSpan > 1 || rowSpan > 1;

    return (
        <td
            colSpan={colSpan}
            rowSpan={rowSpan}
            className={`
                ${borderClass} border-purple-200 relative transition-colors p-0 align-top
                ${isMerged ? 'bg-white z-20' : 'border-r last:border-r-0'} 
                ${isSelected ? 'bg-purple-100 ring-2 ring-inset ring-purple-300 z-30' : 'bg-white hover:bg-purple-50/30'}
                ${isMerged && !isSelected ? 'hover:bg-white' : ''}
            `}
            onMouseDown={(e) => !readOnly && onMouseDown && onMouseDown(rowIndex, colIndex, e)}
            onMouseEnter={() => !readOnly && onMouseEnter && onMouseEnter(rowIndex, colIndex)}
        >
            <div className="h-full w-full relative">
                <EditorContent
                    editor={editor}
                    className={`prose prose-sm prose-purple max-w-none p-2.5 min-h-[45px] outline-none text-sm w-full h-full [&_p]:!my-0 [&_li]:!my-0 [&_ul]:!my-0 [&_ol]:!my-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 ${readOnly ? 'cursor-default select-none bg-gray-50/50' : ''}`}
                    style={{ lineHeight: '1.4' }}
                />
            </div>
        </td>
    );
};

// Row Context Menu for per-row settings - MOVED TO PORTAL
const RowContextMenu = ({ isOpen, onClose, onSetBorder, currentBorder, onDelete, position }) => {
    if (!isOpen) return null;

    return createPortal(
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />

            {/* Menu */}
            <div
                className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px] animate-in zoom-in-95 duration-100"
                style={{ top: position.top, left: position.left }}
            >
                <button
                    onClick={() => { onDelete(); onClose(); }}
                    className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 text-red-600 hover:bg-red-50"
                >
                    <Trash2 size={14} />
                    Hapus Baris
                </button>
            </div>
        </>,
        document.body
    );
};

const RowItem = ({
    columns = [],
    colSpans = [],
    rowSpans = [],
    colHiddens = [],
    displayNumber = '', // Fixed display number (empty for sub rows)
    isSubRow = false, // Whether this is a sub row
    onUpdate,
    onFocus,
    onDelete,
    onSetBorder,
    isActive,
    readOnly = false,
    showNumbers = true,
    borderStyle = 'bold',
    rowIndex,
    onRegisterEditor,
    onUnregisterEditor,
    onCellKeyDown,
    onCellMouseDown,
    onCellMouseEnter,
    isCellSelected,
    isPerilakuMode = false, // Received from parent
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const borderClass = BORDER_STYLES[borderStyle]?.class || 'border';
    const menuButtonRef = useRef(null);

    const handleMenuOpen = (e) => {
        if (menuButtonRef.current) {
            const rect = menuButtonRef.current.getBoundingClientRect();
            setMenuPos({
                top: rect.bottom + 5,
                left: rect.right - 160
            });
        }
        setShowMenu(!showMenu);
    };

    // Sub rows have slightly different styling
    const rowBgClass = isSubRow ? 'bg-purple-50/50' : 'bg-white';

    // Helper for placeholder
    const getPlaceholder = (colIndex) => {
        if (!isPerilakuMode) {
            return isSubRow ? 'isikan indikator...' : 'isikan rencana kegiatan...';
        }

        // Perilaku Mode Logic
        if (colIndex === 0) {
            return isSubRow ? 'isikan indikator penilaian...' : 'isikan perilaku kerja...';
        }
        if (colIndex === 1) {
            return 'isikan ekspektasi pimpinan...';
        }
        return '...';
    };

    return (
        <tr className={`${borderClass} border-b border-purple-200 last:border-b-0 group transition-all ${rowBgClass}`}>
            {/* Number Column - FIXED DISPLAY (empty for sub rows) */}
            {showNumbers && (
                <td className={`w-10 ${borderClass} border-r border-purple-200 text-sm font-bold align-middle ${isSubRow ? 'bg-purple-50' : 'bg-purple-100'} text-primary p-0`}>
                    <div className="w-10 min-h-[45px] flex items-center justify-center">
                        <span className="font-bold text-primary">{displayNumber}</span>
                    </div>
                </td>
            )}

            {/* Dynamic Columns */}
            {columns.map((colContent, colIndex) => (
                <EditorCell
                    key={colIndex}
                    rowIndex={rowIndex}
                    colIndex={colIndex}
                    content={colContent}
                    colSpan={colSpans[colIndex] || 1}
                    rowSpan={rowSpans[colIndex] || 1}
                    isHidden={colHiddens.includes(colIndex)}
                    placeholder={getPlaceholder(colIndex)}
                    onUpdate={(newHtml) => {
                        const newCols = [...columns];
                        newCols[colIndex] = newHtml;
                        onUpdate(newCols);
                    }}
                    onFocus={onFocus}
                    readOnly={readOnly}
                    borderStyle={borderStyle}
                    onRegister={onRegisterEditor}
                    onUnregister={onUnregisterEditor}
                    onKeyDown={onCellKeyDown}
                    onMouseDown={onCellMouseDown}
                    onMouseEnter={onCellMouseEnter}
                    isSelected={isCellSelected(rowIndex, colIndex)}
                    autoList={isSubRow}
                />
            ))}

            {/* Row Actions - only show on main rows, not sub rows */}
            {!readOnly && (
                <td className="w-8 p-0 align-middle bg-gray-50/50 border-l border-purple-100">
                    <div className="w-8 min-h-[45px] flex flex-col items-center justify-center relative">
                        {!isSubRow && (
                            <>
                                <button
                                    ref={menuButtonRef}
                                    onClick={handleMenuOpen}
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
                                    position={menuPos}
                                />
                            </>
                        )}
                    </div>
                </td>
            )}
        </tr>
    );
};




const SKPSection = ({
    title,
    rows = [],
    onChange,
    onEditorFocus,
    feedback,
    readOnly = false,
    isActiveSection,
    onSectionActive,
    onSelectionChange,
    columnHeaders, // Optional array of strings for custom headers
    isPerilakuMode = false, // Enable special layout for behaviors (merged 2nd column)
    simpleRow = false
}) => {
    const [colCount, setColCount] = useState(1);
    const [colWidths, setColWidths] = useState(['100%']);
    const showNumbers = true; // Fixed column

    // ... editorsRef and other hooks same as before ...
    const editorsRef = useRef({});
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState(null);
    const [selectionEnd, setSelectionEnd] = useState(null);

    // Sync colCount
    useEffect(() => {
        if (rows.length > 0) {
            // Find max columns just in case
            const maxCols = Math.max(...rows.map(r => r.columns ? r.columns.length : 0));
            setColCount(maxCols || 1);
        } else {
            setColCount(1); // Default to 1 column if no rows
        }
    }, [rows]);

    // ColWidths logic ...
    useEffect(() => {
        setColWidths(prev => {
            if (prev.length === colCount) return prev;
            return Array(colCount).fill(`${100 / colCount}%`);
        });
    }, [colCount]);

    // --- Resizing Logic (Update to target TH/Col) ---
    const resizingRef = useRef(null);

    const startResize = (index, e) => {
        if (readOnly) return;
        e.preventDefault();
        // Calculate based on Table width
        const table = e.target.closest('table');
        if (!table) return;

        // Get the actual content width of the table (excluding number and action columns)
        let contentWidth = table.offsetWidth;
        if (showNumbers) contentWidth -= 40; // Width of number column
        if (!readOnly) contentWidth -= 32; // Width of action column

        const currentPercentage = parseFloat(colWidths[index]);
        const nextPercentage = parseFloat(colWidths[index + 1]);

        resizingRef.current = {
            index,
            startX: e.pageX,
            startPct: currentPercentage,
            nextStartPct: nextPercentage,
            contentWidth: contentWidth
        };

        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', endResize);
        document.body.style.cursor = 'col-resize';
    };

    const handleResizeMove = useCallback((e) => {
        if (!resizingRef.current) return;
        const { index, startX, startPct, nextStartPct, contentWidth } = resizingRef.current;
        const diffPx = e.pageX - startX;
        const diffPct = (diffPx / contentWidth) * 100;

        if (colWidths.length <= index + 1) return;

        const newCurrent = Math.max(5, startPct + diffPct);
        const newNext = Math.max(5, nextStartPct - diffPct);

        setColWidths(prev => {
            const next = [...prev];
            next[index] = `${newCurrent}%`;
            next[index + 1] = `${newNext}%`;
            return next;
        });
    }, [colWidths]);

    const endResize = useCallback(() => {
        resizingRef.current = null;
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', endResize);
        document.body.style.cursor = '';
    }, [handleResizeMove]);

    // Reset selection if this section becomes inactive
    useEffect(() => {
        if (!isActiveSection) {
            setSelectionStart(null);
            setSelectionEnd(null);
            setIsSelecting(false);
        }
    }, [isActiveSection]);

    // Report selected editors to parent whenever selection changes
    useEffect(() => {
        if (!onSelectionChange) return;

        if (selectionStart && selectionEnd) {
            const r1 = Math.min(selectionStart.r, selectionEnd.r);
            const r2 = Math.max(selectionStart.r, selectionEnd.r);
            const c1 = Math.min(selectionStart.c, selectionEnd.c);
            const c2 = Math.max(selectionStart.c, selectionEnd.c);

            const selectedEds = [];
            for (let r = r1; r <= r2; r++) {
                for (let c = c1; c <= c2; c++) {
                    const key = getEditorKey(r, c);
                    const editor = editorsRef.current[key];
                    if (editor) selectedEds.push(editor);
                }
            }
            onSelectionChange(selectedEds, { start: { r: r1, c: c1 }, end: { r: r2, c: c2 } });
        } else {
            onSelectionChange([], null);
        }
    }, [selectionStart, selectionEnd, onSelectionChange]);


    const handleRegisterEditor = useCallback((r, c, editor) => {
        editorsRef.current[getEditorKey(r, c)] = editor;
    }, []);

    const handleUnregisterEditor = useCallback((r, c) => {
        delete editorsRef.current[getEditorKey(r, c)];
    }, []);

    const isCellSelected = useCallback((r, c) => {
        if (!selectionStart || !selectionEnd) return false;

        const r1 = Math.min(selectionStart.r, selectionEnd.r);
        const r2 = Math.max(selectionStart.r, selectionEnd.r);
        const c1 = Math.min(selectionStart.c, selectionEnd.c);
        const c2 = Math.max(selectionStart.c, selectionEnd.c);

        return r >= r1 && r <= r2 && c >= c1 && c <= c2;
    }, [selectionStart, selectionEnd]);

    // --- Navigation Logic ---
    const handleCellKeyDown = useCallback((event, r, c, editor) => {
        const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
        if (!isArrowKey) return false;

        const { selection } = editor.state;
        const isAtStart = selection.$from.pos === 1;
        const isAtEnd = selection.$to.pos === editor.state.doc.content.size - 1;

        let nextR = r;
        let nextC = c;

        if (event.key === 'ArrowUp') {
            nextR = r - 1;
        } else if (event.key === 'ArrowDown') {
            nextR = r + 1;
        } else if (event.key === 'ArrowLeft') {
            if (isAtStart) nextC = c - 1;
            else return false;
        } else if (event.key === 'ArrowRight') {
            if (isAtEnd) nextC = c + 1;
            else return false;
        }

        const nextKey = getEditorKey(nextR, nextC);
        const nextEditor = editorsRef.current[nextKey];

        if (nextEditor) {
            nextEditor.commands.focus();
            setSelectionStart({ r: nextR, c: nextC });
            setSelectionEnd({ r: nextR, c: nextC });
            return true;
        }
        return false;
    }, []);

    // --- Selection Logic ---
    const handleCellMouseDown = useCallback((r, c, event) => {
        if (onSectionActive) onSectionActive();
        setIsSelecting(true);
        setSelectionStart({ r, c });
        setSelectionEnd({ r, c });
    }, [onSectionActive]);

    const handleCellMouseEnter = useCallback((r, c) => {
        if (isSelecting) {
            setSelectionEnd({ r, c });
        }
    }, [isSelecting]);

    useEffect(() => {
        const handleMouseUp = () => setIsSelecting(false);
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    // --- Existing Handlers ---
    const handleAddRow = () => {
        if (readOnly) return;
        const timestamp = Date.now();
        let newRowsToAdd = [];

        if (simpleRow) {
            const mainRow = {
                id: timestamp,
                columns: Array(colCount).fill(''),
                borderStyle: 'bold',
                isSubRow: false
            };
            newRowsToAdd.push(mainRow);
        } else {
            // Check if the last row is a Main Row (missing its sub-row)
            const lastRow = rows.length > 0 ? rows[rows.length - 1] : null;
            if (lastRow && !lastRow.isSubRow) {
                // Fill the missing sub-row for the orphaned main row
                const missingSubRow = {
                    id: timestamp,
                    parentId: lastRow.id,
                    columns: Array(colCount).fill(''),
                    borderStyle: 'bold',
                    isSubRow: true,
                    // If Perilaku Mode, hide second column for sub row
                    colHiddens: isPerilakuMode ? [1] : []
                };
                newRowsToAdd.push(missingSubRow);
            }

            // Add a fresh new pair (Main + Sub)
            // Use an offset for IDs to prevent collision with the checks above
            const baseId = timestamp + newRowsToAdd.length + 100;

            const mainRow = {
                id: baseId,
                columns: Array(colCount).fill(''),
                borderStyle: 'bold',
                isSubRow: false,
                // If Perilaku Mode, rowSpan=2 for second column
                rowSpans: isPerilakuMode ? [1, 2] : [],
            };

            const subRow = {
                id: baseId + 1,
                parentId: baseId, // Link to the new main row
                columns: Array(colCount).fill(''),
                borderStyle: 'bold',
                isSubRow: true,
                // If Perilaku Mode, hide second column
                colHiddens: isPerilakuMode ? [1] : []
            };

            newRowsToAdd.push(mainRow, subRow);
        }

        onChange([...rows, ...newRowsToAdd]);
    };

    // Delete both main and sub row together
    const handleDeleteRow = (index) => {
        if (readOnly) return;
        const row = rows[index];

        if (row.isSubRow) {
            // If deleting a sub row, find and delete its parent too
            const parentIndex = rows.findIndex(r => r.id === row.parentId);
            if (parentIndex !== -1) {
                const newRows = rows.filter((_, i) => i !== index && i !== parentIndex);
                onChange(newRows);
            } else {
                // Just delete the sub row if parent not found
                const newRows = rows.filter((_, i) => i !== index);
                onChange(newRows);
            }
        } else {
            // If deleting a main row, find and delete its sub row too
            const subIndex = rows.findIndex(r => r.parentId === row.id);
            if (subIndex !== -1) {
                const newRows = rows.filter((_, i) => i !== index && i !== subIndex);
                onChange(newRows);
            } else {
                // Just delete the main row if sub row not found
                const newRows = rows.filter((_, i) => i !== index);
                onChange(newRows);
            }
        }
    };




    const handleAddColumn = () => {
        if (readOnly) return;
        const newRows = rows.map(row => ({
            ...row,
            columns: [...(row.columns || []), '']
        }));

        setColWidths(prev => {
            const newCount = colCount + 1;
            return Array(newCount).fill(`${100 / newCount}%`);
        });
        setColCount(prev => prev + 1);

        if (newRows.length === 0) {
            const newRow = { id: Date.now(), columns: [''], borderStyle: 'bold' }; // Start with one column
            onChange([newRow]);
        } else {
            onChange(newRows);
        }
    };

    const handleDeleteColumn = (colIndex) => {
        if (readOnly) return;
        if (colCount <= 1) return;

        const newRows = rows.map(row => ({
            ...row,
            columns: row.columns.filter((_, i) => i !== colIndex)
        }));

        setColWidths(prev => {
            const next = prev.filter((_, i) => i !== colIndex);
            const newCount = colCount - 1;
            return Array(newCount).fill(`${100 / newCount}%`);
        });
        setColCount(prev => prev - 1);

        onChange(newRows);
    };

    const handleSetRowBorder = (index, borderStyle) => {
        if (readOnly) return;
        const updatedRows = [...rows];
        updatedRows[index] = { ...updatedRows[index], borderStyle };
        onChange(updatedRows);
    };

    return (
        <div className={`rounded-lg overflow-hidden bg-white shadow-sm mb-5 border transition-all ${isActiveSection
            ? 'ring-2 ring-purple-400 border-purple-400 z-10'
            : feedback ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-purple-300'
            }`}>
            {/* Section Header */}
            <div
                className={`px-3 py-2 border-b flex justify-between items-center flex-wrap gap-2 transition-colors
                    ${isActiveSection ? 'bg-purple-100 border-purple-400' : 'bg-gradient-to-r from-purple-100 to-purple-50 border-purple-300'}
                `}
            >
                <h3 className="font-bold text-primary text-sm uppercase tracking-wide flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    {title}
                    {readOnly && (
                        <span className="ml-2 text-xs font-medium text-gray-500 normal-case bg-gray-200 px-2 py-0.5 rounded">(Hanya Baca)</span>
                    )}
                </h3>

                {!readOnly && (
                    <div className="flex gap-1.5 items-center">
                        <Button
                            size="sm"
                            className="h-7 px-2.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-sm flex items-center"
                            onClick={handleAddRow}
                        >
                            <Plus size={14} className="mr-1" />
                            Row
                        </Button>
                    </div>
                )}
            </div>

            {feedback && (
                <div className="bg-yellow-50 px-4 py-2 border-b border-yellow-200 text-xs flex gap-2 items-start">
                    <AlertCircle size={14} className="text-yellow-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <span className="font-bold text-xs uppercase text-yellow-700">Revisi: </span>
                        <span className="text-yellow-800">{feedback}</span>
                    </div>
                </div>
            )}

            {/* TABLE STRUCTURE */}
            <div className={`overflow-x-auto ${isSelecting ? 'select-none' : ''}`}>
                <table className="w-full border-collapse table-fixed">
                    <colgroup>
                        {showNumbers && <col style={{ width: '40px' }} />}
                        {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
                        {!readOnly && <col style={{ width: '32px' }} />}
                    </colgroup>
                    <thead>
                        <tr className="bg-purple-100 border-b border-purple-300">
                            {showNumbers && <th className="border-r border-purple-300 py-1.5 px-1 text-xs font-bold text-primary uppercase text-center align-middle">No</th>}
                            {Array.from({ length: colCount }).map((_, i) => (
                                <th key={i} className="border-r border-purple-200 last:border-r-0 py-1.5 px-2 text-left relative group align-middle font-normal">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-primary uppercase truncate">
                                            {columnHeaders && columnHeaders[i] ? columnHeaders[i] : (i === 0 ? 'Kegiatan' : `Kolom ${i + 1}`)}
                                        </span>
                                    </div>
                                    {!readOnly && i < colCount - 1 && (
                                        <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-400 z-10" onMouseDown={(e) => startResize(i, e)}>
                                            <div className="w-px h-full bg-purple-300 mx-auto" />
                                        </div>
                                    )}
                                </th>
                            ))}
                            {!readOnly && <th className="p-0 border-l border-purple-100"></th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {rows.map((row, index) => (
                            <RowItem
                                key={row.id}
                                rowIndex={index}
                                columns={row.columns}
                                colSpans={row.colSpans}
                                rowSpans={row.rowSpans}
                                colHiddens={row.colHiddens}
                                displayNumber={row.isSubRow ? '' : (rows.filter((r, i) => i <= index && !r.isSubRow).length)}
                                isSubRow={row.isSubRow}
                                onUpdate={(newColumns) => {
                                    const newRows = [...rows];
                                    newRows[index].columns = newColumns;
                                    onChange(newRows);
                                }}
                                onFocus={(editor) => onEditorFocus && onEditorFocus(editor)}
                                onDelete={() => handleDeleteRow(index)}
                                onSetBorder={(style) => handleSetRowBorder(index, style)}
                                isActive={isActiveSection}
                                readOnly={readOnly}
                                showNumbers={showNumbers}
                                borderStyle={row.borderStyle || 'bold'}
                                onRegisterEditor={handleRegisterEditor}
                                onUnregisterEditor={handleUnregisterEditor}
                                onCellKeyDown={(e, r, c, ed) => handleCellKeyDown(e, rows[index].id, c, ed)}
                                onCellMouseDown={handleCellMouseDown}
                                onCellMouseEnter={handleCellMouseEnter}
                                isCellSelected={isCellSelected}
                                isPerilakuMode={isPerilakuMode}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {rows.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm bg-purple-50/20">
                    <div className="text-2xl mb-2">📝</div>
                    <p className="font-medium text-gray-500">Belum ada isian</p>
                    {!readOnly && <p className="text-xs mt-1">Klik <span className="font-semibold text-emerald-600">+ Row</span> untuk menambahkan</p>}
                </div>
            )}
        </div>
    );
};

export default SKPSection;
