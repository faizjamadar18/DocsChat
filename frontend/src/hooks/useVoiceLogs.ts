'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface VoiceLog {
  id: string;
  workspace_id: string;
  title: string;
  user_text: string;
  ora_text: string;
  duration_seconds: number;
  created_at: string;
}

export function useVoiceLogs(workspaceId?: string) {
  const [logs, setLogs] = useState<VoiceLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!workspaceId) {
      setLogs([]);
      setLoading(false);
      return;
    }
    try {
      const data = await api.get(`/voice/logs?workspace_id=${workspaceId}`, {
        headers: { 'X-Workspace-Id': workspaceId },
      });
      setLogs(data.logs || []);
    } catch {
      // Voice history is best-effort; text chat must never break because of it.
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void fetchLogs();
    const handleSync = () => void fetchLogs();
    window.addEventListener('voice-logs-updated', handleSync);
    return () => window.removeEventListener('voice-logs-updated', handleSync);
  }, [fetchLogs]);

  const deleteLog = useCallback(async (logId: string) => {
    try {
      await api.delete(`/voice/logs/${logId}`);
      setLogs((prev) => prev.filter((l) => l.id !== logId));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { logs, loading, refreshLogs: fetchLogs, deleteLog };
}
