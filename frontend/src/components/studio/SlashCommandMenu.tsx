'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Check,
  Table as TableIcon,
  Link as LinkIcon,
  Minus,
} from 'lucide-react';
import { Editor } from '@tiptap/react';

export interface CommandItem {
  id: string;
  category: 'Style' | 'Block' | 'Insert';
  label: string;
  icon: React.ReactNode;
  isActive: (editor: Editor) => boolean;
  action: (editor: Editor) => void;
}

const COMMAND_ITEMS: CommandItem[] = [
  // Style
  {
    id: 'text',
    category: 'Style',
    label: 'Text',
    icon: (
      <span className="font-serif font-bold text-[15px] leading-none text-[#18181B] w-5 text-center flex items-center justify-center">
        T
      </span>
    ),
    isActive: (editor) =>
      editor.isActive('paragraph') &&
      !editor.isActive('bulletList') &&
      !editor.isActive('orderedList') &&
      !editor.isActive('taskList') &&
      !editor.isActive('blockquote') &&
      !editor.isActive('codeBlock'),
    action: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    id: 'h1',
    category: 'Style',
    label: 'Heading 1',
    icon: (
      <span className="font-semibold text-[13px] leading-none text-[#18181B] w-5 text-center tracking-tighter flex items-center justify-center">
        H<sub className="text-[9px] font-bold bottom-0 ml-0.5">1</sub>
      </span>
    ),
    isActive: (editor) => editor.isActive('heading', { level: 1 }),
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: 'h2',
    category: 'Style',
    label: 'Heading 2',
    icon: (
      <span className="font-semibold text-[13px] leading-none text-[#18181B] w-5 text-center tracking-tighter flex items-center justify-center">
        H<sub className="text-[9px] font-bold bottom-0 ml-0.5">2</sub>
      </span>
    ),
    isActive: (editor) => editor.isActive('heading', { level: 2 }),
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'h3',
    category: 'Style',
    label: 'Heading 3',
    icon: (
      <span className="font-semibold text-[13px] leading-none text-[#18181B] w-5 text-center tracking-tighter flex items-center justify-center">
        H<sub className="text-[9px] font-bold bottom-0 ml-0.5">3</sub>
      </span>
    ),
    isActive: (editor) => editor.isActive('heading', { level: 3 }),
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: 'bullet-list',
    category: 'Style',
    label: 'Bullet list',
    icon: (
      <svg className="w-4 h-4 text-[#18181B]" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="2.5" cy="4.5" r="1.5" />
        <circle cx="2.5" cy="11.5" r="1.5" />
        <rect x="6.5" y="3.5" width="8.5" height="2" rx="1" />
        <rect x="6.5" y="10.5" width="8.5" height="2" rx="1" />
      </svg>
    ),
    isActive: (editor) => editor.isActive('bulletList'),
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'numbered-list',
    category: 'Style',
    label: 'Numbered list',
    icon: (
      <svg className="w-4 h-4 text-[#18181B]" viewBox="0 0 16 16" fill="currentColor">
        <text x="0.5" y="5.8" fontSize="6.2" fontWeight="bold" fontFamily="sans-serif">1</text>
        <text x="0.5" y="12.8" fontSize="6.2" fontWeight="bold" fontFamily="sans-serif">2</text>
        <rect x="6.5" y="3.5" width="8.5" height="2" rx="1" />
        <rect x="6.5" y="10.5" width="8.5" height="2" rx="1" />
      </svg>
    ),
    isActive: (editor) => editor.isActive('orderedList'),
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'todo-list',
    category: 'Style',
    label: 'To-do list',
    icon: (
      <svg
        className="w-4 h-4 text-[#18181B]"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 4.5l1.8 1.8 3.2-3.8" />
        <path d="M8.5 4.5h6" />
        <circle cx="2.8" cy="11.5" r="1.2" fill="currentColor" stroke="none" />
        <path d="M8.5 11.5h6" />
      </svg>
    ),
    isActive: (editor) => editor.isActive('taskList'),
    action: (editor) => editor.chain().focus().toggleTaskList().run(),
  },

  // Block
  {
    id: 'code-block',
    category: 'Block',
    label: 'Code block',
    icon: (
      <span className="font-mono font-bold text-[13px] leading-none text-[#18181B] w-5 text-center tracking-tighter flex items-center justify-center">
        &lt;/&gt;
      </span>
    ),
    isActive: (editor) => editor.isActive('codeBlock'),
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: 'quote',
    category: 'Block',
    label: 'Quote',
    icon: (
      <svg className="w-4 h-4 text-[#18181B]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
      </svg>
    ),
    isActive: (editor) => editor.isActive('blockquote'),
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },

  // Insert
  {
    id: 'table',
    category: 'Insert',
    label: 'Table',
    icon: <TableIcon className="w-4 h-4 text-[#18181B]" />,
    isActive: (editor) => editor.isActive('table'),
    action: (editor) =>
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    id: 'link',
    category: 'Insert',
    label: 'Link',
    icon: <LinkIcon className="w-4 h-4 text-[#18181B]" />,
    isActive: (editor) => editor.isActive('link'),
    action: (editor) => {
      const url = window.prompt('Enter URL:');
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    },
  },
  {
    id: 'horizontal-rule',
    category: 'Insert',
    label: 'Horizontal rule',
    icon: <Minus className="w-4 h-4 text-[#18181B]" />,
    isActive: () => false,
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
];

interface SlashCommandMenuProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  query: string;
  position: { top: number; left: number };
}

