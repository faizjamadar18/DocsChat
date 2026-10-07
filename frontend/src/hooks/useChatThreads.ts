'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface ChatThread {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useChatThreads(workspaceId?: string) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    if (!workspaceId) {
      setThreads([]);
      setLoading(false);
      return;
    }
    try {
      const data = await api.get(`/chat/threads?workspace_id=${workspaceId}`, {
        headers: { 'X-Workspace-Id': workspaceId },
      });
      setThreads(data.threads || []);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch chat threads';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void fetchThreads();

    const handleSync = () => {
      void fetchThreads();
    };

    window.addEventListener('chat-threads-updated', handleSync);
    return () => {
      window.removeEventListener('chat-threads-updated', handleSync);
    };
  }, [fetchThreads]);

  const createThread = async (title: string = 'New Conversation'): Promise<ChatThread | null> => {
    if (!workspaceId) return null;
    try {
      const newThread: ChatThread = await api.post(
        '/chat/threads',
        { workspace_id: workspaceId, title },
        { headers: { 'X-Workspace-Id': workspaceId } }
      );
      setThreads((prev) => [newThread, ...prev]);
      window.dispatchEvent(new CustomEvent('chat-threads-updated'));
      return newThread;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create thread';
      setError(msg);
      return null;
    }
  };

  const deleteThread = async (threadId: string): Promise<boolean> => {
    try {
      await api.delete(`/chat/threads/${threadId}`);
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      window.dispatchEvent(new CustomEvent('chat-threads-updated'));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete thread';
      setError(msg);
      return false;
    }
  };

  const renameThread = async (threadId: string, newTitle: string): Promise<boolean> => {
    try {
      const updated: ChatThread = await api.patch(`/chat/threads/${threadId}`, {
        title: newTitle,
      });
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, title: updated.title } : t))
      );
      window.dispatchEvent(new CustomEvent('chat-threads-updated'));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to rename thread';
      setError(msg);
      return false;
    }
  };

  return {
    threads,
    loading,
    error,
    refreshThreads: fetchThreads,
    createThread,
    deleteThread,
    renameThread,
  };
}
