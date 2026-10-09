'use client';
import React, { useEffect, useState } from 'react';
import { Server } from 'lucide-react';
import { api } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { fetchMcpProviders, type McpProvider } from '@/components/mcp/mcpProviders';
import McpDrawer from '@/components/mcp/McpDrawer';

export default function McpPage() {
  const { currentWorkspace } = useWorkspace();
  const [serverUrl, setServerUrl] = useState('');
  const [providers, setProviders] = useState<McpProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<McpProvider | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [info, list] = await Promise.all([
          api.get('/mcp/info'),
          fetchMcpProviders(),
        ]);
        if (cancelled) return;
        setServerUrl((info.server_url as string) || '');
        setProviders(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load MCP settings');
      } finally {
        if (!cancelled) setLoadingProviders(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-full px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
          <Server className="w-5 h-5" />
          MCP Server
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Let your favourite AI apps answer from your workspace documents. Read-only:
          they can search and read, never edit or delete.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      {/* Provider cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loadingProviders
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-border rounded-2xl p-5 space-y-3 animate-pulse"
              >
                <div className="w-8 h-8 rounded-lg bg-sidebar" />
                <div className="h-4 w-24 rounded bg-sidebar" />
                <div className="h-3 w-full rounded bg-sidebar" />
              </div>
            ))
          : providers.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p)}
                  className="text-left bg-white border border-border rounded-2xl p-5 space-y-3 hover:shadow-sm hover:border-text-primary/20 transition-all cursor-pointer"
                >
                  <Icon className="w-8 h-8" />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{p.name}</p>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">{p.tagline}</p>
                  </div>
                </button>
              );
            })}
      </div>

      {/* Side drawer (owns the Connect popup inside it). Key-remount per
          provider so Connect/keys state resets when switching cards. */}
      <McpDrawer
        key={selected?.id ?? 'closed'}
        provider={selected}
        workspaceId={currentWorkspace?.id}
        serverUrl={serverUrl}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
