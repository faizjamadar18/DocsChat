'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { Plus, GripVertical } from 'lucide-react';
import { SlashCommandMenu } from './SlashCommandMenu';

interface EditorCanvasProps {
  initialContent: Record<string, unknown> | string;
  onAutoSave: (contentJson: Record<string, unknown>, contentText: string) => void;
  onIdleIndex?: () => void;
}

export function EditorCanvas({
  initialContent,
  onAutoSave,
  onIdleIndex,
}: EditorCanvasProps) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Slash menu state
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });

  // Block handle position state
  const [handlePos, setHandlePos] = useState<{ top: number } | null>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        link: { openOnClick: false },
      }),
      Placeholder.configure({
        placeholder: "Start typing or press '/' for commands...",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'tiptap focus:outline-none min-h-[350px] leading-relaxed',
      },
      handleKeyDown: (view, event) => {
        // If slash menu is open and navigation keys are pressed, let slash menu handle it
        if (slashMenuOpen && ['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(event.key)) {
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const json = ed.getJSON();
      const text = ed.getText();

      // Check slash trigger
      const { state } = ed;
      const { from } = state.selection;
      const textBefore = state.doc.textBetween(Math.max(0, from - 20), from);
      const match = textBefore.match(/\/([a-zA-Z0-9_-]*)$/);

      if (match) {
        setSlashQuery(match[1]);
        try {
          const coords = ed.view.coordsAtPos(from);
          setSlashMenuPos({
            top: coords.bottom + 6,
            left: Math.max(16, Math.min(coords.left, window.innerWidth - 280)),
          });
          setSlashMenuOpen(true);
        } catch {
          // fallback coords
        }
      } else {
        setSlashMenuOpen(false);
      }

      // Debounced auto-save (1.5s) to MongoDB
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onAutoSave(json, text);
      }, 1500);

      // Debounced idle Qdrant index (10s)
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (onIdleIndex) {
        idleTimeoutRef.current = setTimeout(() => {
          onIdleIndex();
        }, 10000);
      }
    },
    onSelectionUpdate: ({ editor: ed }) => {
      // Update block handle position
      try {
        const { from } = ed.state.selection;
        const coords = ed.view.coordsAtPos(from);
        if (editorWrapperRef.current) {
          const wrapperRect = editorWrapperRef.current.getBoundingClientRect();
          setHandlePos({ top: coords.top - wrapperRect.top });
        }
      } catch {
        // ignore
      }
    },
    onBlur: () => {
      // Trigger idle index on blur
      if (onIdleIndex) {
        onIdleIndex();
      }
    },
  });

  // Keep editor content in sync when initialContent changes across document switching
  useEffect(() => {
    if (editor && initialContent !== undefined) {
      const currentJson = JSON.stringify(editor.getJSON());
      const nextJson = JSON.stringify(initialContent);
      if (currentJson !== nextJson) {
        editor.commands.setContent(initialContent || '');
      }
    }
  }, [editor, initialContent]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, []);

  const handleOpenSlashFromButton = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertContent('/').run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-text-muted text-xs">
        Loading editor...
      </div>
    );
  }

  return (
    <div ref={editorWrapperRef} className="relative w-full">
      {/* Block Hover Handle (+ and ⠿ grip) */}
      <div
        style={{
          top: handlePos ? `${handlePos.top + 2}px` : '4px',
          left: '-44px',
        }}
        className="absolute hidden sm:flex items-center gap-0.5 text-text-muted opacity-40 hover:opacity-100 transition-opacity select-none cursor-pointer"
      >
        <button
          type="button"
          onClick={handleOpenSlashFromButton}
          title="Add block"
          className="p-1 rounded hover:bg-[#F3F4F6] hover:text-text-primary transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <div
          title="Drag block"
          className="p-1 rounded hover:bg-[#F3F4F6] hover:text-text-primary transition-colors cursor-grab"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} />

      {/* Floating Slash Command Menu */}
      <SlashCommandMenu
        editor={editor}
        isOpen={slashMenuOpen}
        onClose={() => setSlashMenuOpen(false)}
        query={slashQuery}
        position={slashMenuPos}
      />
    </div>
  );
}
