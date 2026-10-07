'use client';
import React, { useEffect, useState } from 'react';
import { X, Mic, Copy, Check, Trash2, Clock, CalendarDays } from 'lucide-react';
import type { VoiceLog } from '../../hooks/useVoiceLogs';

function formatFullDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const clean =
      !dateStr.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(dateStr) ? `${dateStr}Z` : dateStr;
    return new Date(clean).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function formatDuration(total: number): string {
  const s = Math.max(0, total || 0);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${String(s % 60).padStart(2, '0')}s`;
}

export default function VoiceLogModal({
  log,
  onClose,
  onDelete,
}: {
  log: VoiceLog | null;
  onClose: () => void;
  onDelete: (logId: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!log) return;
    setCopied(false);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [log, onClose]);

  if (!log) return null;

  const fullText = `You: ${log.user_text || '(no speech recorded)'}\n\nOra: ${
    log.ora_text || '(no reply recorded)'
  }`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${log.title}\n${formatFullDate(log.created_at)}\n\n${fullText}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-border w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-4 pb-3 border-b border-border/70">
          <div className="w-9 h-9 rounded-xl bg-[#111113] text-white flex items-center justify-center shrink-0">
            <Mic className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-text-primary truncate">{log.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
                <CalendarDays className="w-3 h-3" />
                {formatFullDate(log.created_at)}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECE8F4] text-[#765D96]">
                <Clock className="w-3 h-3" />
                {formatDuration(log.duration_seconds)}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-sidebar text-text-secondary border border-border">
                Voice
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Full conversation */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              You said
            </div>
            <div className="rounded-2xl px-4 py-3 bg-[#83699e] text-white text-[13px] leading-relaxed whitespace-pre-wrap">
              {log.user_text || '(no speech was recorded for this call)'}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Ora replied
            </div>
            <div className="rounded-2xl px-4 py-3 bg-[#F4F4F6] text-text-primary text-[13px] leading-relaxed whitespace-pre-wrap">
              {log.ora_text || '(Ora didn’t get to reply before the call ended)'}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-border/70 bg-white">
          <button
            type="button"
            onClick={() => {
              if (confirm('Delete this voice conversation?')) onDelete(log.id);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-text-primary hover:bg-sidebar transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#111113] hover:bg-black text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
