'use client';
import { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import ChatMessageBubble from './ChatMessage';
import ModelSwitcher from './ModelSwitcher';

export default function ChatPanel() {
  const { messages, loading, streaming, error, askQuestion, clearHistory } = useChat();
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streaming]);

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

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 shrink-0">
        <h1 className="text-lg sm:text-xl font-semibold text-white">Chat</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              disabled={streaming}
              title="Clear chat"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/5 disabled:opacity-30 cursor-pointer transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          )}
          <ModelSwitcher selectedModel={selectedModel} onChange={setSelectedModel} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col min-h-0">
        {loading ? (
          <div className="m-auto">
            <div className="w-5 h-5 border-3 border-white/10 border-l-white rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="m-auto text-center max-w-[500px]">
            <div className="text-5xl mb-6">👋</div>
            <h2 className="text-[28px] font-semibold mb-4 text-white">Let's start your notebook...</h2>
            <p className="text-white/60 text-base leading-relaxed">
              This is your blank canvas to understand, create, or make progress on something new.
              Upload some PDFs in the sidebar, then ask me questions about them!
            </p>
          </div>
        ) : (
          <div className="max-w-[800px] w-full mx-auto">
            {messages.map(msg => (
              <ChatMessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6 shrink-0">
        {error && (
          <div className="max-w-[800px] mx-auto mb-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="max-w-[800px] mx-auto relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or create something"
            disabled={streaming}
            className="w-full bg-white/5 border border-white/10 text-white px-6 pr-[56px] py-4 rounded-full text-base outline-none focus:outline-none placeholder:text-white/30"
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            className={`absolute right-2 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 cursor-pointer ${input.trim() && !streaming
                ? 'bg-white text-base'
                : 'bg-white/10 text-white/50'
              }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
