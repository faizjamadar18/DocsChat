'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '../../../lib/auth';
import { api } from '../../../lib/api';

interface Lookup {
  workspace_id: string;
  workspace_name: string;
  role: string;
  invited_email: string;
  email_ok: boolean;
  already_member: boolean;
  signed_in_as?: string;
}

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const token = Array.isArray(params?.token) ? params.token[0] : (params?.token as string);
  const [checking, setChecking] = useState(Boolean(token));
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [error, setError] = useState<string>(token ? '' : 'Invalid invite link.');
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreateOwn = async () => {
    setError('');
    setCreating(true);
    try {
      const ws = await api.post('/workspaces', { name: 'My HQ' });
      if (ws?.id) {
        try { await api.post(`/workspaces/${ws.id}/activate`, {}); } catch { /* ignore */ }
      }
      router.push('/home');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not create workspace.');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    if (!auth.isAuthenticated()) {
      router.push(`/login?next=/join/${token}`);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get(`/workspaces/invites/lookup?token=${encodeURIComponent(token)}`);
        if (!cancelled) {
          setLookup(data);
          if (data.already_member) {
            try {
              await api.post(`/workspaces/${data.workspace_id}/activate`, {});
            } catch { /* ignore */ }
            router.push('/home');
            return;
          }
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Invite not found or expired.');
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token, router]);

  const handleJoin = async () => {
    setError('');
    setJoining(true);
    try {
      const res = await api.post(`/workspaces/invites/${encodeURIComponent(token)}/accept`, {});
      if (res?.workspace_id) {
        try { await api.post(`/workspaces/${res.workspace_id}/activate`, {}); } catch { /* ignore */ }
      }
      router.push('/home');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not join workspace.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#111110] text-[#f4f4f5] flex flex-col items-center px-6 py-10 antialiased">
      <div className="w-full max-w-md my-auto py-10 animate-fade-in font-sans">
        <h1 className="text-[26px] font-semibold tracking-tight leading-tight">
          Join {lookup?.workspace_name || 'workspace'}
        </h1>
        {checking ? (
          <div className="py-10 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white/15 border-l-white rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="mt-4">
            <p className="text-[14px] text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => router.push('/home')}
              className="mt-6 w-full h-10 rounded-lg bg-[#eeeeec] text-[#111110] text-[14px] font-medium cursor-pointer"
            >
              Go home
            </button>
            <button
              type="button"
              disabled={creating}
              onClick={() => void handleCreateOwn()}
              className="mt-2 w-full h-10 rounded-lg border border-white/15 text-neutral-300 hover:text-white text-[14px] font-medium cursor-pointer disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'No thanks — create my own workspace'}
            </button>
          </div>
        ) : lookup ? (
          <div className="mt-4 space-y-4">
            <p className="text-[14px] leading-[1.55] text-neutral-400">
              You&apos;ve been invited to join <span className="text-white font-medium">{lookup.workspace_name}</span> on Quello as <span className="text-white font-medium capitalize">{lookup.role}</span>.
            </p>
            <p className="text-[14px] leading-[1.55] text-neutral-400">
              Joining will <span className="text-white">add</span> this workspace to your list. You keep your own workspaces.
            </p>
            {!lookup.email_ok && (
              <p className="text-[13px] text-amber-300">
                This invite is for {lookup.invited_email}, but you are signed in as {lookup.signed_in_as}. Please switch account.
              </p>
            )}
            <p className="text-[13px] text-neutral-500">Currently signed in as {lookup.signed_in_as}.</p>
            <button
              type="button"
              disabled={joining || !lookup.email_ok}
              onClick={() => void handleJoin()}
              className="w-full h-10 rounded-lg bg-[#eeeeec] hover:bg-white disabled:opacity-50 text-[#111110] text-[14px] font-medium cursor-pointer disabled:cursor-not-allowed"
            >
              {joining ? 'Joining...' : `Join ${lookup.workspace_name}`}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
