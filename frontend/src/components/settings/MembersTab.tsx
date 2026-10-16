'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Send, Trash2, LogOut, Check } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../lib/api';

interface Member {
  user_id: string;
  email?: string | null;
  role: string;
  added_by?: string | null;
  added_at?: string | null;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at?: string | null;
  created_at?: string | null;
}

export default function MembersTab() {
  const { currentWorkspace } = useWorkspace();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const [sending, setSending] = useState(false);
  const [sentFlash, setSentFlash] = useState('');

  const wsId = currentWorkspace?.id;
  const myRole = currentWorkspace?.role || 'viewer';
  const isOwner = myRole === 'owner';

  useEffect(() => {
    if (!wsId || wsId === 'default') return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get(`/workspaces/${wsId}/members`);
        if (!cancelled) {
          setMembers(data.members || []);
          setInvites(data.invites || []);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load members.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [wsId]);

  const load = useCallback(async () => {
    if (!wsId || wsId === 'default') return;
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/workspaces/${wsId}/members`);
      setMembers(data.members || []);
      setInvites(data.invites || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load members.');
    } finally {
      setLoading(false);
    }
  }, [wsId]);

  const handleSend = async () => {
    setError('');
    setSentFlash('');
    const list = emails.split(',').map((e) => e.trim()).filter(Boolean);
    if (!list.length) {
      setError('Add at least one email.');
      return;
    }
    setSending(true);
    try {
      await api.post(`/workspaces/${wsId}/invites`, { emails: list, role });
      setEmails('');
      setSentFlash(`Invites sent to ${list.length} ${list.length === 1 ? 'person' : 'people'}.`);
      await load();
      setTimeout(() => setSentFlash(''), 4000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not send invites.');
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await api.delete(`/workspaces/${wsId}/invites/${id}`);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not revoke invite.');
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Remove this member? Their uploads stay, access stops immediately.')) return;
    try {
      await api.delete(`/workspaces/${wsId}/members/${userId}`);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not remove member.');
    }
  };

  const handleLeave = async () => {
    if (!confirm('Leave this workspace? You will lose access to its docs.')) return;
    try {
      await api.post(`/workspaces/${wsId}/leave`, {});
      window.location.href = '/home';
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not leave workspace.');
    }
  };

  if (!wsId || wsId === 'default') {
    return <p className="text-xs text-text-secondary">Select a workspace first.</p>;
  }

  return (
    <div className="w-full space-y-6">
      <div className="w-full bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-text-primary">Members</h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            {currentWorkspace?.name} • {members.length} member{members.length === 1 ? '' : 's'} • Shared room: everyone sees the same PDFs, Studio docs and imported copies. Chats stay private. Notion/Drive/GitHub logins stay personal.
          </p>
          {!isOwner && (
            <p className="text-xs text-text-muted mt-2">You are {myRole}. Only the owner can invite or remove.</p>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 rounded-xl bg-sidebar animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-border">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{m.email || m.user_id}</p>
                  <p className="text-[11px] text-text-muted capitalize">{m.role}</p>
                </div>
                {isOwner && m.role !== 'owner' && (
                  <button
                    type="button"
                    onClick={() => void handleRemove(m.user_id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {invites.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Pending invites</p>
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-sidebar border border-border">
                <div className="min-w-0">
                  <p className="text-xs text-text-primary truncate">{inv.email}</p>
                  <p className="text-[11px] text-text-muted capitalize">{inv.role} • pending</p>
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => void handleRevoke(inv.id)}
                    className="text-[11px] font-medium text-text-muted hover:text-red-600 cursor-pointer"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {isOwner ? (
          <div className="space-y-3 pt-2 border-t border-border/60">
            <label className="block text-xs sm:text-sm font-medium text-text-primary pt-2">
              Invite by email
            </label>
            <p className="text-[11px] text-text-muted -mt-2">Comma separated. Max 20 per send. Free Resend quota: 100/day.</p>
            <textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="alice@example.com, bob@example.com"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-sidebar/40 focus:bg-surface text-base sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none placeholder:text-text-muted"
            />
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                className="px-3 py-2 rounded-xl border border-border bg-surface text-xs font-medium cursor-pointer"
              >
                <option value="viewer">Viewer — can read + ask</option>
                <option value="editor">Editor — can add + ask</option>
              </select>
              <button
                type="button"
                disabled={sending}
                onClick={() => void handleSend()}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {sending ? 'Sending...' : 'Send invites'}
              </button>
            </div>
            {sentFlash && (
              <p className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {sentFlash}
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void handleLeave()}
            className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-text-secondary hover:text-red-600 hover:border-red-200 cursor-pointer inline-flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" /> Leave workspace
          </button>
        )}

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      </div>
    </div>
  );
}
