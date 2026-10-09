'use client';
import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  NotionIcon,
  PdfIcon,
  StudioDocIcon,
} from '@/components/connectors/ConnectorIcons';
import type { Citation } from '@/hooks/useChat';

/**
 * Pick an icon from the filename alone (UI-only, no backend help):
 * Notion syncs save as "[Notion] Title", uploads end with .pdf,
 * anything else (Studio docs, Drive files) gets the doc glyph.
 */
export function FilenameIcon({ filename }: { filename: string }) {
  const cls = 'w-4 h-4 shrink-0';
  if (filename.startsWith('[Notion]')) return <NotionIcon className={cls} />;
  if (filename.toLowerCase().endsWith('.pdf')) return <PdfIcon className={cls} />;
  return <StudioDocIcon className={cls} />;
}

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
      className="mt-3 pt-2.5 border-t border-border/40 flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer w-full text-left"
    >
      <span className="shrink-0">
        {count} {count === 1 ? 'source' : 'sources'} used
      </span>
      <span className="flex items-center">
        {visible.map((s, i) => (
          <span
            key={s.source_id}
            title={s.filename}
            className={`inline-flex rounded-full bg-white ring-2 ring-[#F4F4F6] ${i > 0 ? '-ml-1.5' : ''}`}
          >
            <FilenameIcon filename={s.filename} />
          </span>
        ))}
        {overflow > 0 && (
          <span className="-ml-1.5 px-1.5 h-4 rounded-full bg-sidebar border border-border text-[9px] font-semibold text-text-secondary inline-flex items-center">
            +{overflow}
          </span>
        )}
      </span>
      <ChevronDown
        className={`w-3.5 h-3.5 ml-auto shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
      />
    </button>
  );
}
