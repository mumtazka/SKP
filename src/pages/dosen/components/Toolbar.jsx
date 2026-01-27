import React, { useCallback } from 'react';
import {
    Bold,
    Italic,
    Underline,
    AlignLeft,
    AlignCenter,
    AlignRight,
    List,
    ListOrdered
} from 'lucide-react';

const ToolbarButton = ({ onClick, isActive, icon: Icon, disabled }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`p-2 rounded-md transition-all ${disabled ? 'opacity-30 cursor-not-allowed text-gray-400' :
            isActive
                ? 'bg-purple-100 text-purple-700 shadow-sm'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
    >
        <Icon size={18} />
    </button>
);

const Toolbar = ({ editor, selectedEditors = [], onMerge }) => {
    // Determine which editors to act upon
    // If selectedEditors has items, we use those. Otherwise fall back to single focused 'editor'
    const targetEditors = selectedEditors.length > 0 ? selectedEditors : (editor ? [editor] : []);
    const hasActiveEditor = targetEditors.length > 0;

    // Primary editor for state checking (isActive) - usually the focused one or first selected
    const primaryEditor = editor || targetEditors[0];

    // Helper to apply command to all target editors
    const runCommand = useCallback((commandFn) => {
        targetEditors.forEach(ed => {
            if (ed && !ed.isDestroyed) {
                // We need to restore focus to apply commands usually, but for multiple...
                // Tiptap commands often run on current selection.
                // If we want to force format entire cell content? 
                // Creating a selection of entire doc?
                // OR just toggle mark?

                // If we are just toggling marks (Bold, Italic), it usually applies to selection.
                // If the user selected multiple cells, they aren't "Text Selected" inside the editor. 
                // So we probably want to apply to ALL content in that editor?

                if (selectedEditors.length > 0) {
                    ed.chain().selectAll().command(commandFn).run();
                    // Deselect to avoid visual clutter? Or keep selected? 
                    // Keeping selected (selectAll) might look weird if we have visual cell selection too.
                    // But to apply formatting we often need selection.

                    // Actually, toggleBold() works on selection.
                    // If we want to bold the whole cell, we selectAll first.
                } else {
                    // Normal single editor behavior
                    commandFn(ed.chain().focus()).run();
                }
            }
        });
    }, [targetEditors, selectedEditors]);

    return (
        <div className="flex items-center gap-1 w-full relative">
            <ToolbarButton
                onClick={() => runCommand(chain => chain.toggleBold())}
                isActive={primaryEditor?.isActive('bold')}
                disabled={!hasActiveEditor}
                icon={Bold}
            />
            <ToolbarButton
                onClick={() => runCommand(chain => chain.toggleItalic())}
                isActive={primaryEditor?.isActive('italic')}
                disabled={!hasActiveEditor}
                icon={Italic}
            />
            <ToolbarButton
                onClick={() => runCommand(chain => chain.toggleUnderline())}
                isActive={primaryEditor?.isActive('underline')}
                disabled={!hasActiveEditor}
                icon={Underline}
            />

            <div className="w-px h-6 bg-gray-200 mx-2" />

            <ToolbarButton
                onClick={() => runCommand(chain => chain.setTextAlign('left'))}
                isActive={primaryEditor?.isActive({ textAlign: 'left' })}
                disabled={!hasActiveEditor}
                icon={AlignLeft}
            />
            <ToolbarButton
                onClick={() => runCommand(chain => chain.setTextAlign('center'))}
                isActive={primaryEditor?.isActive({ textAlign: 'center' })}
                disabled={!hasActiveEditor}
                icon={AlignCenter}
            />
            <ToolbarButton
                onClick={() => runCommand(chain => chain.setTextAlign('right'))}
                isActive={primaryEditor?.isActive({ textAlign: 'right' })}
                disabled={!hasActiveEditor}
                icon={AlignRight}
            />

            <div className="w-px h-6 bg-gray-200 mx-2" />

            <ToolbarButton
                onClick={() => runCommand(chain => chain.toggleBulletList())}
                isActive={primaryEditor?.isActive('bulletList')}
                disabled={!hasActiveEditor}
                icon={List}
            />
            <ToolbarButton
                onClick={() => runCommand(chain => chain.toggleOrderedList())}
                isActive={primaryEditor?.isActive('orderedList')}
                disabled={!hasActiveEditor}
                icon={ListOrdered}
            />

            {!hasActiveEditor && (
                <div className="ml-auto text-xs text-gray-400 font-medium px-2">
                    Select a field or cells to edit formatting
                </div>
            )}

            {selectedEditors.length > 1 && (
                <div className="ml-auto flex items-center gap-3">
                    <button
                        onClick={onMerge}
                        className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-bold rounded transition-colors flex items-center gap-1"
                        title="Merge Selected Cells into One"
                    >
                        <span className="text-base tracking-tighter">◫</span>
                        Merge Cells
                    </button>
                    <div className="text-xs text-purple-600 font-bold px-2 bg-purple-50 rounded">
                        {selectedEditors.length} cells selected
                    </div>
                </div>
            )}
        </div>
    );
};

export default Toolbar;
