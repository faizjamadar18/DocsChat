'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface VapiKeyStatus {
  has_key: boolean;
  hint: string;
  updated_at: string | null;
}

export function useVapiKey() {
  const [status, setStatus] = useState<VapiKeyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/voice/key-status');
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load key status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveKey = useCallback(async (publicKey: string) => {
    const trimmed = publicKey.trim();
    if (!trimmed) {
      setError('Please paste your Vapi public key first.');
      return false;
    }
    if (/^sk[-_]/i.test(trimmed)) {
      setError('That looks like a private key. Paste only the Public key (starts with pk_).');
      return false;
    }
    setSaving(true);
    setError(null);
    try {
      const data = await api.put('/voice/key', { public_key: trimmed });
      setStatus({ has_key: true, hint: data.hint || '', updated_at: data.updated_at || null });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save key');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteKey = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await api.delete('/voice/key');
      setStatus({ has_key: false, hint: '', updated_at: null });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove key');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { status, loading, saving, error, refresh, saveKey, deleteKey };
}
