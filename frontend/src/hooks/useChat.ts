import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { auth } from '../lib/auth';
import { API_BASE_URL } from '../lib/config';

export interface Citation {
  source_id: string;
  filename: string;
  page?: number;
  snippet: string;
  similarity_score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model_used?: string;
  sources?: Citation[];
  created_at?: string;
}

function parseSseLine(line: string): Record<string, unknown> | null {
  if (!line.startsWith('data: ')) return null;
  try {
    return JSON.parse(line.slice(6));
  } catch {
    return null;
  }
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/chat/history');
      setMessages(data.messages || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load chat history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const clearHistory = async () => {
    try {
      await api.delete('/chat/clear');
      setMessages([]);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to clear chat');
    }
  };

  const askQuestion = async (query: string, model: string) => {
    if (!query.trim() || streaming) return;

    setError(null);
    setStreaming(true);

    const tempUserId = `temp_user_${Date.now()}`;
    const tempAssistantId = `temp_assistant_${Date.now()}`;
    
    setMessages(prev => [
      ...prev, 
      { id: tempUserId, role: 'user', content: query },
      { id: tempAssistantId, role: 'assistant', content: '', model_used: model }
    ]);

    try {
      const token = auth.getToken();
      
      const response = await fetch(`${API_BASE_URL}/chat/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query, model })
      });

      if (!response.ok) {
        throw new Error('Failed to ask question');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let citations: Citation[] = [];
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        
        for (const part of parts) {
          const line = part.trim();
          if (!line) continue;

          const data = parseSseLine(line);
          if (!data) continue;

          if (data.error) {
            setError(String(data.error));
            break;
          }
          if (data.done) {
            if (Array.isArray(data.sources)) {
              citations = data.sources as Citation[];
            }
          }
          if (data.token) {
            assistantContent += String(data.token);
            setMessages(prev => prev.map(msg => 
              msg.id === tempAssistantId
                ? { ...msg, content: assistantContent, sources: citations.length ? citations : msg.sources }
                : msg
            ));
          }
        }
      }

      if (citations.length) {
        setMessages(prev => prev.map(msg =>
          msg.id === tempAssistantId ? { ...msg, sources: citations } : msg
        ));
      }
      
      await fetchHistory();

    } catch (err: any) {
      setError(err.message || 'Error communicating with server');
      setMessages(prev => prev.filter(msg => !(msg.id === tempAssistantId && msg.content === '')));
    } finally {
      setStreaming(false);
    }
  };

  return {
    messages,
    loading,
    streaming,
    error,
    askQuestion,
    clearHistory
  };
}
