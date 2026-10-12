'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../../lib/auth';
import { api } from '../../../lib/api';

export default function OrganizationPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await api.get('/auth/me');
        if (!cancelled && me?.onboarding_completed === true) {
          router.push('/home');
          return;
        }
        // Prefill with the auto-provisioned workspace name so Continue works instantly.
        try {
          const ws = await api.get('/workspaces');
          const list = ws?.workspaces || [];
          const active = list.find((w: { id: string }) => w.id === ws?.active_workspace_id) || list[0];
          if (!cancelled) {
            if (active?.name) setName(active.name);
            else if (me?.username) setName(`${me.username} HQ`);
          }
        } catch {
          if (!cancelled && me?.username) setName(`${me.username} HQ`);
        }
      } catch {
        if (!cancelled) router.push('/login');
        return;
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleContinue = async () => {
    setError('');
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please give your workspace a name.');
      return;
    }
    if (trimmed.length > 100) {
      setError('Keep it under 100 characters.');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/auth/onboarding', { workspace_name: trimmed });
      router.push('/home');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/15 border-l-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in font-sans">
      <h1 className="text-[26px] sm:text-[28px] font-semibold tracking-tight text-white leading-tight">
        Create your workspace
      </h1>
      <p className="mt-3.5 text-[14px] leading-[1.55] text-neutral-400 font-normal tracking-[-0.01em]">
        Create a place for your docs, PDFs and AI chats to live.
      </p>

      <label htmlFor="workspace-name" className="block mt-8 mb-2 text-[13.5px] font-normal text-neutral-300 tracking-[-0.01em]">
        Workspace name
      </label>
      <input
        id="workspace-name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void handleContinue();
        }}
        maxLength={100}
        autoFocus
        placeholder=""
        className="w-full h-10 px-3 rounded-lg bg-[#18181b] border border-white/12 text-white text-[14px] placeholder:text-neutral-500 focus:outline-none focus:border-white/35 focus:ring-1 focus:ring-white/15 transition-all shadow-xs"
      />
      {error && <p className="mt-2 text-[12.5px] text-red-400 font-normal">{error}</p>}

      <button
        type="button"
        onClick={() => void handleContinue()}
        disabled={saving}
        className="mt-4 w-full h-10 rounded-lg bg-[#eeeeec] hover:bg-white disabled:opacity-50 text-[#111110] text-[14px] font-medium transition-all active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed shadow-xs"
      >
        {saving ? 'Saving...' : 'Continue'}
      </button>
    </div>
  );
}
