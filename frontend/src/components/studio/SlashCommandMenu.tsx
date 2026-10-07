'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Table as TableIcon,
  Link as LinkIcon,
  Minus,
} from 'lucide-react';
import { Editor } from '@tiptap/react';

export interface CommandItem {
  id: string;
  category: 'Style' | 'Block' | 'Insert';
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: (editor: Editor) => void;
}

const COMMAND_ITEMS: CommandItem[] = [
  // Style
  {
    id: 'text',
    category: 'Style',
    label: 'Text',
    description: 'Plain text paragraph',
    icon: Type,
    action: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    id: 'h1',
    category: 'Style',
    label: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: 'h2',
    category: 'Style',
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'h3',
    category: 'Style',
    label: 'Heading 3',
    description: 'Small subsection heading',
    icon: Heading3,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: 'bullet-list',
    category: 'Style',
    label: 'Bullet list',
    description: 'Create a simple bulleted list',
    icon: List,
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'numbered-list',
    category: 'Style',
    label: 'Numbered list',
    description: 'Create a list with numbering',
    icon: ListOrdered,
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'todo-list',
    category: 'Style',
    label: 'To-do list',
    description: 'Track tasks with checkboxes',
    icon: CheckSquare,
    action: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  // Block
  {
    id: 'code-block',
    category: 'Block',
    label: 'Code block',
    description: 'Capture code snippet with syntax styling',
    icon: Code,
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: 'quote',
    category: 'Block',
    label: 'Quote',
    description: 'Capture a standout quote',
    icon: Quote,
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  // Insert
  {
    id: 'table',
    category: 'Insert',
    label: 'Table',
    description: 'Insert a 3x3 table grid',
    icon: TableIcon,
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
    description: 'Insert web hyperlink',
    icon: LinkIcon,
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
    description: 'Visual divider line',
    icon: Minus,
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
    item.category.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
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

  if (!isOpen || filteredItems.length === 0) return null;

  const categories = ['Style', 'Block', 'Insert'] as const;

  return (
    <div
      ref={menuRef}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      className="fixed z-50 w-64 max-h-84 overflow-y-auto bg-surface border border-border rounded-xl shadow-xl p-1.5 animate-fade-in text-xs"
    >
      {categories.map((cat) => {
        const catItems = filteredItems.filter((i) => i.category === cat);
        if (catItems.length === 0) return null;

        return (
          <div key={cat} className="mb-2 last:mb-0">
            <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-text-muted uppercase select-none">
              {cat}
            </div>
            <div className="space-y-0.5">
              {catItems.map((item) => {
                const itemGlobalIdx = filteredItems.findIndex((i) => i.id === item.id);
                const isSelected = itemGlobalIdx === selectedIndex;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => executeCommand(item)}
                    onMouseEnter={() => setSelectedIndex(itemGlobalIdx)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer select-none ${
                      isSelected
                        ? 'bg-sidebar text-text-primary font-medium'
                        : 'text-text-secondary hover:bg-sidebar hover:text-text-primary'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-border bg-surface text-accent'
                          : 'border-border-subtle bg-base text-text-muted'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium text-text-primary">{item.label}</div>
                      <div className="truncate text-[10px] text-text-muted">{item.description}</div>
                    </div>
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
