'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { Plus, GripVertical, Sparkles, ArrowUp } from 'lucide-react';
import { SlashCommandMenu } from './SlashCommandMenu';
import { SelectionAIMenu } from './SelectionAIMenu';
import { AIDraftPreview, type AIDraftStatus } from './AIDraftPreview';
import type { PendingEditorInsert, AIDraftMode } from '@/lib/aiDraft';

interface EditorCanvasProps {
  initialContent: Record<string, unknown> | string;
  documentId: string | null;
  onAutoSave: (contentJson: Record<string, unknown>, contentText: string) => void;
  onIdleIndex?: () => void;
  /** Single AI-confirmed insert (Keep / chat Insert). Applied once, then cleared via callback. */
  pendingInsert?: PendingEditorInsert | null;
  onPendingInsertApplied?: () => void;
  /** True while an AI draft preview is active (hides the inline entry). */
  draftActive?: boolean;
  /** Explicit inline-AI entry: invoked only from the editor's own Draft UI. */
  onInlineDraft?: (prompt: string, caretPos: number | null) => void;
  /** Active draft preview bundle (owned by the page, rendered at the caret). */
  draftPreview?: {
    prompt: string;
    visibleMarkdown: string;
    totalLength: number;
    status: AIDraftStatus;
    stoppedEarly: boolean;
    error: string | null;
    mode: AIDraftMode;
  } | null;
  docEmpty?: boolean;
  onDraftModeChange?: (mode: AIDraftMode) => void;
  onKeepDraft?: () => void;
  onTryAgainDraft?: () => void;
  onDiscardDraft?: () => void;
  onStopDraft?: () => void;
}

