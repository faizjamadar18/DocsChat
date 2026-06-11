import { useState, useEffect, useRef } from 'react';

export default function ModelSwitcher({
  selectedModel,
  onChange
}: {
  selectedModel: string,
  onChange: (model: string) => void
}) {
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

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 text-sm text-white cursor-pointer"
      >
        <span className="hidden sm:inline">Model: </span><span>{current.name}</span>
        <span className="text-[10px]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-base border border-white/10 rounded-xl p-2 flex flex-col gap-1 min-w-[200px] z-10">
          {models.map(model => (
            <button
              key={model.id}
              onClick={() => {
                onChange(model.id);
                setIsOpen(false);
              }}
              className={`text-left px-3 py-2 rounded-lg cursor-pointer ${
                model.id === selectedModel
                  ? 'bg-white/10 text-white'
                  : 'text-white/80'
              }`}
            >
              {model.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
