import { useState, useEffect, useRef } from 'react';
import { useConfirm } from '@/context/ConfirmContext';

export default function ModelSwitcher({
  selectedModel,
  onChange,
  onNewChat,
  hasMessages,
  streaming
}: {
  selectedModel: string,
  onChange: (model: string) => void,
  onNewChat?: () => void,
  hasMessages?: boolean,
  streaming?: boolean
}) {
  const { confirm } = useConfirm();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const models = [
    { id: 'gemini', name: 'Gemini 3.5 Flash' },
    { id: 'groq', name: 'Groq Llama 3 70B' }
  ];

  const current = models.find(m => m.id === selectedModel) || models[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNewChat = async () => {
    if (onNewChat && hasMessages && !streaming) {
      const ok = await confirm({
        title: 'Clear Chat History',
        description: 'Clear all chat history? This cannot be undone.',
        confirmLabel: 'Clear All',
        variant: 'danger',
      });
      if (ok) {
        onNewChat();
      }
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors cursor-pointer py-1"
      >
        <span>{current.name}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-surface border border-white/8 rounded-xl p-1.5 min-w-47.5 z-50 shadow-xl">
          <div className="text-[11px] text-white/30 font-medium px-3 py-1.5 uppercase tracking-wider">Models</div>
          {models.map(model => (
            <button
              key={model.id}
              onClick={() => {
                onChange(model.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                model.id === selectedModel
                  ? 'bg-white/8 text-white'
                  : 'text-white/60 hover:bg-white/4 hover:text-white/80'
              }`}
            >
              {model.name}
            </button>
          ))}
          {hasMessages && (
            <>
              <div className="border-t border-white/6 my-1" />
              <button
                onClick={handleNewChat}
                disabled={streaming}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/4 hover:text-white/80 transition-colors cursor-pointer disabled:opacity-30"
              >
                New chat
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
