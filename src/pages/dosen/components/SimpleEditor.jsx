import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';

const SimpleEditor = ({
    content,
    onUpdate,
    onFocus,
    readOnly = false,
    placeholder = 'Tuliskan realisasi...',
    className = ''
}) => {
    // Refs for callbacks to avoid re-init
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
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({ placeholder }),
        ],
        content: content,
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            if (!readOnly && onUpdateRef.current) {
                onUpdateRef.current(editor.getHTML());
            }
        },
        onFocus: ({ editor }) => {
            if (!readOnly && onFocusRef.current) {
                onFocusRef.current(editor);
            }
        },
        editorProps: {
            attributes: {
                class: `prose prose-sm prose-blue max-w-none outline-none text-sm w-full h-full min-h-[80px] p-3 ${className}`,
            },
        },
    }, []);

    // Sync content updates from parent (if changed externally)
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

    return (
        <EditorContent editor={editor} className="w-full h-full" />
    );
};

export default SimpleEditor;
