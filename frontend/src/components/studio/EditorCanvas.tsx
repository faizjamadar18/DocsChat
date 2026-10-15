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
import { SelectionAIMenu } from './SelectionAIMenu';

interface EditorCanvasProps {
  initialContent: Record<string, unknown> | string;
  documentId: string | null;
  onAutoSave: (contentJson: Record<string, unknown>, contentText: string) => void;
  onIdleIndex?: () => void;
}

export function EditorCanvas({
  initialContent,
  documentId,
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

  // Text-selection AI menu state
  const [selectionMenu, setSelectionMenu] = useState<{
    top: number;
    left: number;
    from: number;
    to: number;
    text: string;
  } | null>(null);
  const dismissedSelectionRef = useRef<string | null>(null);

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

      // Text-selection AI menu: show for non-empty selections only.
      try {
        const { from, to, empty } = ed.state.selection;
        if (empty || to <= from) {
          setSelectionMenu(null);
          return;
        }
        const selectedText = ed.state.doc.textBetween(from, to, ' ');
        if (!selectedText || !selectedText.trim() || selectedText.length > 5000) {
          setSelectionMenu(null);
          return;
        }
        const key = `${from}-${to}-${selectedText}`;
        if (dismissedSelectionRef.current === key) return;
        const coords = ed.view.coordsAtPos(to);
        const menuWidth = 288;
        const menuHeight = 340;
        let top = coords.bottom + 8;
        if (coords.bottom > window.innerHeight - menuHeight) {
          top = Math.max(70, coords.top - menuHeight - 8);
        }
        const left = Math.max(16, Math.min(coords.left, window.innerWidth - menuWidth - 16));
        setSelectionMenu({ top, left, from, to, text: selectedText });
      } catch {
        // ignore selection menu errors
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

  const handleCloseSelectionMenu = useCallback(() => {
    if (selectionMenu) {
      dismissedSelectionRef.current = `${selectionMenu.from}-${selectionMenu.to}-${selectionMenu.text}`;
    }
    setSelectionMenu(null);
  }, [selectionMenu]);

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

      {/* Text-selection AI menu (formatting + Skills + custom prompt) */}
      {selectionMenu && !slashMenuOpen && (
        <SelectionAIMenu
          editor={editor}
          documentId={documentId}
          position={{ top: selectionMenu.top, left: selectionMenu.left }}
          range={{ from: selectionMenu.from, to: selectionMenu.to, text: selectionMenu.text }}
          onClose={handleCloseSelectionMenu}
        />
      )}
    </div>
  );
}
