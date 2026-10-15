'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Loader2,
  ArrowUp,
} from 'lucide-react';
import { usePrompt } from '@/context/ConfirmContext';
import { api } from '@/lib/api';

export interface SelectionRange {
  from: number;
  to: number;
  text: string;
}

interface SelectionAIMenuProps {
  editor: Editor;
  documentId: string | null;
  position: { top: number; left: number };
  range: SelectionRange;
  onClose: () => void;
}

type PresetKey = 'improve' | 'proofread' | 'explain';

const PRESETS: { key: PresetKey; label: string; instruction: string }[] = [
  { key: 'improve', label: 'Improve writing', instruction: 'Improve writing' },
  { key: 'proofread', label: 'Proofread', instruction: 'Fix spelling and grammar' },
  { key: 'explain', label: 'Explain', instruction: 'Explain clearly' },
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function SelectionAIMenu({
  editor,
  documentId,
  position,
  range,
  onClose,
}: SelectionAIMenuProps) {
  const prompt = usePrompt();
  const menuRef = useRef<HTMLDivElement>(null);
  const [customInput, setCustomInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('Refining...');
  const [result, setResult] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<PresetKey | 'custom' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep latest range in a ref so async callbacks never use a stale closure.
  const rangeRef = useRef(range);
  useEffect(() => {
    rangeRef.current = range;
  }, [range]);

  // Click outside to dismiss (implies discard).
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleScroll = () => onClose();
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  const runRefactor = async (preset: PresetKey | 'custom', instruction: string) => {
    const text = rangeRef.current.text;
    if (!text || !text.trim()) {
      setError('Select some text first.');
      return;
    }
    if (!documentId) {
      setError('No document selected.');
      return;
    }
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setActivePreset(preset);
    setLoadingLabel(preset === 'explain' ? 'Explaining...' : 'Refining...');

    try {
      const res = await api.post(
        `/documents/${documentId}/ai-refactor`,
        {
          selected_text: text,
          instruction,
          preset: preset === 'custom' ? null : preset,
        }
      );
      const rewritten = typeof res.rewritten === 'string' ? res.rewritten.trim() : '';
      if (!rewritten) {
        setError('AI returned empty text. Try again.');
      } else {
        setResult(rewritten);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isRangeValid = (): boolean => {
    try {
      const size = editor.state.doc.content.size;
      const { from, to } = rangeRef.current;
      return from >= 0 && to <= size && from < to;
    } catch {
      return false;
    }
  };

  const handleReplace = () => {
    if (!result) return;
    if (!isRangeValid()) {
      setError('Selection changed. Please reselect and try again.');
      return;
    }
    const { from, to } = rangeRef.current;
    try {
      editor.chain().focus().insertContentAt({ from, to }, escapeHtml(result)).run();
      onClose();
    } catch {
      setError('Could not replace text. Please try again.');
    }
  };

  const handleInsertBelow = () => {
    if (!result) return;
    try {
      const size = editor.state.doc.content.size;
      const at = Math.min(Math.max(rangeRef.current.to, 0), size);
      editor
        .chain()
        .focus()
        .setTextSelection(at)
        .insertContent(`<p>${escapeHtml(result)}</p>`)
        .run();
      onClose();
    } catch {
      setError('Could not insert text. Please try again.');
    }
  };

  const handleLink = async () => {
    const url = await prompt({
      title: 'Insert Link',
      description: 'Enter the destination URL for the selected text:',
      placeholder: 'https://example.com',
      confirmLabel: 'Insert Link',
    });
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const showPreview = result !== null && !isLoading;
  const isExplain = activePreset === 'explain';

  return (
    <div
      ref={menuRef}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="fixed z-50 w-72 max-h-96 overflow-y-auto bg-white text-text-primary rounded-2xl shadow-xl border border-border p-2.5 animate-fade-in select-none"
      role="menu"
      aria-label="Text selection menu"
    >
      {/* Row 1: inline formatting (Bold, Italic, Strike, Code, Link) */}
      <div className="flex items-center gap-1 px-1 pb-2">
        <button
          type="button"
          title="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${editor.isActive('bold') ? 'bg-accent-subtle text-accent-hover' : 'text-text-secondary hover:bg-sidebar hover:text-text-primary'}`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${editor.isActive('italic') ? 'bg-accent-subtle text-accent-hover' : 'text-text-secondary hover:bg-sidebar hover:text-text-primary'}`}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Strikethrough"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${editor.isActive('strike') ? 'bg-accent-subtle text-accent-hover' : 'text-text-secondary hover:bg-sidebar hover:text-text-primary'}`}
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Code"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${editor.isActive('code') ? 'bg-accent-subtle text-accent-hover' : 'text-text-secondary hover:bg-sidebar hover:text-text-primary'}`}
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Link"
          onClick={() => void handleLink()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${editor.isActive('link') ? 'bg-accent-subtle text-accent-hover' : 'text-text-secondary hover:bg-sidebar hover:text-text-primary'}`}
        >
          <LinkIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="border-t border-border mx-1" />

      {/* Row 2: Skills */}
      <div className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        Skills
      </div>
      <div className="space-y-0.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            disabled={isLoading}
            onClick={() => void runRefactor(preset.key, preset.instruction)}
            className="w-full flex items-center px-2.5 py-1.5 rounded-xl text-xs text-text-secondary hover:bg-sidebar hover:text-text-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default text-left"
          >
            {isLoading && activePreset === preset.key ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-2 shrink-0" />
            ) : null}
            <span className="text-[13px]">{preset.label}</span>
          </button>
        ))}
      </div>

      {/* Row 3: custom instruction input */}
      <form
        className="mt-2 flex items-center gap-2 bg-white border border-border rounded-2xl px-3 py-2 focus-within:border-text-primary/40"
        onSubmit={(e) => {
          e.preventDefault();
          const instruction = customInput.trim();
          if (!instruction || isLoading) return;
          void runRefactor('custom', instruction);
        }}
      >
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Ask AI..."
          disabled={isLoading}
          aria-label="Custom AI instruction"
          className="flex-1 min-w-0 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !customInput.trim()}
          title="Send to AI"
          className="w-7 h-7 rounded-full bg-text-primary text-white hover:bg-black disabled:opacity-25 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Loading state inside the popup */}
      {isLoading && (
        <div className="mt-2 flex items-center gap-2 px-2.5 py-2 rounded-xl bg-sidebar text-text-muted">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span className="text-xs animate-pulse">{loadingLabel}</span>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="mt-2 px-2.5 py-2 rounded-xl bg-red-50 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Preview with Replace / Insert below / Discard */}
      {showPreview && (
        <div className="mt-2 rounded-xl border border-border overflow-hidden">
          <div className="px-2.5 py-2 text-xs text-text-primary leading-relaxed bg-sidebar/60 max-h-32 overflow-y-auto">
            {result}
          </div>
          <div className="flex items-center gap-2 px-2 py-2 bg-white">
            {!isExplain && (
              <button
                type="button"
                onClick={handleReplace}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-text-primary text-white hover:bg-black transition-colors cursor-pointer"
              >
                Replace
              </button>
            )}
            <button
              type="button"
              onClick={handleInsertBelow}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${isExplain ? 'bg-text-primary text-white hover:bg-black' : 'text-text-secondary hover:bg-sidebar hover:text-text-primary'}`}
            >
              Insert below
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs text-text-secondary hover:bg-sidebar hover:text-text-primary transition-colors cursor-pointer"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
