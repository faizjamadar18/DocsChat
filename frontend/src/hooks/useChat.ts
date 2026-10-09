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
  mode?: 'universal' | 'assets' | 'studio';
}

function parseSseLine(line: string): Record<string, unknown> | null {
  if (!line.startsWith('data: ')) return null;
  try {
    return JSON.parse(line.slice(6));
  } catch {
    return null;
  }
}

export interface ChatThreadInfo {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  mode?: 'universal' | 'assets' | 'studio';
  attached_scope?: {
    id: string;
    title: string;
    type?: 'asset' | 'document';
  };
  created_at?: string;
  updated_at?: string;
}

export function useChat(
  activeWorkspaceId?: string,
  activeThreadId?: string,
  initialMode: 'universal' | 'assets' | 'studio' = 'universal'
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdThreadId, setCreatedThreadId] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(activeThreadId || null);
  const [activeThreadInfo, setActiveThreadInfo] = useState<ChatThreadInfo | null>(null);
  const currentThreadId = activeThreadId !== undefined ? activeThreadId : (selectedThreadId || createdThreadId);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchHistory = useCallback(async (_wsId?: string, tId?: string) => {
    // Never clobber an actively streaming conversation with a refetch —
    // e.g. the URL thread sync that fires mid-stream after thread creation.
    // The streamed temp messages are the source of truth until done.
    if (abortControllerRef.current) return;
    const targetThread = tId !== undefined ? tId : activeThreadId;

    if (!targetThread) {
      // No thread selected means a fresh new chat per mode.
      // Never fall back to workspace-wide history here: that would leak
      // universal / assets / studio conversations into each other.
      setMessages([]);
      setActiveThreadInfo(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      const data = await api.get(`/chat/threads/${targetThread}/messages`);
      const loadedMessages = data.messages || [];
      const threadInfo = (data.thread || null) as ChatThreadInfo | null;
      // Enforce conversation isolation: never render a thread belonging to
      // a different mode inside this pipeline.
      if (threadInfo?.mode && threadInfo.mode !== initialMode) {
        setMessages([]);
        setActiveThreadInfo(null);
        setError(`This conversation belongs to ${threadInfo.mode} chat and is not available here.`);
      } else {
        setMessages(loadedMessages);
        setActiveThreadInfo(threadInfo);
        setError(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load chat history';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [activeThreadId, initialMode]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Never clobber an actively streaming conversation with a refetch —
      // e.g. the URL thread sync that fires mid-stream after thread creation.
      // The streamed temp messages are the source of truth until done.
      if (abortControllerRef.current) return;
      const targetThread = activeThreadId;

      if (!targetThread) {
        // No thread selected means a fresh new chat per mode.
        // Never fall back to workspace-wide history here: that would leak
        // universal / assets / studio conversations into each other.
        await Promise.resolve();
        if (cancelled) return;
        setMessages([]);
        setActiveThreadInfo(null);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        await Promise.resolve();
        if (cancelled) return;
        setLoading(true);
        const data = await api.get(`/chat/threads/${targetThread}/messages`);
        if (cancelled) return;
        const loadedMessages = data.messages || [];
        const threadInfo = (data.thread || null) as ChatThreadInfo | null;
        // Enforce conversation isolation: never render a thread belonging to
        // a different mode inside this pipeline.
        if (threadInfo?.mode && threadInfo.mode !== initialMode) {
          setMessages([]);
          setActiveThreadInfo(null);
          setError(`This conversation belongs to ${threadInfo.mode} chat and is not available here.`);
        } else {
          setMessages(loadedMessages);
          setActiveThreadInfo(threadInfo);
          setError(null);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to load chat history';
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeThreadId, initialMode]);

  const clearHistory = async (wsId?: string, tId?: string) => {
    const targetWs = wsId || activeWorkspaceId;
    const targetThread = tId !== undefined ? tId : currentThreadId;
    try {
      let endpoint = '/chat/clear';
      if (targetThread) {
        endpoint += `?thread_id=${targetThread}`;
      } else if (targetWs) {
        endpoint += `?workspace_id=${targetWs}&mode=${initialMode}`;
      }
      await api.delete(endpoint, {
        headers: targetWs ? { 'X-Workspace-Id': targetWs } : {},
      });
      setMessages([]);
      setActiveThreadInfo(null);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to clear chat';
      setError(msg);
    }
  };

  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreaming(false);
  }, []);

  const switchThread = useCallback((tId: string | null) => {
    // Stop any live stream first so its late tokens can't bleed into the
    // newly selected conversation, then load (abort cleared → fetch proceeds).
    stopGenerating();
    setSelectedThreadId(tId);
    setCreatedThreadId(null);
    setActiveThreadInfo(null);
    if (tId) {
      void fetchHistory(activeWorkspaceId, tId);
    } else {
      setMessages([]);
      setLoading(false);
      setError(null);
    }
  }, [activeWorkspaceId, fetchHistory, stopGenerating]);

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
          mode: parsedOptions.mode || initialMode,
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
    activeThreadInfo,
    selectedThreadId,
    setCreatedThreadId,
    switchThread,
    askQuestion,
    stopGenerating,
    clearHistory,
    fetchHistory,
  };
}
