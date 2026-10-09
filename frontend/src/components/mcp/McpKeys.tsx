'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Copy, Check, Plus, Trash2, Ban } from 'lucide-react';
import { api } from '@/lib/api';

interface McpKey {
  id: string;
  name: string;
  key_prefix: string;
  revoked: boolean;
}

/** Compact personal-key manager sized to fit inside the provider drawer. */
export default function McpKeys({ workspaceId }: { workspaceId?: string }) {
  const [keys, setKeys] = useState<McpKey[]>([]);
  const [keyName, setKeyName] = useState('');
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/mcp-keys');
      setKeys(((data.keys || []) as McpKey[]).slice(0, 3));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load keys');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const copyFreshKey = useCallback(async () => {
    if (!freshKey) return;
    try {
      await navigator.clipboard.writeText(freshKey);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = freshKey;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [freshKey]);

  const createKey = useCallback(async () => {
    setError(null);
    setFreshKey(null);
    try {
      const data = await api.post('/mcp-keys', {
        name: keyName.trim() || 'Personal key',
        workspace_id: workspaceId,
      });
      setFreshKey(data.api_key as string);
      setKeyName('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create key');
    }
  }, [keyName, workspaceId, refresh]);

  const revokeKey = useCallback(
    async (id: string) => {
      if (!confirm('Revoke this key? Apps using it will stop working.')) return;
      try {
        await api.delete(`/mcp-keys/${id}`);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to revoke key');
      }
    },
    [refresh],
  );

  const deleteKey = useCallback(
    async (id: string) => {
      if (!confirm('Permanently delete this key? This cannot be undone.')) return;
      try {
        await api.delete(`/mcp-keys/${id}?permanent=true`);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to delete key');
      }
    },
    [refresh],
  );

  return (
    <div>
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
        Personal keys
      </p>
      <p className="text-[11px] text-text-secondary leading-relaxed mb-2">
        Paste one as the bearer token when asked. Revoke any time.
      </p>
      {error ? <p className="text-[11px] text-red-600 mb-2">{error}</p> : null}
      {freshKey ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 mb-2">
          <p className="text-[10px] font-semibold text-emerald-800 mb-1.5">
            Copy now — never shown again.
          </p>
          <div className="flex items-center gap-1.5">
            <code className="flex-1 min-w-0 truncate rounded-md border border-emerald-200 bg-white px-2 py-1.5 text-[11px] text-text-primary">
              {freshKey}
            </code>
            <button
              type="button"
              onClick={() => void copyFreshKey()}
              className="p-1.5 rounded-md bg-emerald-700 text-white hover:opacity-90 transition-opacity cursor-pointer shrink-0"
              title="Copy key"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      ) : null}
      <div className="flex items-center gap-1.5 mb-2">
        <input
          value={keyName}
          onChange={(e) => setKeyName(e.target.value)}
          placeholder="Key name (optional)"
          maxLength={50}
          className="flex-1 min-w-0 rounded-lg border border-border px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-hover"
        />
        <button
          type="button"
          onClick={() => void createKey()}
          title="Create key"
          className="p-1.5 rounded-lg bg-text-primary text-white hover:bg-black transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {keys.length > 0 ? (
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center gap-2 px-2.5 py-1.5">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-text-primary truncate">{k.name}</p>
                <p className="text-[10px] text-text-muted truncate">
                  {k.key_prefix}...{k.revoked ? ' · revoked' : ''}
                </p>
              </div>
              {!k.revoked ? (
                <button
                  type="button"
                  onClick={() => void revokeKey(k.id)}
                  title="Revoke key"
                  className="p-1 rounded-md text-text-muted hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer shrink-0"
                >
                  <Ban className="w-3 h-3" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void deleteKey(k.id)}
                title="Delete key permanently"
                className="p-1 rounded-md text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