export function SlashCommandMenu({
  editor,
  isOpen,
  onClose,
  query,
  position,
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prevQuery, setPrevQuery] = useState(query);
  const menuRef = useRef<HTMLDivElement>(null);

  if (query !== prevQuery) {
    setPrevQuery(query);
    setSelectedIndex(0);
  }

  const filteredItems = COMMAND_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const executeCommand = useCallback(
    (item: CommandItem) => {
      // Delete slash trigger text
      const { state } = editor;
      const { from } = state.selection;
      const textBefore = state.doc.textBetween(Math.max(0, from - 20), from);
      const slashPos = textBefore.lastIndexOf('/');
      if (slashPos !== -1) {
        const start = from - (textBefore.length - slashPos);
        editor.commands.deleteRange({ from: start, to: from });
      }

      item.action(editor);
      onClose();
    },
    [editor, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          executeCommand(filteredItems[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose, executeCommand]);

  // Click outside to dismiss
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || filteredItems.length === 0) return null;

  const categories = ['Style', 'Block', 'Insert'] as const;

  return (
    <div
      ref={menuRef}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      className="fixed z-50 w-57.5 bg-white rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.04)] border border-border p-1.5 animate-fade-in text-xs select-none"
    >
      {categories.map((cat, catIdx) => {
        const catItems = filteredItems.filter((i) => i.category === cat);
        if (catItems.length === 0) return null;

        return (
          <div key={cat}>
            {catIdx > 0 && <div className="border-t border-[#F3F4F6] my-1 mx-2" />}
            <div className="px-3 pt-1.5 pb-1 text-[11px] font-medium text-text-muted select-none">
              {cat}
            </div>
            <div className="space-y-0.5">
              {catItems.map((item) => {
                const itemGlobalIdx = filteredItems.findIndex((i) => i.id === item.id);
                const isSelected = itemGlobalIdx === selectedIndex;
                const active = item.isActive(editor);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => executeCommand(item)}
                    onMouseEnter={() => setSelectedIndex(itemGlobalIdx)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#F4F4F6] text-text-primary'
                        : 'text-[#1F2937] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-5 flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <span className="text-[13px] font-normal text-[#18181B] truncate">
                        {item.label}
                      </span>
                    </div>

                    {active && (
                      <Check className="w-3.5 h-3.5 text-[#18181B] stroke-[2.2] ml-auto shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
