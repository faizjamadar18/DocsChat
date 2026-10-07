import { useState, useEffect, useCallback, useRef } from 'react';
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
  scope_ids?: string[];
  attached_name?: string;
  has_read_document?: boolean;
  has_searched_workspace?: boolean;
  created_at?: string;
}

export interface AskQuestionOptions {
  workspaceId?: string;
  scopeIds?: string[];
  attachedName?: string;
  threadId?: string;
  requireScope?: boolean;
}

function parseSseLine(line: string): Record<string, unknown> | null {
  if (!line.startsWith('data: ')) return null;
  try {
    return JSON.parse(line.slice(6));
  } catch {
    return null;
  }
}

export function useChat(activeWorkspaceId?: string, activeThreadId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdThreadId, setCreatedThreadId] = useState<string | null>(null);
  const currentThreadId = activeThreadId || createdThreadId;
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchHistory = useCallback(async (wsId?: string, tId?: string) => {
    const targetWs = wsId || activeWorkspaceId;
    const targetThread = tId !== undefined ? tId : activeThreadId;

    if (targetThread === '') {
      // Empty string means a fresh new thread
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let data;
      if (targetThread) {
        data = await api.get(`/chat/threads/${targetThread}/messages`);
      } else {
        const endpoint = targetWs ? `/chat/history?workspace_id=${targetWs}` : '/chat/history';
        data = await api.get(endpoint, {
          headers: targetWs ? { 'X-Workspace-Id': targetWs } : {},
        });
      }
      setMessages(data.messages || []);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load chat history';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId, activeThreadId]);

  useEffect(() => {
    void fetchHistory(activeWorkspaceId, activeThreadId);
  }, [fetchHistory, activeWorkspaceId, activeThreadId]);

  const clearHistory = async (wsId?: string, tId?: string) => {
    const targetWs = wsId || activeWorkspaceId;
    const targetThread = tId !== undefined ? tId : currentThreadId;
    try {
      let endpoint = '/chat/clear';
      if (targetThread) {
        endpoint += `?thread_id=${targetThread}`;
      } else if (targetWs) {
        endpoint += `?workspace_id=${targetWs}`;
      }
      await api.delete(endpoint, {
        headers: targetWs ? { 'X-Workspace-Id': targetWs } : {},
      });
      setMessages([]);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to clear chat';
      setError(msg);
    }
  };

  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreaming(false);
  };

  const askQuestion = async (
    query: string,
    options?: AskQuestionOptions | string
  ) => {
    if (!query.trim() || streaming) return;

    setError(null);
    setStreaming(true);

    const parsedOptions: AskQuestionOptions =
      typeof options === 'string' ? {} : options || {};

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const tempUserId = `temp_user_${Date.now()}`;
    const tempAssistantId = `temp_assistant_${Date.now()}`;
    const targetWs = parsedOptions.workspaceId || activeWorkspaceId;

    setMessages((prev) => [
      ...prev,
      {
        id: tempUserId,
        role: 'user',
        content: query,
        scope_ids: parsedOptions.scopeIds,
        attached_name: parsedOptions.attachedName,
      },
      {
        id: tempAssistantId,
        role: 'assistant',
        content: '',
        model_used: 'groq',
        has_read_document: Boolean(parsedOptions.scopeIds && parsedOptions.scopeIds.length > 0),
        has_searched_workspace: !parsedOptions.scopeIds || parsedOptions.scopeIds.length === 0,
      },
    ]);

    try {
      const token = auth.getToken();

      const response = await fetch(`${API_BASE_URL}/chat/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(targetWs ? { 'X-Workspace-Id': targetWs } : {}),
        },
        body: JSON.stringify({
          query,
          model: 'groq',
          workspace_id: targetWs,
          thread_id: parsedOptions.threadId || currentThreadId || undefined,
          scope_ids: parsedOptions.scopeIds,
          attached_name: parsedOptions.attachedName,
          require_scope: parsedOptions.requireScope,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to ask question');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let citations: Citation[] = [];
      let hasReadDoc = Boolean(parsedOptions.scopeIds && parsedOptions.scopeIds.length > 0);
      let hasSearchedWs = !parsedOptions.scopeIds || parsedOptions.scopeIds.length === 0;
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

          if (data.type === 'thread_info' && data.thread_id) {
            const newTid = String(data.thread_id);
            setCreatedThreadId(newTid);
            window.dispatchEvent(
              new CustomEvent('chat-threads-updated', { detail: data })
            );
            continue;
          }

          if (data.error) {
            const errStr = String(data.error);
            setError(errStr);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempAssistantId
                  ? { ...msg, content: `Error: ${errStr}` }
                  : msg
              )
            );
            break;
          }
          if (data.done) {
            if (Array.isArray(data.sources)) {
              citations = data.sources as Citation[];
            }
            if (typeof data.has_read_document === 'boolean') {
              hasReadDoc = data.has_read_document;
            }
            if (typeof data.has_searched_workspace === 'boolean') {
              hasSearchedWs = data.has_searched_workspace;
            }
          }
          if (data.token) {
            assistantContent += String(data.token);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempAssistantId
                  ? {
                      ...msg,
                      content: assistantContent,
                      sources: citations.length ? citations : msg.sources,
                      has_read_document: hasReadDoc,
                      has_searched_workspace: hasSearchedWs,
                    }
                  : msg
              )
            );
          }
        }
      }

      if (citations.length || hasReadDoc || hasSearchedWs) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempAssistantId
              ? {
                  ...msg,
                  sources: citations,
                  has_read_document: hasReadDoc,
                  has_searched_workspace: hasSearchedWs,
                }
              : msg
          )
        );
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        // User aborted manually via stop button
        return;
      }
      const msg = err instanceof Error ? err.message : 'Error communicating with server';
      setError(msg);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempAssistantId && !m.content
            ? { ...m, content: `Error: ${msg}` }
            : m
        )
      );
    } finally {
      abortControllerRef.current = null;
      setStreaming(false);
    }
  };

  return {
    messages,
    setMessages,
    loading,
    streaming,
    error,
    currentThreadId,
    setCreatedThreadId,
    askQuestion,
    stopGenerating,
    clearHistory,
    fetchHistory,
  };
}
