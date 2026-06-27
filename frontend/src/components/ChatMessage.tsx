import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../hooks/useChat';

const MODELS = [
  { id: 'gemini', name: 'Gemini 3.5 Flash' },
  { id: 'groq', name: 'Groq Llama 3 70B' },
];

export default function ChatMessageBubble({
  message,
  currentModel,
  onChangeModel,
}: {
  message: ChatMessage;
  currentModel: string;
  onChangeModel: (model: string) => void;
}) {
  const isUser = message.role === 'user';
  const [showModelPicker, setShowModelPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      {!isUser && (
        <div className="flex items-center gap-2 mb-2">

          <div ref={pickerRef} className="relative">
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="text-xs text-white/40 hover:text-white/60 font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{message.model_used === 'groq' ? 'Groq Llama' : 'Gemini'}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showModelPicker && (
              <div className="absolute top-full left-0 mt-1.5 bg-surface border border-white/[0.08] rounded-xl p-1.5 min-w-[180px] z-50 shadow-xl">
                {MODELS.map(model => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onChangeModel(model.id);
                      setShowModelPicker(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${model.id === currentModel
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
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? '' : 'w-full'}`}>
        {isUser ? (
          <div className="text-sm sm:text-[15px] text-white leading-relaxed">
            {message.content}
          </div>
        ) : (
          <div className="bg-card rounded-2xl px-5 py-4 border border-white/[0.06]">
            <div className="markdown-content text-sm sm:text-[15px] text-white/90 leading-relaxed">
              {message.content ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                <div className="flex gap-1 items-center h-5">
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>

            {message.sources && message.sources.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap gap-1.5">
                {message.sources.map((source, index) => (
                  <span
                    key={`${source.source_id}-${source.page ?? index}`}
                    title={source.snippet}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/40"
                  >
                    {source.filename}{source.page ? ` · p.${source.page}` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .markdown-content p { margin-bottom: 0.75em; }
        .markdown-content p:last-child { margin-bottom: 0; }
        .markdown-content code { background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; }
        .markdown-content pre { background: #0a0a0b; padding: 14px; border-radius: 10px; overflow-x: auto; margin-bottom: 0.75em; border: 1px solid rgba(255,255,255,0.06); }
        .markdown-content ul { margin-left: 20px; margin-bottom: 0.75em; }
        .markdown-content ol { margin-left: 20px; margin-bottom: 0.75em; }
      `}} />
    </div>
  );
}
