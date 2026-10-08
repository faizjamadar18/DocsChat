'use client';
import React from 'react';
import { Loader2 } from 'lucide-react';

const ACTIVE = new Set(['processing', 'syncing']);

const base =
  'inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium leading-none';

/** Single source of truth for source status display (Drive + Notion). */
export function StatusPill({ status }: { status: string }) {
  if (ACTIVE.has(status)) {
    return (
      <span className={`${base} bg-amber-100 text-amber-800`}>
        <Loader2 className="w-3 h-3 animate-spin" />
        Syncing
      </span>
    );
  }
  if (status === 'ready') {
    return (
      <span className={`${base} bg-emerald-100 text-emerald-800`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Ready
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className={`${base} bg-red-100 text-red-700`}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Error
      </span>
    );
  }
  return (
    <span className={`${base} bg-[#EFEFF2] text-text-secondary`}>
      {status}
    </span>
  );
}

export function isSyncing(status: string): boolean {
  return ACTIVE.has(status);
}
