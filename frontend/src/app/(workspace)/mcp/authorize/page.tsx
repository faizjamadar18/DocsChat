'use client';
import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Server } from 'lucide-react';
import { api } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';

function AuthorizeInner() {
  const params = useSearchParams();
  const { currentWorkspace } = useWorkspace();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientId = params.get('client_id') || '';
  const redirectUri = params.get('redirect_uri') || '';
  const scope = params.get('scope') || 'workspace:read';
  const state = params.get('state') || '';
  const codeChallenge = params.get('code_challenge') || '';
  const codeChallengeMethod = params.get('code_challenge_method') || 'S256';
  const resource = params.get('resource') || '';

  const approve = async () => {
    setWorking(true);
    setError(null);
    try {
      const data = await api.post('/mcp/oauth/approve', {
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: codeChallengeMethod,
        resource,
        workspace_id: currentWorkspace?.id,
      });
      window.location.href = data.redirect_url as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approval failed');
      setWorking(false);
    }
  };

  if (!clientId || !redirectUri || !codeChallenge) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <p className="text-sm font-semibold text-text-primary">Invalid authorization request</p>
        <p className="text-xs text-text-secondary mt-2">
          This page should be opened from Claude when connecting your MCP server. Please
          start again from Claude, then Settings, then Connectors.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-12 space-y-5 animate-fade-in">
      <div className="text-center space-y-2">
        <Server className="w-8 h-8 mx-auto text-text-primary" />
        <h1 className="text-lg font-semibold text-text-primary">Connect Claude?</h1>
        <p className="text-xs text-text-secondary">
          Claude is asking for read-only access to your workspace documents
          {currentWorkspace ? ` in ${currentWorkspace.name}` : ''}. It will be able to
          search and read your documents, never edit or delete them.
        </p>
      </div>
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
          {error}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => void approve()}
        disabled={working}
        className="w-full px-4 py-2.5 rounded-lg bg-text-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      >
        {working ? 'Connecting...' : 'Allow read-only access'}
      </button>
      <p className="text-[11px] text-text-muted text-center">
        You can revoke access any time by deleting your MCP keys or removing the
        connector in Claude.
      </p>
    </div>
  );
}

export default function McpAuthorizePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-6 py-16 text-center text-xs text-text-muted">
          Loading...
        </div>
      }
    >
      <AuthorizeInner />
    </Suspense>
  );
}
