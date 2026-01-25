import React from 'react';
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

const Toolbar = ({ editor }) => {
    // If no editor is focused, we still show the toolbar but disabled, 
    // or we could show it enabled but doing nothing? 
    // Better to show it semi-transparent or disabled state.

    return (
        <div className="flex items-center gap-1 w-full relative">
            <ToolbarButton
                onClick={() => editor?.chain().focus().toggleBold().run()}
                isActive={editor?.isActive('bold')}
                disabled={!editor}
                icon={Bold}
            />
            <ToolbarButton
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                isActive={editor?.isActive('italic')}
                disabled={!editor}
                icon={Italic}
            />
            <ToolbarButton
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                isActive={editor?.isActive('underline')}
                disabled={!editor}
                icon={Underline}
            />

            <div className="w-px h-6 bg-gray-200 mx-2" />

            <ToolbarButton
                onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                isActive={editor?.isActive({ textAlign: 'left' })}
                disabled={!editor}
                icon={AlignLeft}
            />
            <ToolbarButton
                onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                isActive={editor?.isActive({ textAlign: 'center' })}
                disabled={!editor}
                icon={AlignCenter}
            />
            <ToolbarButton
                onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                isActive={editor?.isActive({ textAlign: 'right' })}
                disabled={!editor}
                icon={AlignRight}
            />

            <div className="w-px h-6 bg-gray-200 mx-2" />

            <ToolbarButton
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                isActive={editor?.isActive('bulletList')}
                disabled={!editor}
                icon={List}
            />
            <ToolbarButton
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                isActive={editor?.isActive('orderedList')}
                disabled={!editor}
                icon={ListOrdered}
            />

            {!editor && (
                <div className="ml-auto text-xs text-gray-400 font-medium px-2">
                    Select a field to edit formatting
                </div>
            )}
        </div>
    );
};

export default Toolbar;
