'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ArrowUp,
  Square,
  Trash2,
  Copy,
  Check,
  FileText,
  File,
  Sparkles,
  Wand2,
  HelpCircle,
  CheckCheck,
  ChevronDown,
  Plus,
  MessageSquare,
  Layers,
} from 'lucide-react';
import { useChat, AskQuestionOptions } from '../../hooks/useChat';
import { useChatThreads, ChatThread } from '../../hooks/useChatThreads';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../lib/api';

function isToday(dateStr: string): boolean {
  try {
    const cleanDate = !dateStr.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(dateStr)
      ? `${dateStr}Z`
      : dateStr;
    const d = new Date(cleanDate);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  } catch {
    return false;
  }
}

function formatShortTime(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const cleanDate = !dateStr.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(dateStr)
      ? `${dateStr}Z`
      : dateStr;
    const date = new Date(cleanDate);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(Math.max(0, diffMs / 1000) / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return 'now';
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function OraLogoMark({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        d="M6 3.5C4.62 3.5 3.5 4.62 3.5 6v7c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V6C8.5 4.62 7.38 3.5 6 3.5z"
        className="fill-current text-text-primary"
      />
      <path
        d="M13.5 5C12.12 5 11 6.12 11 7.5v7c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5v-7c0-1.38-1.12-2.5-2.5-2.5z"
        className="fill-current text-text-primary"
      />
    </svg>
  );
}

export interface MentionItem {
  id: string;
  title: string;
  type: 'document' | 'asset';
}

export interface OraSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialScope?: MentionItem | null;
  mode?: 'universal' | 'assets' | 'studio';
  onSelectThreadDocument?: (scope: MentionItem) => void;
  /**
   * Assets multi-scope (controlled). `null` = query across ALL assets
   * (default). `string[]` = narrowed subset. When omitted, falls back to
   * legacy single `initialScope` / `attachedScope` behaviour.
   */
  availableScopes?: MentionItem[];
  activeScopeIds?: string[] | null;
  onScopeChange?: (ids: string[] | null) => void;
}

const MAX_SCOPE_IDS = 200;

export default function OraSidebar({
  isOpen,
  onClose,
  initialScope,
  mode = 'universal',
  onSelectThreadDocument,
  availableScopes,
  activeScopeIds,
  onScopeChange,
}: OraSidebarProps) {
  const { currentWorkspace } = useWorkspace();
  const {
    messages,
    loading,
    streaming,
    currentThreadId,
    switchThread,
    askQuestion,
    stopGenerating,
    clearHistory,
  } = useChat(currentWorkspace?.id, undefined, mode);

  const { threads, deleteThread } = useChatThreads(currentWorkspace?.id, mode);
  const [isHistoryDropdownOpen, setIsHistoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState('');
  const [attachedScope, setAttachedScope] = useState<MentionItem | null>(null);
  const [isScopeSelectorOpen, setIsScopeSelectorOpen] = useState(false);
  const scopeSelectorRef = useRef<HTMLDivElement>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const [docs, setDocs] = useState<MentionItem[]>([]);
  const [assets, setAssets] = useState<MentionItem[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showSourcesForMsg, setShowSourcesForMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Track open state transitions and initialScope prop updates cleanly.
  // Skipped in controlled Assets mode: the parent owns scope via
  // activeScopeIds/onScopeChange (preview selection ≠ query scope).
  const [prevInitialScopeId, setPrevInitialScopeId] = useState(initialScope?.id);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const skipLegacyScopeSync = mode === 'assets' && activeScopeIds !== undefined;

  if (!skipLegacyScopeSync && isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen && initialScope) {
      setAttachedScope(initialScope);
      setPrevInitialScopeId(initialScope.id);
    }
  } else if (!skipLegacyScopeSync && initialScope?.id !== prevInitialScopeId) {
    setPrevInitialScopeId(initialScope?.id);
    if (initialScope) {
      setAttachedScope(initialScope);
    }
  } else if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
  }

  // Keyboard shortcut toggle ⌘. / Ctrl+.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          window.dispatchEvent(new CustomEvent('toggle-ora-sidebar'));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch docs & assets for @ mention autocomplete
  useEffect(() => {
    if (!currentWorkspace?.id) return;

    let active = true;
    async function loadMentions() {
      try {
        const [docsRes, assetsRes] = await Promise.all([
          api
            .get(`/documents?workspace_id=${currentWorkspace?.id}`)
            .catch(() => ({ documents: [] })),
          api
            .get(`/sources?workspace_id=${currentWorkspace?.id}`)
            .catch(() => ({ sources: [] })),
        ]);
        if (!active) return;

        const docItems: MentionItem[] = (docsRes.documents || []).map(
          (d: { id: string; title: string }) => ({
            id: d.id,
            title: d.title || 'Untitled Document',
            type: 'document',
          })
        );
        const assetItems: MentionItem[] = (assetsRes.sources || []).map(
          (s: { id: string; filename: string }) => ({
            id: s.id,
            title: s.filename || 'Untitled Asset',
            type: 'asset',
          })
        );

        setDocs(docItems);
        setAssets(assetItems);
      } catch {
        // ignore error
      }
    }

    void loadMentions();
    return () => {
      active = false;
    };
  }, [currentWorkspace?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  // Filter mentions based on user input after '@'
  const filteredDocs = docs.filter((d) =>
    d.title.toLowerCase().includes(mentionQuery.toLowerCase())
  );
  const filteredAssets = assets.filter((a) =>
    a.title.toLowerCase().includes(mentionQuery.toLowerCase())
  );
  const allFilteredMentions = [...filteredDocs, ...filteredAssets];

  // ---- Assets multi-scope model (controlled All-assets default) ----
  // Parent-owned when `activeScopeIds` is provided (Assets page); otherwise
  // legacy single-scope behaviour (Studio / universal / uncontrolled).
  const isAssetsControlled = mode === 'assets' && activeScopeIds !== undefined;
  const scopeCatalog: MentionItem[] = availableScopes ?? assets;
  const isAllAssetsMode =
    mode === 'assets' &&
    (isAssetsControlled ? activeScopeIds === null : !attachedScope);
  const narrowedAssets: MentionItem[] = isAssetsControlled
    ? scopeCatalog.filter((s) => activeScopeIds?.includes(s.id))
    : attachedScope
      ? [attachedScope]
      : [];
  // Display scope: All chip, narrowed chips, or legacy single attachment.
  const displayScope: MentionItem | null = attachedScope;
  const assetsScopeLabel: string | null =
    mode !== 'assets'
      ? null
      : isAllAssetsMode
        ? scopeCatalog.length > 0
          ? `All ${scopeCatalog.length} asset${scopeCatalog.length === 1 ? '' : 's'}`
          : null
        : narrowedAssets.length === 1
          ? narrowedAssets[0].title
          : narrowedAssets.length > 1
            ? `${narrowedAssets.length} assets`
            : null;

  const resolveAssetsSubmitScope = (): { scopeIds: string[]; attachedName?: string } => {
    if (scopeCatalog.length === 0) return { scopeIds: [] };
    if (isAllAssetsMode) {
      const allIds = scopeCatalog.map((s) => s.id).slice(0, MAX_SCOPE_IDS);
      return {
        scopeIds: allIds,
        attachedName: `All ${scopeCatalog.length} asset${scopeCatalog.length === 1 ? '' : 's'}`,
      };
    }
    // Stale ids (e.g. asset deleted mid-session) fall back to All, never to
    // an empty list — empty would trigger workspace-wide retrieval.
    if (narrowedAssets.length === 0) {
      const allIds = scopeCatalog.map((s) => s.id).slice(0, MAX_SCOPE_IDS);
      return {
        scopeIds: allIds,
        attachedName: `All ${scopeCatalog.length} asset${scopeCatalog.length === 1 ? '' : 's'}`,
      };
    }
    const ids = narrowedAssets.map((s) => s.id).slice(0, MAX_SCOPE_IDS);
    const name =
      narrowedAssets.length === 1 ? narrowedAssets[0].title : `${narrowedAssets.length} assets`;
    return { scopeIds: ids, attachedName: name };
  };

  const setAssetsScope = (ids: string[] | null) => {
    onScopeChange?.(ids);
    // Keep legacy single-scope display in sync for compat.
    if (!ids) {
      setAttachedScope(null);
    } else if (ids.length === 1) {
      const match = scopeCatalog.find((s) => s.id === ids[0]);
      if (match) setAttachedScope(match);
    }
    setIsScopeSelectorOpen(false);
  };

  const toggleScopeId = (id: string) => {
    if (!isAssetsControlled && !availableScopes) return;
    const current: string[] | null = isAssetsControlled
      ? activeScopeIds ?? null
      : attachedScope
        ? [attachedScope.id]
        : null;
    if (current === null) {
      // Narrow down from All by excluding the toggled asset.
      const next = scopeCatalog.map((s) => s.id).filter((sid) => sid !== id);
      setAssetsScope(next.length === scopeCatalog.length ? null : next);
      return;
    }
    const next = current.includes(id)
      ? current.filter((sid) => sid !== id)
      : [...current, id];
    // Selecting every asset (or clearing all) collapses back to All mode.
    if (next.length === 0 || next.length >= scopeCatalog.length) {
      setAssetsScope(null);
      return;
    }
    setAssetsScope(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    const lastAtIndex = val.lastIndexOf('@');
    if (lastAtIndex !== -1 && (lastAtIndex === 0 || val[lastAtIndex - 1] === ' ')) {
      const query = val.slice(lastAtIndex + 1);
      if (!query.includes(' ')) {
        setShowMentions(true);
        setMentionQuery(query);
        setSelectedIndex(0);
        return;
      }
    }
    setShowMentions(false);
  };

  const handleSelectMention = useCallback(
    (item: MentionItem) => {
      // In controlled Assets mode, @ mention narrows the query to one asset.
      if (mode === 'assets' && activeScopeIds !== undefined) {
        onScopeChange?.([item.id]);
      }
      setAttachedScope(item);
      const lastAtIndex = input.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        setInput(input.slice(0, lastAtIndex).trim());
      }
      setShowMentions(false);
      setMentionQuery('');
      inputRef.current?.focus();
    },
    [input, mode, activeScopeIds, onScopeChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showMentions || allFilteredMentions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allFilteredMentions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? allFilteredMentions.length - 1 : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = allFilteredMentions[selectedIndex];
      if (selected) {
        handleSelectMention(selected);
      }
    } else if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  const studioPrompts = [
    {
      label: 'Summarize this',
      description: 'Create a concise summary of this document',
      prompt: 'Summarize this document concisely and highlight the main takeaways.',
      icon: Sparkles,
    },
    {
      label: 'Improve writing',
      description: 'Enhance vocabulary, flow, and tone',
      prompt: 'Improve the writing and clarity of this document while preserving its core meaning.',
      icon: Wand2,
    },
    {
      label: 'Explain this',
      description: 'Break down complex concepts simply',
      prompt: 'Explain the key concepts and ideas in this document clearly.',
      icon: HelpCircle,
    },
    {
      label: 'Fix grammar',
      description: 'Correct spelling and grammatical errors',
      prompt: 'Fix grammar, spelling, and phrasing issues throughout this document.',
      icon: CheckCheck,
    },
  ];

  const handleStudioPrompt = (promptText: string) => {
    if (streaming) return;
    const activeScope = attachedScope || initialScope;
    askQuestion(promptText, {
      workspaceId: currentWorkspace?.id,
      requireScope: true,
      mode,
      scopeIds: activeScope ? [activeScope.id] : [],
      attachedName: activeScope?.title,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (rawData) {
        const parsed = JSON.parse(rawData);
        if (parsed.id && parsed.title) {
          if (mode === 'assets' && activeScopeIds !== undefined) {
            onScopeChange?.([parsed.id]);
          }
          setAttachedScope({
            id: parsed.id,
            title: parsed.title,
            type: parsed.type || 'asset',
          });
        }
      }
    } catch (err) {
      console.error('Failed to parse dropped asset:', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const queryToSend = input.trim();

    // Assets: default to ALL assets (expanded id list, capped). Only strict
    // when the library is empty — otherwise an empty query would leak into
    // Studio docs via workspace-wide retrieval.
    if (mode === 'assets') {
      const { scopeIds, attachedName } = resolveAssetsSubmitScope();
      const scopeOptions: AskQuestionOptions = {
        workspaceId: currentWorkspace?.id,
        requireScope: scopeCatalog.length === 0,
        mode,
      };
      if (scopeIds.length > 0) {
        scopeOptions.scopeIds = scopeIds;
        scopeOptions.attachedName = attachedName;
      }
      askQuestion(queryToSend, scopeOptions);
      setInput('');
      setShowMentions(false);
      setIsScopeSelectorOpen(false);
      return;
    }

    const activeScope = attachedScope;
    const isStrictScope = mode === 'studio';

    const scopeOptions: AskQuestionOptions = {
      workspaceId: currentWorkspace?.id,
      requireScope: isStrictScope,
      mode,
    };

    if (activeScope) {
      scopeOptions.scopeIds = [activeScope.id];
      scopeOptions.attachedName = activeScope.title;
    }

    askQuestion(queryToSend, scopeOptions);
    setInput('');
    if (mode === 'universal') {
      setAttachedScope(null);
    }
    setShowMentions(false);
  };

  const handleCopyMessage = async (msgId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!isHistoryDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsHistoryDropdownOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsHistoryDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isHistoryDropdownOpen]);

  useEffect(() => {
    if (!isScopeSelectorOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (scopeSelectorRef.current && !scopeSelectorRef.current.contains(e.target as Node)) {
        setIsScopeSelectorOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsScopeSelectorOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isScopeSelectorOpen]);

  const handleSelectThread = (thread: ChatThread) => {
    // Guard: never load a thread from another pipeline into this sidebar.
    if (thread.mode && thread.mode !== mode) return;
    switchThread(thread.id);
    if (thread.attached_scope) {
      const scope = thread.attached_scope as MentionItem;
      // All-assets threads persist only the first id with an "All N assets"
      // label — restore those to All mode instead of a single asset.
      if (mode === 'assets' && activeScopeIds !== undefined) {
        const title = (scope as { title?: string }).title || '';
        onScopeChange?.(title.startsWith('All ') ? null : [scope.id]);
      }
      setAttachedScope(scope);
      onSelectThreadDocument?.(scope);
    } else {
      if (mode === 'assets' && activeScopeIds !== undefined) {
        onScopeChange?.(null);
      }
      setAttachedScope(null);
    }
    setIsHistoryDropdownOpen(false);
  };

  const handleNewChat = () => {
    switchThread(null);
    if (mode === 'assets' && activeScopeIds !== undefined) {
      // New chat in Assets resets to All-assets query.
      onScopeChange?.(null);
    }
    setAttachedScope(null);
    setIsHistoryDropdownOpen(false);
  };

  const handleDeleteThread = async (threadId: string) => {
    await deleteThread(threadId);
    if (currentThreadId === threadId) {
      switchThread(null);
      if (mode === 'assets' && activeScopeIds !== undefined) {
        onScopeChange?.(null);
      }
      setAttachedScope(null);
    }
  };

  const handleClearHistory = async () => {
    if (currentThreadId) {
      if (confirm('Delete this conversation?')) {
        await deleteThread(currentThreadId);
        switchThread(null);
      }
    } else if (messages.length > 0) {
      if (confirm('Clear current messages?')) {
        await clearHistory(currentWorkspace?.id);
      }
    }
  };

  const activeThread = threads.find((t) => t.id === currentThreadId);
  const todayThreads = threads.filter((t) => isToday(t.updated_at || t.created_at));
  const olderThreads = threads.filter((t) => !isToday(t.updated_at || t.created_at));

  return (
    <aside
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`shrink-0 h-full bg-white flex flex-col select-none relative z-20 transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen
          ? 'w-80 sm:w-96 opacity-100 border-l border-border'
          : 'w-0 opacity-0 border-l-0 pointer-events-none'
      }`}
    >
      {/* Drag & Drop Visual Target Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-[#ECE8F4]/90 backdrop-blur-xs border-2 border-dashed border-[#765D96] rounded-xl flex flex-col items-center justify-center p-6 text-center animate-fade-in pointer-events-none">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3">
            <FileText className="w-6 h-6 text-[#765D96]" />
          </div>
          <span className="text-sm font-semibold text-text-primary">Drop PDF to attach</span>
          <span className="text-xs text-text-secondary mt-1">Ora will focus solely on this document</span>
        </div>
      )}

      <div className="w-80 sm:w-96 h-full flex flex-col shrink-0">
        {/* Top Header with Chat History Dropdown Trigger (matching Notion user image) */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-border/80 shrink-0 bg-white relative">
        <div className="flex items-center gap-1.5 min-w-0 max-w-[65%]">
          <OraLogoMark className="w-4 h-4 text-text-primary shrink-0" />
          <button
            type="button"
            onClick={() => setIsHistoryDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1 px-1.5 py-1 -ml-0.5 rounded-lg hover:bg-[#F3F4F6] text-text-primary transition-colors cursor-pointer min-w-0 max-w-full group"
            title="Conversation history"
          >
            <span className="text-sm font-semibold truncate tracking-tight">
              {activeThread?.title || 'Ora'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-text-muted group-hover:text-text-primary shrink-0 transition-transform duration-200 ${
                isHistoryDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleNewChat}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer"
            title="New conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer"
            title="Clear or delete conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer"
            title="Close Ora"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ora History Dropdown Menu — light-mode compliant (see DESIGN.md > Components > dropdown) */}
      {isHistoryDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-14 left-3 right-3 bg-white text-text-primary rounded-2xl shadow-xl border border-border p-2.5 z-50 animate-fade-in max-h-96 flex flex-col overflow-hidden"
        >
          {/* Top action: New chat */}
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-text-primary hover:bg-sidebar transition-colors cursor-pointer mb-2 border border-border bg-sidebar shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New chat</span>
          </button>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 -mr-1">
            {threads.length === 0 ? (
              <div className="py-6 text-center text-xs text-text-muted">
                No conversation history yet
              </div>
            ) : (
              <>
                {todayThreads.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-text-muted px-2 py-1 uppercase tracking-wider">
                      Today
                    </div>
                    <div className="space-y-0.5">
                      {todayThreads.map((thread) => (
                        <div
                          key={thread.id}
                          onClick={() => handleSelectThread(thread)}
                          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition-colors ${
                            currentThreadId === thread.id
                              ? 'bg-accent-subtle text-accent-hover font-medium'
                              : 'text-text-secondary hover:bg-sidebar hover:text-text-primary'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${currentThreadId === thread.id ? 'text-accent-hover' : 'text-text-muted group-hover:text-text-primary'}`} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs">{thread.title}</p>
                              {thread.attached_scope && (
                                <p className="truncate text-[10px] text-text-muted mt-0.5">
                                  {thread.attached_scope.title}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="text-[10px] text-text-muted">
                              {formatShortTime(thread.updated_at || thread.created_at)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDeleteThread(thread.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 rounded transition-all cursor-pointer"
                              title="Delete chat"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {olderThreads.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-text-muted px-2 py-1 uppercase tracking-wider">
                      Older
                    </div>
                    <div className="space-y-0.5">
                      {olderThreads.map((thread) => (
                        <div
                          key={thread.id}
                          onClick={() => handleSelectThread(thread)}
                          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition-colors ${
                            currentThreadId === thread.id
                              ? 'bg-accent-subtle text-accent-hover font-medium'
                              : 'text-text-secondary hover:bg-sidebar hover:text-text-primary'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${currentThreadId === thread.id ? 'text-accent-hover' : 'text-text-muted group-hover:text-text-primary'}`} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs">{thread.title}</p>
                              {thread.attached_scope && (
                                <p className="truncate text-[10px] text-text-muted mt-0.5">
                                  {thread.attached_scope.title}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="text-[10px] text-text-muted">
                              {formatShortTime(thread.updated_at || thread.created_at)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDeleteThread(thread.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 rounded transition-all cursor-pointer"
                              title="Delete chat"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-xs text-text-muted">
            Loading chat...
          </div>
        ) : messages.length === 0 ? (
          mode === 'studio' ? (
            /* Studio Notion-Style Prompt Helper Empty State */
            <div className="flex-1 flex flex-col justify-center items-center p-5 space-y-4 my-auto">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-xl bg-sidebar border border-border flex items-center justify-center mx-auto mb-2 shadow-2xs">
                  <Sparkles className="w-5 h-5 text-[#765D96]" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary">Studio Assistant</h3>
                <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                  {attachedScope?.title ? (
                    <span>
                      Working on <strong className="font-medium text-text-primary">{attachedScope.title}</strong>
                    </span>
                  ) : (
                    'Choose a quick action to edit or analyze your document'
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 w-full max-w-xs pt-1">
                {studioPrompts.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleStudioPrompt(item.prompt)}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-border/80 bg-white hover:bg-[#F9F9FB] hover:border-[#765D96]/40 text-left transition-all shadow-2xs group cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#ECE8F4] text-[#765D96] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-medium text-text-primary block truncate">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-text-muted block truncate">
                          {item.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : mode === 'assets' ? (
            /* Assets Scoped Empty State — All-assets default, narrow via chip/@/rows */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3 my-auto">
              <div className="w-10 h-10 rounded-xl bg-sidebar border border-border flex items-center justify-center mb-1 shadow-2xs">
                <FileText className="w-5 h-5 text-[#765D96]" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary truncate max-w-xs">
                {assetsScopeLabel ?? displayScope?.title ?? 'Asset Assistant'}
              </h3>
              <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                {scopeCatalog.length === 0
                  ? 'Upload your first PDF to start asking questions.'
                  : isAllAssetsMode
                    ? `Ask questions across all ${scopeCatalog.length} PDFs, or type @ to narrow to one.`
                    : narrowedAssets.length > 1
                      ? `Asking across ${narrowedAssets.length} selected PDFs. Click the scope chip to adjust.`
                      : 'Ask questions or extract insights strictly from this attached PDF.'}
              </p>
              {scopeCatalog.length > 0 ? (
                <div className="pt-2 flex flex-wrap gap-1.5 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      const { scopeIds, attachedName } = resolveAssetsSubmitScope();
                      askQuestion('Summarize this document', {
                        workspaceId: currentWorkspace?.id,
                        requireScope: false,
                        mode,
                        scopeIds,
                        attachedName,
                      });
                    }}
                    className="px-2.5 py-1 text-xs rounded-full bg-[#ECE8F4] text-[#765D96] hover:bg-[#E2D9EE] transition-colors cursor-pointer"
                  >
                    Summarize {isAllAssetsMode ? 'all' : 'document'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const { scopeIds, attachedName } = resolveAssetsSubmitScope();
                      askQuestion('What are the key points in this document?', {
                        workspaceId: currentWorkspace?.id,
                        requireScope: false,
                        mode,
                        scopeIds,
                        attachedName,
                      });
                    }}
                    className="px-2.5 py-1 text-xs rounded-full bg-[#ECE8F4] text-[#765D96] hover:bg-[#E2D9EE] transition-colors cursor-pointer"
                  >
                    Key takeaways
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            /* Universal Playground / Workspace Empty State (matching 04-ora-assistant-sidebar.png verbatim) */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3 my-auto">
              <div className="w-10 h-10 rounded-xl bg-sidebar border border-border flex items-center justify-center mb-1">
                <OraLogoMark className="w-5 h-5 text-text-secondary" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">Ask Ora anything</h3>
              <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                Type{' '}
                <span className="bg-[#F3F4F6] text-text-primary px-1.5 py-0.5 rounded border border-border font-mono text-[11px]">
                  @
                </span>{' '}
                to reference a document or asset
              </p>
              <div className="pt-2">
                <span className="text-[11px] text-text-muted">
                  Toggle with{' '}
                  <kbd className="px-1.5 py-0.5 bg-[#F3F4F6] border border-border rounded font-mono text-[10px]">
                    ⌘.
                  </kbd>
                </span>
              </div>
            </div>
          )
        ) : (
          /* Chat Messages Flow */
          <div className="space-y-4 flex-1">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const isLastMessage = index === messages.length - 1;
              const isThinking = !isUser && isLastMessage && streaming && !msg.content;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  {isUser ? (
                    /* User Message Bubble (Replicating User Image 1 & 2) */
                    <div className="max-w-[88%] rounded-2xl px-4 py-3 bg-[#83699e] text-white shadow-2xs">
                      {/* Attached Document Pill inside User Bubble */}
                      {(msg.attached_name || (msg.scope_ids && msg.scope_ids.length > 0)) && (
                        <div className="bg-white/20 text-white text-[11px] font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 mb-2 w-fit">
                          <FileText className="w-3 h-3 text-white/90" />
                          <span className="truncate max-w-50">
                            {msg.attached_name || 'Referenced Document'}
                          </span>
                        </div>
                      )}
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap font-normal">
                        {msg.content}
                      </p>
                    </div>
                  ) : isThinking ? (
                    /* Model Thinking State (Replicating User Image 1) */
                    <div className="pt-1 pb-2">
                      <span className="text-[13px] text-text-muted/80 font-normal animate-pulse select-none">
                        Thinking...
                      </span>
                    </div>
                  ) : (
                    /* Assistant Message Card (Replicating User Image 2) */
                    <div className="max-w-[92%] w-full flex flex-col group">
                      <div className="rounded-2xl p-4 bg-[#F4F4F6] text-text-primary text-[13px] leading-relaxed">
                        {/* Status Pills: Read document / Searched workspace */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {(msg.has_read_document || (msg.sources && msg.sources.length > 0)) && (
                            <button
                              type="button"
                              onClick={() =>
                                setShowSourcesForMsg((prev) =>
                                  prev === msg.id ? null : msg.id
                                )
                              }
                              className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#ECE8F4] text-[#765D96] hover:bg-[#E4DCF0] transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Click to view referenced source citations"
                            >
                              <span>Read document</span>
                            </button>
                          )}

                          {(msg.has_searched_workspace ||
                            (!msg.has_read_document && (!msg.sources || msg.sources.length === 0))) && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#ECE8F4] text-[#765D96] inline-flex items-center gap-1">
                              <span>Searched workspace</span>
                            </span>
                          )}
                        </div>

                        {/* Interactive Citations Expandable Drawer */}
                        {showSourcesForMsg === msg.id && msg.sources && msg.sources.length > 0 && (
                          <div className="mb-3 p-2.5 bg-white rounded-xl border border-border/80 space-y-2 animate-fade-in text-xs">
                            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                              Referenced Citations
                            </div>
                            {msg.sources.map((cit, cIdx) => (
                              <div
                                key={cIdx}
                                className="flex flex-col gap-0.5 p-1.5 rounded-lg bg-surface border border-border/60"
                              >
                                <div className="flex items-center gap-1 font-medium text-text-primary">
                                  <FileText className="w-3 h-3 text-accent" />
                                  <span className="truncate">{cit.filename}</span>
                                  {cit.page ? (
                                    <span className="text-[10px] text-text-muted">
                                      p.{cit.page}
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-[11px] text-text-secondary line-clamp-2">
                                  {cit.snippet}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Formatted Content */}
                        <div className="space-y-2 whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>

                      {/* Copy Message Action Button */}
                      <div className="flex items-center gap-1 mt-1.5 ml-1">
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                          title="Copy response"
                        >
                          {copiedMessageId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Mention Popup Autocomplete Menu (matching 03-assets.png) */}
      {showMentions && allFilteredMentions.length > 0 && (
        <div className="absolute bottom-16 left-3 right-3 bg-white rounded-2xl shadow-xl border border-border p-2 max-h-56 overflow-y-auto animate-fade-in text-xs z-50">
          {filteredDocs.length > 0 && (
            <div className="mb-2">
              <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                STUDIO DOCUMENTS
              </div>
              {filteredDocs.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleSelectMention(d)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#F3F4F6] text-text-primary text-left cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="truncate">{d.title}</span>
                </button>
              ))}
            </div>
          )}

          {filteredAssets.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                ASSETS
              </div>
              {filteredAssets.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleSelectMention(a)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#F3F4F6] text-text-primary text-left cursor-pointer transition-colors"
                >
                  <File className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="truncate">{a.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input Form at Bottom (matching User Images 1 & 2) */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border/80 bg-white shrink-0 relative">
        {/* Assets scope chip: single All-chip + count, expands to multi-select */}
        {mode === 'assets' && assetsScopeLabel ? (
          <div className="mb-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsScopeSelectorOpen((prev) => !prev)}
              title={isAllAssetsMode ? 'Querying all assets — click to narrow' : 'Click to adjust queried assets'}
              className="flex items-center gap-1.5 w-fit bg-[#ECE8F4] text-[#765D96] pl-2.5 pr-2 py-1 rounded-full text-xs font-medium hover:bg-[#E2D9EE] transition-colors cursor-pointer max-w-full"
            >
              {isAllAssetsMode ? (
                <Layers className="w-3 h-3 text-[#765D96] shrink-0" />
              ) : (
                <FileText className="w-3 h-3 text-[#765D96] shrink-0" />
              )}
              <span className="truncate max-w-55">{assetsScopeLabel}</span>
              <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${isScopeSelectorOpen ? 'rotate-180' : ''}`} />
            </button>
            {!isAllAssetsMode && (
              <button
                type="button"
                onClick={() => setAssetsScope(null)}
                className="text-[11px] text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                title="Reset to all assets"
              >
                Reset
              </button>
            )}
          </div>
        ) : null}
        {/* Legacy single-attachment chip (studio / universal / uncontrolled) */}
        {mode !== 'assets' && attachedScope ? (
          <div className="mb-2 flex items-center gap-1.5 w-fit bg-[#ECE8F4] text-[#765D96] px-2.5 py-1 rounded-full text-xs font-medium">
            <FileText className="w-3 h-3 text-[#765D96]" />
            <span className="truncate max-w-55">{attachedScope.title}</span>
            <button
              type="button"
              onClick={() => setAttachedScope(null)}
              className="hover:text-red-500 cursor-pointer ml-0.5"
              title="Remove attachment"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : null}

        {/* Assets scope selector popover (light-mode compliant) */}
        {mode === 'assets' && isScopeSelectorOpen && scopeCatalog.length > 0 ? (
          <div
            ref={scopeSelectorRef}
            className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-2xl shadow-xl border border-border p-2 max-h-64 overflow-y-auto z-50 animate-fade-in text-xs"
          >
            <button
              type="button"
              onClick={() => setAssetsScope(null)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left cursor-pointer transition-colors ${
                isAllAssetsMode
                  ? 'bg-accent-subtle text-accent-hover font-medium'
                  : 'hover:bg-[#F3F4F6] text-text-primary'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate flex-1">All {scopeCatalog.length} assets</span>
              {isAllAssetsMode && <Check className="w-3.5 h-3.5 shrink-0" />}
            </button>
            <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Narrow to specific PDFs
            </div>
            {scopeCatalog.map((s) => {
              const checked = isAllAssetsMode || narrowedAssets.some((n) => n.id === s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleScopeId(s.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#F3F4F6] text-text-primary text-left cursor-pointer transition-colors"
                >
                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-accent border-accent text-white' : 'border-border text-transparent'}`}>
                    <Check className="w-3 h-3" />
                  </span>
                  <FileText className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="truncate flex-1">{s.title}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F4F4F6] border border-transparent focus-within:border-border transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'studio'
                ? (attachedScope ? `Ask about ${attachedScope.title}...` : 'Ask about this document...')
                : mode === 'assets'
                ? (scopeCatalog.length === 0
                    ? 'Upload a PDF to get started...'
                    : (assetsScopeLabel ? `Ask across ${assetsScopeLabel}... or type @` : 'Ask across your assets... or type @'))
                : 'Ask Ora... or type @'
            }
            disabled={streaming}
            className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none"
          />

          {streaming ? (
            /* Stop Generating Button (matching Image 1) */
            <button
              type="button"
              onClick={stopGenerating}
              className="w-7 h-7 rounded-lg bg-[#83699e] hover:bg-[#775d91] text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Stop generating"
            >
              <Square className="w-3 h-3 fill-white text-white" />
            </button>
          ) : (
            /* Send Button (matching Image 2) */
            <button
              type="submit"
              disabled={!input.trim() || streaming}
              className="w-7 h-7 rounded-lg bg-[#83699e] hover:bg-[#775d91] text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              title="Send"
            >
              <ArrowUp className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </form>
      </div>
    </aside>
  );
}
