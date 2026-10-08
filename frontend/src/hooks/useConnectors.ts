'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

export interface ProviderState {
  connected: boolean;
  email_or_account?: string | null;
  connected_at?: string | null;
  imported_count: number;
}

export interface ConnectorsStatus {
  notion: ProviderState;
  drive: ProviderState;
}

export interface ConnectorSource {
  id: string;
  filename: string;
  status: string;
  chunk_count: number;
  uploaded_at: string;
  source_type?: string | null;
  remote_id?: string | null;
  remote_url?: string | null;
  last_synced_at?: string | null;
  sync_error?: string | null;
}

export interface NotionPage {
  id: string;
  title: string;
  url?: string | null;
  last_edited_time?: string | null;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType?: string | null;
}

export function useConnectors() {
  const [status, setStatus] = useState<ConnectorsStatus | null>(null);
  const [sources, setSources] = useState<ConnectorSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusData, sourcesData] = await Promise.all([
        api.get('/connectors/status'),
        api.get('/sources'),
      ]);
      setStatus(statusData as ConnectorsStatus);
      const all = (sourcesData.sources || []) as ConnectorSource[];
      setSources(all.filter((s) => s.source_type === 'notion' || s.source_type === 'drive'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load connectors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const connectNotion = useCallback(async () => {
    const data = await api.get('/connectors/notion/auth-url');
    if (data?.auth_url) {
      window.location.href = data.auth_url as string;
    }
  }, []);

  const connectDrive = useCallback(async () => {
    const data = await api.get('/connectors/drive/auth-url');
    if (data?.auth_url) {
      window.location.href = data.auth_url as string;
    }
  }, []);

  const getPickerToken = useCallback(async () => {
    const data = await api.get('/connectors/drive/picker-token');
    return data.access_token as string;
  }, []);

  const importDriveFiles = useCallback(async (files: DriveFile[]) => {
    const data = await api.post('/connectors/drive/import', { files });
    await refresh();
    return data;
  }, [refresh]);

  const listNotionPages = useCallback(async (query?: string) => {
    const data = await api.post('/connectors/notion/pages', { query: query || undefined });
    return (data.pages || []) as NotionPage[];
  }, []);

  const importNotionPages = useCallback(async (pages: NotionPage[]) => {
    const data = await api.post('/connectors/notion/import', { pages });
    await refresh();
    return data;
  }, [refresh]);

  const resyncSource = useCallback(async (sourceId: string) => {
    const data = await api.post(`/connectors/sources/${sourceId}/resync`, {});
    await refresh();
    return data;
  }, [refresh]);

  const disconnectProvider = useCallback(async (provider: 'notion' | 'drive', deleteContent: boolean) => {
    const data = await api.delete(`/connectors/${provider}?delete_content=${deleteContent ? 'true' : 'false'}`);
    await refresh();
    return data;
  }, [refresh]);

  const deleteSource = useCallback(async (sourceId: string) => {
    await api.delete(`/sources/${sourceId}`);
    await refresh();
  }, [refresh]);

  return {
    status, sources, loading, error, refresh,
    connectNotion, listNotionPages, importNotionPages,
    connectDrive, getPickerToken, importDriveFiles,
    resyncSource, disconnectProvider, deleteSource,
  };
}
