'use client';
import { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import ChatMessageBubble from './ChatMessage';

const MODELS = [
  { id: 'gemini', name: 'Gemini 3.5 Flash' },
  { id: 'groq', name: 'Groq Llama 3 70B' },
];

export default function ChatPanel({
  user,
  onLogout,
  onToggleSidebar,
}: {
  user?: { username?: string } | null;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
}) {
  const { messages, loading, streaming, error, askQuestion, clearHistory } = useChat();
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowModelPicker(false);
      }
    };
    if (showModelPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModelPicker]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streaming]);

  const currentModelName = MODELS.find(m => m.id === selectedModel)?.name ?? 'Gemini 3.5 Flash';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || streaming) return;
    askQuestion(input, selectedModel);
    setInput('');
  };

  const handleClearChat = () => {
    if (messages.length === 0) return;
    if (window.confirm('Clear all chat history? This cannot be undone.')) {
      clearHistory();
    }
  };

  const isEmpty = !loading && messages.length === 0;

  const inputForm = (
    <div className="max-w-[720px] mx-auto w-full">
      {error && (
        <div className="mb-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="flex items-center bg-[#1e1e1f] border border-white/[0.06] focus-within:border-white/20 rounded-2xl transition-colors px-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={streaming}
            className="flex-1 bg-transparent text-white py-4 text-sm outline-none placeholder:text-white/25 min-w-0"
          />
          <div ref={pickerRef} className="relative shrink-0 ml-1">
            <button
              type="button"
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/60 transition-colors cursor-pointer whitespace-nowrap px-1.5 py-1 rounded-lg hover:bg-white/[0.06]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a4 4 0 0 1 4 4c0 2-2 3-2 3s2 1 2 3a4 4 0 0 1-8 0c0-2 2-3 2-3s-2-1-2-3a4 4 0 0 1 4-4z" />
                <path d="M12 14v8" />
                <path d="M9 18h6" />
              </svg>
              <span className="hidden sm:inline">{currentModelName}</span>
              <span className="sm:hidden">{selectedModel === 'gemini' ? 'Gemini' : 'Groq'}</span>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showModelPicker && (
              <div className="absolute bottom-full right-0 mb-2 bg-surface border border-white/[0.08] rounded-xl p-1.5 min-w-[180px] z-50 shadow-xl">
                {MODELS.map(model => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      setSelectedModel(model.id);
                      setShowModelPicker(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${model.id === selectedModel
                        ? 'bg-white/[0.08] text-white'
                        : 'text-white/60 hover:bg-white/[0.04] hover:text-white/80'
                      }`}
                  >
                    {model.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="w-px h-6 bg-white/[0.06] mx-1.5 shrink-0" />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${input.trim() && !streaming
                ? 'bg-white text-black cursor-pointer hover:bg-white/90'
                : 'bg-white/[0.04] text-white/20 cursor-not-allowed'
              }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 relative bg-black">
      {/* Blue spotlight glow behind the panel */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="w-[400px] h-[400px] bg-cyan-400/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/4" />
      </div>

      {/* Top row: hamburger (mobile) | user + actions — always visible */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0 relative z-10">
        <div className="flex items-center gap-2">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/60 transition-colors cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              disabled={streaming}
              title="New chat"
              className="text-xs text-white/40 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-30"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              New chat
            </button>
          )}
          <span className="hidden sm:inline text-xs text-white/30">{user?.username}</span>
          {onLogout && (
            <button
              onClick={onLogout}
              className="text-xs text-white/50 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          )}
        </div>
      </div>

      {isEmpty ? (
        /* Centered layout for empty state */
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-medium text-white mb-2">What can I help with?</h1>
            <p className="text-sm text-white/30 max-w-md">
              Upload PDFs to get started, then ask me anything about them.
            </p>
          </div>
          {inputForm}
        </div>
      ) : (
        <>
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 relative z-10">
            <div className="max-w-[720px] mx-auto py-4 min-h-full flex flex-col">
              {loading ? (
                <div className="flex justify-center pt-20">
                  <div className="w-5 h-5 border-2 border-white/[0.06] border-t-white/50 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {messages.map(msg => (
                    <ChatMessageBubble
                      key={msg.id}
                      message={msg}
                      currentModel={selectedModel}
                      onChangeModel={setSelectedModel}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Input area */}
          <div className="px-4 pb-4 pt-2 shrink-0 relative z-10">
            {inputForm}
          </div>
        </>
      )}
    </div>
  );
}
