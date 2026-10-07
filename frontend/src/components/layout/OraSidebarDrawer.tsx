'use client';
import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowUp, FileText, File } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../lib/api';

export function OraLogoMark({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        d="M6 3.5C4.62 3.5 3.5 4.62 3.5 6v7c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V6C8.5 4.62 7.38 3.5 6 3.5z"
        className="fill-[#111827]"
      />
      <path
        d="M13.5 5C12.12 5 11 6.12 11 7.5v7c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5v-7c0-1.38-1.12-2.5-2.5-2.5z"
        className="fill-[#111827]"
      />
    </svg>
  );
}

interface MentionDoc {
  id: string;
  title: string;
}

interface MentionAsset {
  id: string;
  filename: string;
}

interface OraSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OraSidebarDrawer({
  isOpen,
  onClose,
}: OraSidebarDrawerProps) {
  const { currentWorkspace } = useWorkspace();
  const { messages, streaming, askQuestion } = useChat();
  const [input, setInput] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [docs, setDocs] = useState<MentionDoc[]>([]);
  const [assets, setAssets] = useState<MentionAsset[]>([]);
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

  // Fetch docs & assets for @ mention popup
  useEffect(() => {
    if (!currentWorkspace?.id || !isOpen) return;

    let active = true;
    async function loadMentions() {
      try {
        const [docsRes, assetsRes] = await Promise.all([
          api.get(`/documents?workspace_id=${currentWorkspace?.id}`).catch(() => ({ documents: [] })),
          api.get(`/sources?workspace_id=${currentWorkspace?.id}`).catch(() => ({ sources: [] })),
        ]);
        if (!active) return;
        setDocs(
          (docsRes.documents || []).map((d: { id: string; title: string }) => ({
            id: d.id,
            title: d.title,
          }))
        );
        setAssets(
          (assetsRes.sources || []).map((s: { id: string; filename: string }) => ({
            id: s.id,
            filename: s.filename,
          }))
        );
      } catch {
        // ignore
      }
    }
    void loadMentions();
    return () => {
      active = false;
    };
  }, [currentWorkspace?.id, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    // Show mention popup when typing @
    if (val.endsWith('@') || (val.includes('@') && !val.endsWith(' '))) {
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const handleSelectMention = (name: string) => {
    const lastAt = input.lastIndexOf('@');
    if (lastAt !== -1) {
      const updated = input.slice(0, lastAt) + `@${name} `;
      setInput(updated);
    } else {
      setInput((prev) => `${prev}@${name} `);
    }
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || streaming) return;
    askQuestion(input, 'groq');
    setInput('');
    setShowMentions(false);
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed top-14 bottom-0 right-0 z-40 w-80 sm:w-96 bg-white border-l border-border shadow-2xl flex flex-col animate-fade-in select-none">
      {/* Header (matching 04-ora-assistant-sidebar.png) */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-border/80 shrink-0">
        <div className="flex items-center gap-2">
          <OraLogoMark className="w-4 h-4 text-text-primary" />
          <span className="text-sm font-semibold text-text-primary">Ora</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer"
          title="Close Ora"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {messages.length === 0 ? (
          /* Empty State (matching 04-ora-assistant-sidebar.png verbatim) */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#F7F7F9] border border-border flex items-center justify-center mb-1">
              <OraLogoMark className="w-5 h-5 text-text-secondary" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">Ask Ora anything</h3>
            <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
              Type <span className="bg-[#F3F4F6] text-text-primary px-1.5 py-0.5 rounded border border-border font-mono text-[11px]">@</span> to reference a document or asset
            </p>
            <div className="pt-2">
              <span className="text-[11px] text-text-muted">
                Toggle with <kbd className="px-1.5 py-0.5 bg-[#F3F4F6] border border-border rounded font-mono text-[10px]">⌘.</kbd>
              </span>
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="space-y-4 flex-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-accent text-white rounded-br-xs'
                      : 'bg-[#F7F7F9] text-text-primary border border-border/80 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Citations pills if present */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.sources.map((cit, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#EFEAFC] text-accent border border-accent/20"
                        title={cit.snippet}
                      >
                        <FileText className="w-2.5 h-2.5" />
                        <span className="truncate max-w-[140px]">{cit.filename}</span>
                        {cit.page ? ` p.${cit.page}` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Mention Popup Menu (matching 03-assets.png) */}
      {showMentions && (
        <div className="mx-4 mb-2 bg-white rounded-xl shadow-xl border border-border p-1.5 max-h-56 overflow-y-auto animate-fade-in text-xs z-50">
          {docs.length > 0 && (
            <div className="mb-2">
              <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                STUDIO DOCUMENTS
              </div>
              {docs.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleSelectMention(d.title)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#F3F4F6] text-text-primary text-left cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-text-muted" />
                  <span className="truncate">{d.title}</span>
                </button>
              ))}
            </div>
          )}

          {assets.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                ASSETS
              </div>
              {assets.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleSelectMention(a.filename)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#F3F4F6] text-text-primary text-left cursor-pointer transition-colors"
                >
                  <File className="w-3.5 h-3.5 text-text-muted" />
                  <span className="truncate">{a.filename}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input Bar at Bottom (matching 04-ora-assistant-sidebar.png) */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border/80 bg-white">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F7F7F9] border border-border focus-within:border-accent/40 focus-within:bg-white transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask Ora... or type @"
            disabled={streaming}
            className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            className="w-7 h-7 rounded-full bg-[#EFEAFC] hover:bg-accent text-[#6E56CF] hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            title="Send"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </aside>
  );
}