export function EditorCanvas({
  initialContent,
  documentId,
  onAutoSave,
  onIdleIndex,
  pendingInsert,
  onPendingInsertApplied,
  draftActive = false,
  onInlineDraft,
  draftPreview = null,
  docEmpty = true,
  onDraftModeChange,
  onKeepDraft,
  onTryAgainDraft,
  onDiscardDraft,
  onStopDraft,
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

  // Inline AI prompt state (explicit trigger from the / menu only)
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiPromptValue, setAiPromptValue] = useState('');
  const aiInputRef = useRef<HTMLInputElement>(null);
  const aiPromptRef = useRef<HTMLDivElement>(null);
  // Viewport anchor for the prompt + preview, captured at the caret line.
  // maxH caps the floating card to the visible space so its action buttons
  // (Keep / Discard) are always reachable by scrolling inside the card.
  const [aiAnchor, setAiAnchor] = useState<{ top: number; left: number; maxH: number } | null>(null);

  // Scroll the page so `needed` px below the caret line become visible.
  // Fixed popups can't extend the page themselves — the page must make room.
  // Takes the editor host element explicitly so editor callbacks (created once)
  // never capture a stale closure.
  const ensureRoomBelow = useCallback((host: HTMLElement | null, caretBottom: number, needed: number) => {
    const deficit = caretBottom + 8 + needed - window.innerHeight;
    if (deficit <= 0) return;
    let scroller: HTMLElement | null = null;
    let cur = host?.parentElement ?? null;
    while (cur && !scroller) {
      try {
        const style = window.getComputedStyle(cur);
        if (
          (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          cur.scrollHeight > cur.clientHeight + 1
        ) {
          scroller = cur;
        }
      } catch {
        // ignore
      }
      cur = cur.parentElement;
    }
    if (!scroller) {
      scroller = (document.scrollingElement as HTMLElement | null) ?? null;
    }
    if (!scroller) return;
    try {
      const maxScroll = scroller.scrollHeight - scroller.clientHeight;
      scroller.scrollTop = Math.min(Math.max(maxScroll, 0), scroller.scrollTop + deficit + 16);
    } catch {
      // ignore
    }
  }, []);

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
          let coords = ed.view.coordsAtPos(from);
          // Make room for the menu: scroll the page first so the popup is
          // never cut off at the viewport bottom, then re-anchor.
          ensureRoomBelow(ed.view.dom, coords.bottom, 340);
          try {
            coords = ed.view.coordsAtPos(from);
          } catch {
            // keep first coords
          }
          let top = coords.bottom + 6;
          if (top + 340 > window.innerHeight) {
            top = Math.max(16, coords.top - 340);
          }
          setSlashMenuPos({
            top,
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

  // Track emptiness for the inline AI entry (set on mount + every update).
  // Focus the inline prompt when it opens.
  useEffect(() => {
    if (aiPromptOpen) aiInputRef.current?.focus();
  }, [aiPromptOpen]);

  // Apply a single user-confirmed AI insert (Keep / chat Insert into doc).
  // This is the ONLY path by which assistant content enters the document,
  // so it triggers exactly one debounced auto-save (and later one index).
  // The docId guard drops stale inserts after a document switch.
  const pendingNonceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!editor || !pendingInsert || pendingInsert.docId !== documentId) return;
    if (pendingNonceRef.current === pendingInsert.nonce) return;
    pendingNonceRef.current = pendingInsert.nonce;
    try {
      if (pendingInsert.mode === 'replace' || !editor.getText().trim()) {
        editor.commands.setContent(pendingInsert.html || '<p></p>');
      } else if (pendingInsert.pos != null) {
        // Insert where the cursor was when the draft started (clamped live).
        const size = editor.state.doc.content.size;
        const at = Math.max(0, Math.min(pendingInsert.pos, size));
        editor.chain().focus().insertContentAt(at, pendingInsert.html).run();
      } else {
        const end = editor.state.doc.content.size;
        editor.chain().focus().insertContentAt(end, pendingInsert.html).run();
      }
    } finally {
      onPendingInsertApplied?.();
    }
  }, [editor, pendingInsert, documentId, onPendingInsertApplied]);

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

  const openAiPrompt = useCallback(() => {
    // Pin the prompt (and later the preview) to the line being written on.
    // Scroll the page first so there is room for the dialog below the line.
    if (editor) {
      try {
        const { from } = editor.state.selection;
        let coords = editor.view.coordsAtPos(from);
        ensureRoomBelow(editor.view.dom, coords.bottom, 220);
        try {
          coords = editor.view.coordsAtPos(from);
        } catch {
          // keep first coords
        }
        const cardWidth = 576;
        const left = Math.max(16, Math.min(coords.left, window.innerWidth - cardWidth - 16));
        // Open below the line when there is room; otherwise flip above it.
        // Either way the card is capped to the visible space so its buttons
        // stay reachable (the card itself scrolls).
        const spaceBelow = window.innerHeight - (coords.bottom + 8);
        if (spaceBelow >= 420) {
          const top = coords.bottom + 8;
          setAiAnchor({ top, left, maxH: Math.max(220, window.innerHeight - top - 16) });
        } else {
          const top = Math.max(16, coords.top - 504);
          setAiAnchor({ top, left, maxH: Math.max(220, coords.top - 70 - 16) });
        }
      } catch {
        setAiAnchor(null);
      }
    } else {
      setAiAnchor(null);
    }
    setAiPromptOpen(true);
  }, [editor, ensureRoomBelow]);

  const submitAiPrompt = useCallback(() => {
    const prompt = aiPromptValue.trim();
    if (!prompt || !onInlineDraft) return;
    let caret: number | null = null;
    try {
      caret = editor?.state.selection.from ?? null;
    } catch {
      caret = null;
    }
    setAiPromptOpen(false);
    setAiPromptValue('');
    onInlineDraft(prompt, caret);
  }, [aiPromptValue, onInlineDraft, editor]);

  // Click outside closes the inline prompt (the draft preview has its own actions).
  useEffect(() => {
    if (!aiPromptOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (aiPromptRef.current && !aiPromptRef.current.contains(e.target as Node)) {
        setAiPromptOpen(false);
        setAiPromptValue('');
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [aiPromptOpen]);

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

      {/* Explicit inline AI entry: prompt card opened from / → Create with AI.
          The only way to start a draft from here; chat never triggers it. */}
      {onInlineDraft && aiPromptOpen && !draftActive && (
        <div
          ref={aiPromptRef}
          style={
            aiAnchor
              ? { top: `${aiAnchor.top}px`, left: `${aiAnchor.left}px`, maxHeight: `${aiAnchor.maxH}px`, overflowY: 'auto' as const }
              : undefined
          }
          className={
            aiAnchor
              ? 'fixed z-50 w-[min(36rem,calc(100vw-2rem))] rounded-2xl border border-border bg-white shadow-xl p-3 animate-fade-in'
              : 'mt-3 rounded-2xl border border-border bg-white shadow-xl p-3 animate-fade-in'
          }
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sidebar border border-border focus-within:border-text-primary/40 transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <input
              ref={aiInputRef}
              type="text"
              value={aiPromptValue}
              onChange={(e) => setAiPromptValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitAiPrompt();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setAiPromptOpen(false);
                  setAiPromptValue('');
                }
              }}
              placeholder="Describe what to write…"
              aria-label="Describe what the AI should create"
              className="flex-1 min-w-0 bg-transparent text-base sm:text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            <button
              type="button"
              onClick={submitAiPrompt}
              disabled={!aiPromptValue.trim()}
              title="Start draft"
              className="w-7 h-7 rounded-full bg-text-primary text-white hover:bg-black disabled:opacity-25 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="mt-2 text-[11px] text-text-muted">
            AI will create in a preview right below your line. Nothing is saved until you keep it.
          </p>
        </div>
      )}

      {/* Draft preview anchored at the caret line (falls back below the editor). */}
      {draftPreview && onKeepDraft && onTryAgainDraft && onDiscardDraft && onStopDraft && onDraftModeChange && (
        aiAnchor ? (
          <div
            style={{ top: `${aiAnchor.top}px`, left: `${aiAnchor.left}px` }}
            className="fixed z-50 w-[min(36rem,calc(100vw-2rem))] animate-fade-in"
          >
            <AIDraftPreview
              prompt={draftPreview.prompt}
              visibleMarkdown={draftPreview.visibleMarkdown}
              totalLength={draftPreview.totalLength}
              status={draftPreview.status}
              stoppedEarly={draftPreview.stoppedEarly}
              error={draftPreview.error}
              mode={draftPreview.mode}
              docEmpty={docEmpty}
              onModeChange={onDraftModeChange}
              onKeep={onKeepDraft}
              onTryAgain={onTryAgainDraft}
              onDiscard={onDiscardDraft}
              onStop={onStopDraft}
              capHeight={aiAnchor.maxH}
            />
          </div>
        ) : (
          <div className="mt-4">
            <AIDraftPreview              prompt={draftPreview.prompt}
              visibleMarkdown={draftPreview.visibleMarkdown}
              totalLength={draftPreview.totalLength}
              status={draftPreview.status}
              stoppedEarly={draftPreview.stoppedEarly}
              error={draftPreview.error}
              mode={draftPreview.mode}
              docEmpty={docEmpty}
              onModeChange={onDraftModeChange}
              onKeep={onKeepDraft}
              onTryAgain={onTryAgainDraft}
              onDiscard={onDiscardDraft}
              onStop={onStopDraft}
            />
          </div>
        )
      )}

      {/* Floating Slash Command Menu */}
      <SlashCommandMenu
        editor={editor}
        isOpen={slashMenuOpen}
        onClose={() => setSlashMenuOpen(false)}
        query={slashQuery}
        position={slashMenuPos}
        onAiDraftCommand={onInlineDraft ? openAiPrompt : undefined}
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
