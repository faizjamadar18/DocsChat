'use client';
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { FilenameIcon } from '@/components/connectors/ConnectorIcons';
import type { Citation } from '@/hooks/useChat';

export { FilenameIcon };

/**
 * "N sources used" footer with official icons + trailing arrow.
 * Click toggles the names-only drawer. Hidden when there are no sources
 * (the top "Searched workspace" pill already covers that state).
 */
export default function SourceFooter({
  sources,
  expanded,
  onToggle,
}: {
  sources: Citation[];
  expanded: boolean;
  onToggle: () => void;
}) {
  if (!sources || sources.length === 0) return null;

  // Dedupe by source_id so one file appears once even if cited per page.
  const seen = new Map<string, Citation>();
  sources.forEach((s) => {
    if (!seen.has(s.source_id)) seen.set(s.source_id, s);
  });
  const unique = Array.from(seen.values());
  const visible = unique.slice(0, 4);
  const overflow = unique.length - visible.length;
  const count = unique.length;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      title={unique.map((s) => s.filename).join(', ')}
      className="mt-4 flex items-center gap-2.5 text-xs sm:text-[13px] text-text-secondary hover:text-text-primary transition-colors cursor-pointer w-fit text-left group select-none"
    >
      <span className="shrink-0 font-normal">
        {count} {count === 1 ? 'source' : 'sources'} used
      </span>
      <span className="flex items-center gap-1.5">
        {visible.map((s) => (
          <span
            key={s.source_id}
            title={s.filename}
            className="inline-flex items-center justify-center shrink-0"
          >
            <FilenameIcon filename={s.filename} />
          </span>
        ))}
        {overflow > 0 && (
          <span className="px-1.5 h-4 rounded-full bg-zinc-100 border border-border text-[9px] font-medium text-text-secondary inline-flex items-center">
            +{overflow}
          </span>
        )}
      </span>
      <ChevronDown
        className={`w-3.5 h-3.5 text-text-muted group-hover:text-text-primary shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
      />
    </button>
  );
}
