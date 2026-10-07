'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ArrowUp, Square, Trash2, Copy, Check, FileText, File } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../lib/api';

export function OraLogoMark({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        d="M6 3.5C4.62 3.5 3.5 4.62 3.5 6v7c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V6C8.5 4.62 7.38 3.5 6 3.5z"
        className="fill-current text-[#111827]"
      />
      <path
        d="M13.5 5C12.12 5 11 6.12 11 7.5v7c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5v-7c0-1.38-1.12-2.5-2.5-2.5z"
        className="fill-current text-[#111827]"
      />
    </svg>
  );
}

export interface MentionItem {
  id: string;
  title: string;
  type: 'document' | 'asset';
}

interface OraSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OraSidebar({ isOpen, onClose }: OraSidebarProps) {
  const { currentWorkspace } = useWorkspace();
  const {
    messages,
    loading,
    streaming,
    askQuestion,
    stopGenerating,
    clearHistory,
  } = useChat(currentWorkspace?.id);

  const [input, setInput] = useState('');
  const [attachedScope, setAttachedScope] = useState<MentionItem | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [docs, setDocs] = useState<MentionItem[]>([]);
  const [assets, setAssets] = useState<MentionItem[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showSourcesForMsg, setShowSourcesForMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setAttachedScope(item);
      const lastAtIndex = input.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        setInput(input.slice(0, lastAtIndex).trim());
      }
      setShowMentions(false);
      setMentionQuery('');
      inputRef.current?.focus();
    },
    [input]
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const queryToSend = input.trim();
    const scopeOptions = attachedScope
      ? {
          workspaceId: currentWorkspace?.id,
          scopeIds: [attachedScope.id],
          attachedName: attachedScope.title,
        }
      : {
          workspaceId: currentWorkspace?.id,
        };

    askQuestion(queryToSend, scopeOptions);
    setInput('');
    setAttachedScope(null);
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

  const handleClearHistory = async () => {
    if (confirm('Clear chat history for this workspace?')) {
      await clearHistory(currentWorkspace?.id);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="w-80 sm:w-96 shrink-0 h-full bg-white border-l border-border flex flex-col select-none relative z-20">
      {/* Top Header (matching 04-ora-assistant-sidebar.png and user reference) */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-border/80 shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <OraLogoMark className="w-4 h-4 text-text-primary" />
          <span className="text-sm font-semibold text-text-primary tracking-tight">Ora</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer"
            title="Clear chat history"
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

      {/* Main Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-xs text-text-muted">
            Loading chat...
          </div>
        ) : messages.length === 0 ? (
          /* Empty State (matching 04-ora-assistant-sidebar.png verbatim) */
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
                          <span className="truncate max-w-[200px]">
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
      <form onSubmit={handleSubmit} className="p-3 border-t border-border/80 bg-white shrink-0">
        {/* Attached Scope Chip above/inside Input */}
        {attachedScope && (
          <div className="mb-2 flex items-center gap-1.5 w-fit bg-[#ECE8F4] text-[#765D96] px-2.5 py-1 rounded-full text-xs font-medium">
            <FileText className="w-3 h-3 text-[#765D96]" />
            <span className="truncate max-w-[220px]">{attachedScope.title}</span>
            <button
              type="button"
              onClick={() => setAttachedScope(null)}
              className="hover:text-red-500 cursor-pointer ml-0.5"
              title="Remove attachment"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F4F4F6] border border-transparent focus-within:border-border transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Ora... or type @"
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
    </aside>
  );
}
