import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../hooks/useChat';

export default function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex flex-col w-full mb-6 ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`max-w-[80%] text-white text-[15px] leading-relaxed ${isUser ? 'px-5 py-4 bg-base rounded-[24px_24px_4px_24px]' : ''}`}>
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div className="markdown-content">
            {message.content ? (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            ) : (
              <div className="flex gap-1 items-center h-6">
                <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both]"></span>
                <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both] [-webkit-animation-delay:-0.32s] [animation-delay:-0.32s]"></span>
                <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both] [-webkit-animation-delay:-0.16s] [animation-delay:-0.16s]"></span>
              </div>
            )}
          </div>
        )}
      </div>

      {!isUser && message.sources && message.sources.length > 0 && (
        <div className="mt-2.5 ml-3 flex flex-wrap gap-1.5 max-w-[80%]">
          {message.sources.map((source, index) => (
            <span
              key={`${source.source_id}-${source.page ?? index}`}
              title={source.snippet}
              className="text-xs px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-white/60"
            >
              {source.filename}{source.page ? ` · p.${source.page}` : ''}
            </span>
          ))}
        </div>
      )}

      {!isUser && message.model_used && (
        <div className="mt-2 text-xs text-white/60 ml-3">
          Answered by {message.model_used === 'groq' ? 'Groq Llama 3 70B' : 'Gemini 3.5 Flash'}
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .markdown-content p { margin-bottom: 1em; }
        .markdown-content p:last-child { margin-bottom: 0; }
        .markdown-content code { background: rgba(0,0,0,0.2); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 13px; }
        .markdown-content pre { background: #0f172a; padding: 12px; border-radius: 8px; overflow-x: auto; margin-bottom: 1em; }
        .markdown-content ul { margin-left: 20px; margin-bottom: 1em; }
        .markdown-content ol { margin-left: 20px; margin-bottom: 1em; }
      `}} />
    </div>
  );
}
