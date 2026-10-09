'use client';
import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowUp,
  Square,
  Paperclip,
  Mic,
  AudioWaveform,
  Languages,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import Markdown from '@/components/Markdown';
import SourceFooter, { FilenameIcon } from '@/components/chat/SourceFooter';
import { StudioDocIcon, PdfIcon } from '@/components/connectors/ConnectorIcons';
import { useChat } from '@/hooks/useChat';
import { api } from '@/lib/api';

interface MentionItem {
  id: string;
  title: string;
  type: 'document' | 'asset';
}

function PlaygroundContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadId = searchParams.get('thread_id') || undefined;

  const { currentWorkspace } = useWorkspace();

  const {
    messages,
    streaming,
    activeThreadInfo,
    askQuestion,
    stopGenerating,
    switchThread,
  } = useChat(currentWorkspace?.id, threadId, 'universal');

  const [input, setInput] = useState('');
  const [attachedScope, setAttachedScope] = useState<MentionItem | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [docs, setDocs] = useState<MentionItem[]>([]);
  const [assets, setAssets] = useState<MentionItem[]>([]);

  const STARTER_SUGGESTIONS = [
    {
      label: 'Count my files',
      prompt: 'How many documents and how many assets are in my workspace?',
    },
    {
      label: 'Key takeaways',
      prompt: 'What are the key takeaways across my workspace sources?',
    },
    {
      label: 'Compare sources',
      prompt: 'Compare the main viewpoints across my sources and note where they disagree.',
    },
  ];

  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showSourcesForMsg, setShowSourcesForMsg] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Time-based greeting (matching reference image "Good morning, Work")
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const workspaceTitle = currentWorkspace?.name || 'Work';

  // Fetch workspace documents and assets for @ mention scope
  useEffect(() => {
    if (!currentWorkspace?.id) return;
    let active = true;

    async function loadWorkspaceSources() {
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
        // ignore errors
      }
    }

    void loadWorkspaceSources();
    return () => {
      active = false;
    };
  }, [currentWorkspace?.id]);

  // Enforce Workspace Chat isolation: if the URL thread belongs to
  // assets/studio, bounce back to a fresh universal chat.
  useEffect(() => {
    if (threadId && activeThreadInfo && activeThreadInfo.mode && activeThreadInfo.mode !== 'universal') {
      router.replace('/playground');
    }
  }, [threadId, activeThreadInfo, router]);

  // New Chat resets: the URL lost its thread_id (header/Sidebar "New Chat"),
  // but useChat still holds the previous thread — clear it so the old
  // conversation can't linger and the next question can't join the old thread.
  const prevThreadIdRef = useRef<string | undefined>(threadId);
  useEffect(() => {
    if (!threadId && prevThreadIdRef.current) {
      switchThread(null);
    }
    prevThreadIdRef.current = threadId;
  }, [threadId, switchThread]);

  // Listen to thread creation event to update URL query param
  useEffect(() => {
    const handleThreadSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ thread_id?: string; mode?: string }>;
      // Only adopt new threads that belong to the universal pipeline.
      if (customEvent.detail?.mode && customEvent.detail.mode !== 'universal') return;
      if (customEvent.detail?.thread_id && !threadId) {
        router.replace(`/playground?thread_id=${customEvent.detail.thread_id}`, {
          scroll: false,
        });
      }
    };
    window.addEventListener('chat-threads-updated', handleThreadSync);
    return () => {
      window.removeEventListener('chat-threads-updated', handleThreadSync);
    };
  }, [threadId, router]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  };

  const filteredDocs = docs.filter((d) =>
    d.title.toLowerCase().includes(mentionQuery.toLowerCase())
  );
  const filteredAssets = assets.filter((a) =>
    a.title.toLowerCase().includes(mentionQuery.toLowerCase())
  );
  const allFilteredMentions = [...filteredDocs, ...filteredAssets];

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    adjustTextareaHeight();

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
      setAttachedScope(item);
      const lastAtIndex = input.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        setInput(input.slice(0, lastAtIndex).trim());
      }
      setShowMentions(false);
      setMentionQuery('');
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    },
    [input]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && allFilteredMentions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allFilteredMentions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? allFilteredMentions.length - 1 : prev - 1
        );
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const selected = allFilteredMentions[selectedIndex];
        if (selected) {
          handleSelectMention(selected);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!input.trim() || streaming) return;

    const queryToSend = input.trim();
    const scopeOptions = attachedScope
      ? {
          workspaceId: currentWorkspace?.id,
          threadId: threadId,
          mode: 'universal' as const,
          scopeIds: [attachedScope.id],
          attachedName: attachedScope.title,
        }
      : {
          workspaceId: currentWorkspace?.id,
          threadId: threadId,
          mode: 'universal' as const,
        };

    askQuestion(queryToSend, scopeOptions);
    setInput('');
    setAttachedScope(null);
    setShowMentions(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Starter suggestion chips fill the input for review — the user sends manually.
  const handlePreset = (prompt: string) => {
    if (streaming) return;
    setInput(prompt);
    setShowMentions(false);
    requestAnimationFrame(() => {
      adjustTextareaHeight();
      textareaRef.current?.focus();
    });
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

  const isConversationActive = messages.length > 0;

  return (
    <div className="flex flex-col h-full w-full select-none overflow-hidden bg-surface relative">
      {/* Main Content: Hero State vs Conversation Stream.
          Hero scrolls internally; stream splits into scroll region (messages)
          + fixed footer (input) so the input never drifts with chat length. */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {!isConversationActive ? (
          /* ============================================================ */
          /* HERO STATE (Exact layout as User Reference Image)             */
          /* ============================================================ */
          <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="min-h-full flex flex-col items-center justify-center px-4 py-12 max-w-2xl mx-auto w-full animate-fade-in">
            {/* Greeting Title */}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary text-center">
              {getGreeting()}, {workspaceTitle}
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-text-secondary text-center mt-2 font-normal">
              Ask across everything in your workspace, or type @ to reference a file.
            </p>

            {/* Central Large Prompt Input Card */}
            <div className="w-full mt-8 bg-white border border-border rounded-3xl p-4 relative transition-all shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_12px_-4px_rgba(16,24,40,0.06),0_16px_40px_-20px_rgba(16,24,40,0.16)] focus-within:ring-2 focus-within:ring-text-primary/10 focus-within:border-text-primary/40 text-text-primary scheme-light">
              {/* Attached Scoped Document Tag */}
              {attachedScope && (
                <div className="mb-2.5 flex items-center gap-1.5 w-fit bg-[#ECE8F4] text-[#765D96] px-3 py-1 rounded-full text-xs font-medium animate-fade-in">
                  <StudioDocIcon className="w-3.5 h-3.5" />
                  <span className="truncate max-w-xs">{attachedScope.title}</span>
                  <button
                    type="button"
                    onClick={() => setAttachedScope(null)}
                    className="hover:text-black cursor-pointer ml-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask Ora anything across your workspace..."
                rows={2}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
                className="w-full bg-transparent text-sm sm:text-base text-text-primary [-webkit-text-fill-color:#111827] placeholder:text-text-muted placeholder:[-webkit-text-fill-color:#9CA3AF] resize-none focus:outline-none leading-relaxed"
              />

              {/* Toolbar Row */}
              <div className="flex items-center justify-between pt-2 mt-1">
                {/* Left tools: Paperclip, Waveform, Translate */}
                <div className="flex items-center gap-1">
                  {/* Paperclip */}
                  <button
                    type="button"
                    onClick={() => setShowMentions((prev) => !prev)}
                    title="Reference specific workspace document (@)"
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Audio Waveform */}
                  <div className="relative group">
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                    >
                      <AudioWaveform className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-text-primary text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap shadow-md z-30">
                      Soon
                    </div>
                  </div>

                  {/* Translate */}
                  <div className="relative group">
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                    >
                      <Languages className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-text-primary text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap shadow-md z-30">
                      Soon
                    </div>
                  </div>
                </div>

                {/* Right tools: Microphone, Submit */}
                <div className="flex items-center gap-2">
                  {/* Microphone */}
                  <div className="relative group">
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-text-primary text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap shadow-md z-30">
                      Soon
                    </div>
                  </div>

                  {/* Submit / Stop Button */}
                  {streaming ? (
                    <button
                      type="button"
                      onClick={stopGenerating}
                      className="w-8 h-8 rounded-full bg-text-primary text-white hover:bg-black flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-xs"
                      title="Stop generating"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!input.trim()}
                      className="w-8 h-8 rounded-full bg-text-primary text-white hover:bg-black disabled:opacity-25 disabled:hover:scale-100 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer disabled:cursor-not-allowed shadow-xs"
                      title="Send message"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Mention Autocomplete Dropdown */}
              {showMentions && allFilteredMentions.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-xl border border-border p-2 max-h-56 overflow-y-auto z-40 animate-fade-in text-xs">
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
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                            allFilteredMentions[selectedIndex]?.id === d.id
                              ? 'bg-accent-subtle text-accent-hover font-medium'
                              : 'hover:bg-[#F3F4F6] text-text-primary'
                          }`}
                        >
                          <StudioDocIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{d.title}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {filteredAssets.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                        UPLOADED ASSETS
                      </div>
                      {filteredAssets.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => handleSelectMention(a)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                            allFilteredMentions[selectedIndex]?.id === a.id
                              ? 'bg-accent-subtle text-accent-hover font-medium'
                              : 'hover:bg-[#F3F4F6] text-text-primary'
                          }`}
                        >
                          <PdfIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{a.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Starter suggestions — Claude/ChatGPT pattern: one click fills the input, user sends */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6 max-w-xl">
              {STARTER_SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => handlePreset(s.prompt)}
                  disabled={streaming}
                  className="px-3.5 py-1.5 rounded-full border border-border bg-white text-xs text-text-secondary hover:text-text-primary hover:border-accent/40 hover:shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Footer Action Links matching reference image */}
            <div className="flex items-center gap-4 mt-8 text-xs text-text-muted font-normal">
              <Link
                href="/settings"
                className="hover:text-text-primary transition-colors underline-offset-4 hover:underline"
              >
                Add Groq key
              </Link>
              <span>•</span>
              <Link
                href="/assets"
                className="hover:text-text-primary transition-colors underline-offset-4 hover:underline"
              >
                Manage sources
              </Link>
            </div>
          </div>
          </div>
        ) : (
          /* ============================================================ */
          /* ACTIVE CONVERSATION: scroll region + fixed input footer       */
          /* ============================================================ */
          <>
          <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-3xl w-full mx-auto px-4 py-6 animate-fade-in">
            {/* Messages Stream */}
            <div className="space-y-6 pb-4">
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const isLast = index === messages.length - 1;
                const isThinking = !isUser && isLast && streaming && !msg.content;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    {isUser ? (
                      /* User Message Bubble */
                      <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-[#83699e] text-white shadow-xs">
                        {(msg.attached_name || (msg.scope_ids && msg.scope_ids.length > 0)) && (
                          <div className="bg-white/20 text-white text-[11px] font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 mb-2 w-fit">
                            <StudioDocIcon className="w-3 h-3" />
                            <span className="truncate max-w-xs">
                              {msg.attached_name || 'Referenced Document'}
                            </span>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-normal">
                          {msg.content}
                        </p>
                      </div>
                    ) : isThinking ? (
                      /* Thinking state */
                      <div className="pt-2 pb-2">
                        <span className="text-sm text-text-muted font-normal animate-pulse">
                          Thinking across workspace sources...
                        </span>
                      </div>
                    ) : (
                      /* Assistant Message Card */
                      <div className="max-w-[92%] w-full flex flex-col group">
                        <div className="rounded-2xl p-5 bg-[#F4F4F6] text-text-primary text-sm leading-relaxed border border-border/40">
                          {/* Formatted Assistant Output */}
                          <Markdown content={msg.content} />

                          {/* Sources footer: N sources used + official icons + arrow */}
                          {msg.sources && msg.sources.length > 0 && (
                            <SourceFooter
                              sources={msg.sources}
                              expanded={showSourcesForMsg === msg.id}
                              onToggle={() =>
                                setShowSourcesForMsg((prev) =>
                                  prev === msg.id ? null : msg.id
                                )
                              }
                            />
                          )}

                          {/* Expandable Sources Drawer — names only, opens below the footer button */}
                          {showSourcesForMsg === msg.id &&
                            msg.sources &&
                            msg.sources.length > 0 && (
                              <div className="mt-2 p-3 bg-white rounded-xl border border-border/80 space-y-1.5 animate-fade-in text-xs">
                                <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                                  Referenced sources
                                </div>
                                {msg.sources.map((cit, cIdx) => (
                                  <div
                                    key={`${cit.source_id}-${cIdx}`}
                                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-surface border border-border/60"
                                  >
                                    <FilenameIcon filename={cit.filename} />
                                    <span className="truncate font-medium text-text-primary">
                                      {cit.filename}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>

                        {/* Actions row: Copy */}
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
          </div>
          </div>

            {/* Fixed Bottom Input Footer in Conversation Mode (sibling of scroll region) */}
            <div className="shrink-0 border-t border-border/60 bg-surface px-4 pt-2 pb-4">
              <div className="max-w-3xl w-full mx-auto">
              <div className="bg-white border border-border rounded-2xl p-3 relative transition-all shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_12px_-4px_rgba(16,24,40,0.06),0_16px_40px_-20px_rgba(16,24,40,0.16)] focus-within:ring-2 focus-within:ring-text-primary/10 focus-within:border-text-primary/40 text-text-primary scheme-light">
                {attachedScope && (
                  <div className="mb-2 flex items-center gap-1.5 w-fit bg-[#ECE8F4] text-[#765D96] px-2.5 py-0.5 rounded-full text-xs font-medium animate-fade-in">
                    <StudioDocIcon className="w-3 h-3" />
                    <span className="truncate max-w-xs">{attachedScope.title}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedScope(null)}
                      className="hover:text-black cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a follow-up across workspace..."
                  rows={1}
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="off"
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                  className="w-full bg-transparent text-sm text-text-primary [-webkit-text-fill-color:#111827] placeholder:text-text-muted placeholder:[-webkit-text-fill-color:#9CA3AF] resize-none focus:outline-none leading-relaxed"
                />

                <div className="flex items-center justify-between pt-2 mt-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowMentions((prev) => !prev)}
                      title="Reference specific workspace document (@)"
                      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {streaming ? (
                      <button
                        type="button"
                        onClick={stopGenerating}
                        className="w-7 h-7 rounded-full bg-text-primary text-white hover:bg-black flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-xs"
                        title="Stop generating"
                      >
                        <Square className="w-3 h-3 fill-current" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!input.trim()}
                        className="w-7 h-7 rounded-full bg-text-primary text-white hover:bg-black disabled:opacity-25 disabled:hover:scale-100 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer disabled:cursor-not-allowed shadow-xs"
                        title="Send message"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Mention Autocomplete Dropdown in Conversation View */}
                {showMentions && allFilteredMentions.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-xl border border-border p-2 max-h-56 overflow-y-auto z-40 animate-fade-in text-xs">
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
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                              allFilteredMentions[selectedIndex]?.id === d.id
                                ? 'bg-accent-subtle text-accent-hover font-medium'
                                : 'hover:bg-[#F3F4F6] text-text-primary'
                            }`}
                          >
                            <StudioDocIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{d.title}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {filteredAssets.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                          UPLOADED ASSETS
                        </div>
                        {filteredAssets.map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => handleSelectMention(a)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                              allFilteredMentions[selectedIndex]?.id === a.id
                                ? 'bg-accent-subtle text-accent-hover font-medium'
                                : 'hover:bg-[#F3F4F6] text-text-primary'
                            }`}
                          >
                            <PdfIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{a.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
        </div>
      }
    >
      <PlaygroundContent />
    </Suspense>
  );
}
