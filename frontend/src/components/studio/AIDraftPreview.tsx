'use client';

import React, { useEffect, useRef } from 'react';
import { Sparkles, Square, RotateCcw, X, Check } from 'lucide-react';
import Markdown from '../Markdown';
import type { AIDraftMode } from '@/lib/aiDraft';

export type AIDraftStatus = 'generating' | 'streaming' | 'ready' | 'error';

interface AIDraftPreviewProps {
  prompt: string;
  visibleMarkdown: string;
  totalLength: number;
  status: AIDraftStatus;
  stoppedEarly: boolean;
  error: string | null;
  mode: AIDraftMode;
  docEmpty: boolean;
  onModeChange: (mode: AIDraftMode) => void;
  onKeep: () => void;
  onTryAgain: () => void;
  onDiscard: () => void;
  onStop: () => void;
  /**
   * Caps the whole card to the visible space (floating placement). The card
   * becomes a flex column: header/actions pinned, only the middle scrolls —
   * so there is exactly one scrollbar. Null = in-flow fallback (page scrolls).
   */
  capHeight?: number | null;
}

const STATUS_LABEL: Record<AIDraftStatus, string> = {
  generating: 'Creating…',
  streaming: 'Writing…',
  ready: 'Ready to review',
  error: 'Creation failed',
};

export function AIDraftPreview({
  prompt,
  visibleMarkdown,
  totalLength,
  status,
  stoppedEarly,
  error,
  mode,
  docEmpty,
  onModeChange,
  onKeep,
  onTryAgain,
  onDiscard,
  onStop,
  capHeight = null,
}: AIDraftPreviewProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const busy = status === 'generating' || status === 'streaming';
  const capped = capHeight != null;
  // Stopped before a single word arrived: nothing to keep, but the card stays
  // so the prompt isn't lost — Try again / Discard only.
  const emptyStop = status === 'ready' && stoppedEarly && totalLength === 0;

  // Keep the newest streamed lines in view, like watching Notion write.
  useEffect(() => {
    const el = bodyRef.current;
    if (el && busy) {
      el.scrollTop = el.scrollHeight;
    }
  }, [visibleMarkdown, busy]);

  return (
    <div
      style={capped ? { maxHeight: `${capHeight}px` } : undefined}
      className={
        capped
          ? 'bg-white text-text-primary rounded-2xl shadow-xl border border-border p-4 animate-fade-in flex flex-col overflow-hidden'
          : 'bg-white text-text-primary rounded-2xl shadow-xl border border-border p-4 animate-fade-in'
      }
      role="region"
      aria-label="Create with AI preview"
    >
      {/* Header: what was asked + live status (pinned) */}
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-sidebar border border-border flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-text-primary truncate">
            Create with AI
          </p>
          <p className="text-[11px] text-text-muted truncate" title={prompt}>
            From: {prompt}
          </p>
        </div>
        <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium bg-sidebar text-text-secondary border border-border/80">
          <span className={busy ? 'animate-pulse' : undefined}>{STATUS_LABEL[status]}</span>
        </span>
      </div>

      {/* Body: the single scrollable area when capped (never saved until Keep) */}
      <div
        ref={bodyRef}
        className={
          capped
            ? 'mt-3 flex-1 min-h-0 overflow-y-auto rounded-xl border border-border/70 bg-surface px-4 py-3'
            : 'mt-3 max-h-96 overflow-y-auto rounded-xl border border-border/70 bg-surface px-4 py-3'
        }
      >
        {status === 'generating' && !visibleMarkdown ? (
          <p className="text-[13px] text-text-muted animate-pulse">
            Thinking…
          </p>
        ) : (
          <>
            <Markdown content={visibleMarkdown} />
            {busy && (
              <span
                className="inline-block w-1.5 h-4 bg-accent animate-pulse rounded-full align-middle ml-0.5"
                aria-hidden="true"
              />
            )}
          </>
        )}
        {status === 'error' && error ? (
          <div className="mt-2 px-2.5 py-2 rounded-xl bg-red-50 text-xs text-red-600">
            {error}
          </div>
        ) : null}
        {status === 'ready' && stoppedEarly && !emptyStop ? (
          <p className="mt-2 text-[11px] text-text-muted">
            Stopped early — showing a partial creation ({visibleMarkdown.length} of {totalLength} characters).
          </p>
        ) : null}
        {emptyStop ? (
          <p className="mt-2 text-[11px] text-text-muted">
            Stopped before anything was written. Try again when ready.
          </p>
        ) : null}
      </div>

      {/* Mode toggle: pinned below the scroll area */}
      {status !== 'error' && !emptyStop && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 shrink-0" role="group" aria-label="Insert mode">
          <button
            type="button"
            disabled={busy}
            onClick={() => onModeChange('append')}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer disabled:opacity-50 ${
              mode === 'append'
                ? 'bg-accent-subtle text-accent-hover border-accent/20 font-medium'
                : 'bg-white text-text-secondary border-border hover:bg-sidebar hover:text-text-primary'
            }`}
          >
            Append at end
          </button>
          <button
            type="button"
            disabled={busy || docEmpty}
            title={docEmpty ? 'Document is empty — nothing to replace' : 'Replace the whole document (asks for confirmation)'}
            onClick={() => onModeChange('replace')}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer disabled:opacity-50 ${
              mode === 'replace'
                ? 'bg-accent-subtle text-accent-hover border-accent/20 font-medium'
                : 'bg-white text-text-secondary border-border hover:bg-sidebar hover:text-text-primary'
            }`}
          >
            Replace document
          </button>
        </div>
      )}

      {/* Actions (pinned — always reachable, never scrolled away) */}
      <div className="mt-3 flex flex-wrap items-center gap-2 shrink-0">
        {busy ? (
          <button
            type="button"
            onClick={onStop}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-text-primary text-white hover:bg-black transition-colors cursor-pointer"
          >
            <Square className="w-3 h-3 fill-white text-white" />
            Stop
          </button>
        ) : status === 'error' ? (
          <>
            <button
              type="button"
              onClick={onTryAgain}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-text-primary text-white hover:bg-black transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try again
            </button>
            <button
              type="button"
              onClick={onDiscard}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-text-secondary hover:bg-sidebar hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Discard
            </button>
          </>
        ) : emptyStop ? (
          <>
            <button
              type="button"
              onClick={onTryAgain}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-text-primary text-white hover:bg-black transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try again
            </button>
            <button
              type="button"
              onClick={onDiscard}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-text-secondary hover:bg-sidebar hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Discard
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onKeep}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-text-primary text-white hover:bg-black transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Keep in editor
            </button>
            <button
              type="button"
              onClick={onTryAgain}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-text-secondary hover:bg-sidebar hover:text-text-primary transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try again
            </button>
            <button
              type="button"
              onClick={onDiscard}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-text-secondary hover:bg-sidebar hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Discard
            </button>
          </>
        )}
      </div>

      <p className="mt-2 text-[11px] text-text-muted shrink-0">
        Nothing is saved or indexed until you click Keep in editor.
      </p>
    </div>
  );
}
