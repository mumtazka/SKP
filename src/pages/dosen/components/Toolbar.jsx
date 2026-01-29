import React, { useCallback } from 'react';
import {
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered
} from 'lucide-react';

const ToolbarButton = ({ onClick, isActive, icon: Icon, disabled }) => (
    <button
        type="button"
        onMouseDown={(e) => e.preventDefault()} // Prevent focus loss from editor
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

const Toolbar = ({ editor, selectedEditors = [] }) => {
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
                // Only force selectAll if we are operating on MULTIPLE cells (batch operation).
                // If it's just one cell (length 1), we respect the user's specific text selection.
                if (selectedEditors.length > 1) {
                    ed.chain().selectAll().command(commandFn).run();
                } else {
                    // Normal single editor behavior - apply to current selection
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
                <div className="ml-auto flex items-center gap-2">
                    <div className="text-xs text-purple-600 font-bold px-2 bg-purple-50 rounded">
                        {selectedEditors.length} cells selected
                    </div>
                </div>
            )}
        </div>
    );
};

export default Toolbar;
