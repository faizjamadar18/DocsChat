'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowUp,
  PenLine,
  ChevronRight,
  Search,
  Feather,
  Clock,
  X,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useMentionScope, type MentionItem } from '../../../hooks/useMentionScope';
import { api } from '../../../lib/api';
import { StudioDocIcon, FilenameIcon } from '../../../components/connectors/ConnectorIcons';

interface RecentItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'document' | 'asset';
  sourceType?: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const { currentWorkspace, refreshWorkspaces } = useWorkspace();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const healedRef = useRef(false);

  const [askQuery, setAskQuery] = useState('');
  const [recentAssets, setRecentAssets] = useState<RecentItem[]>([]);
  const [recentDocs, setRecentDocs] = useState<RecentItem[]>([]);
  const [mentionDocs, setMentionDocs] = useState<MentionItem[]>([]);
  const [mentionAssets, setMentionAssets] = useState<MentionItem[]>([]);

  const mention = useMentionScope(mentionDocs, mentionAssets);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const displayName = user?.username
    ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
    : 'there';

  const formatTimeAgo = (dateString: string) => {
    const cleanDateString = !dateString.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(dateString)
      ? `${dateString}Z`
      : dateString;
    const date = new Date(cleanDateString);
    const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      // Key on the live workspace context (not the stale session snapshot) so
      // switching workspaces refills Home immediately, without a refresh.
      const wsId = currentWorkspace?.id || user?.active_workspace_id;
      if (!wsId) return;
      try {
        const data = await api.get(`/workspaces/${wsId}/dashboard`);
        if (cancelled) return;
        if (data) {
          const assets: RecentItem[] = (data.recent_assets || []).map((a: { id: string; filename: string; file_size: number; uploaded_at: string; source_type?: string }) => ({
            id: a.id,
            title: a.filename,
            subtitle: `${(a.file_size / 1024).toFixed(1)} KB • Added ${formatTimeAgo(a.uploaded_at)}`,
            type: 'asset',
            sourceType: a.source_type,
          }));
          setRecentAssets(assets);

          const docs: RecentItem[] = (data.recent_documents || []).map((d: { id: string; title: string; updated_at: string }) => ({
            id: d.id,
            title: d.title || 'Untitled Document',
            subtitle: `Edited ${formatTimeAgo(d.updated_at)}`,
            type: 'document',
          }));
          setRecentDocs(docs);
        }
      } catch (err) {
        // Stale pointer self-heal (once): the active room may be gone
        // (left/removed/deleted). Refresh rooms, retry the first
        // accessible one; if none, the zero-room gate takes over silently.
        const msg = err instanceof Error ? err.message : '';
        if (!healedRef.current && msg === 'Workspace not found') {
          healedRef.current = true;
          try {
            await refreshWorkspaces();
          } catch { /* ignore */ }
          return;
        }
        console.error("Failed to fetch dashboard data:", err);
      }
    }
    loadData();
    const reload = () => { void loadData(); };
    window.addEventListener('sources-updated', reload);
    window.addEventListener('focus', reload);
    return () => {
      cancelled = true;
      window.removeEventListener('sources-updated', reload);
      window.removeEventListener('focus', reload);
    };
  }, [currentWorkspace?.id, user?.active_workspace_id, refreshWorkspaces]);

  // Full workspace source lists for the @ mention dropdown.
  useEffect(() => {
    const wsId = currentWorkspace?.id || user?.active_workspace_id;
    if (!wsId) return;
    let cancelled = false;
    (async () => {
      try {
        const [docsRes, assetsRes] = await Promise.all([
          api.get(`/documents?workspace_id=${wsId}`).catch(() => ({ documents: [] })),
          api.get(`/sources?workspace_id=${wsId}`).catch(() => ({ sources: [] })),
        ]);
        if (cancelled) return;
        setMentionDocs(
          ((docsRes.documents || []) as { id: string; title: string }[]).map((d) => ({
            id: d.id,
            title: d.title || 'Untitled Document',
            type: 'document' as const,
          }))
        );
        setMentionAssets(
          ((assetsRes.sources || []) as { id: string; filename: string; source_type?: string }[]).map(
            (s) => ({
              id: s.id,
              title: s.filename || 'Untitled Asset',
              type: 'asset' as const,
              source_type: s.source_type,
            })
          )
        );
      } catch {
        // Mention lookup is best-effort; the send path works without it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentWorkspace?.id, user?.active_workspace_id]);

  // Enter/send hands the query to a fresh Playground chat.
  const submitToPlayground = () => {
    const query = askQuery.trim();
    if (!query) return;
    const params = new URLSearchParams({ q: query });
    if (mention.attachedScope) {
      params.set('scope_id', mention.attachedScope.id);
      params.set('scope_title', mention.attachedScope.title);
      params.set('scope_type', mention.attachedScope.type);
    }
    router.push(`/playground?${params.toString()}`);
  };

  const handleAskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAskQuery(val);
    mention.processTextChange(val);
  };

  const handleAskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      mention.navigateMentions(e.key);
      if (mention.showMentions && mention.allFilteredMentions.length > 0) {
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'Enter') {
      const result = mention.navigateMentions('Enter');
      if (result === 'dismiss') {
        e.preventDefault();
        return;
      }
      if (result) {
        e.preventDefault();
        setAskQuery(mention.attachMention(result, askQuery));
        inputRef.current?.focus();
        return;
      }
      e.preventDefault();
      submitToPlayground();
      return;
    }
    if (e.key === 'Escape') {
      mention.navigateMentions('Escape');
    }
  };

  const handleSelectMention = (item: MentionItem) => {
    setAskQuery(mention.attachMention(item, askQuery));
    inputRef.current?.focus();
  };

  const quickChips = [
    { label: 'Improve a draft', icon: PenLine },
    { label: 'Research a topic', icon: Search },
    { label: 'Capture a thought', icon: Feather },
    { label: 'Recap my week', icon: Clock },
  ];

  return (
    <div className="w-full px-3.5 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6 animate-fade-in max-w-full overflow-hidden">
      {/* Greeting Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
          {getGreeting()}, {displayName}
        </h1>
        <p className="text-xs text-text-secondary mt-0.5 sm:mt-1 font-normal">
          Let&apos;s bring your ideas to life
        </p>
      </div>

      {/* Ask Quello Input Bar */}
      {mention.attachedScope && (
        <div className="mb-2 flex items-center gap-1.5 w-fit bg-white border border-border text-text-primary px-3 py-1 rounded-full text-xs font-medium animate-fade-in shadow-2xs max-w-full">
          {mention.attachedScope.type === 'document' ? (
            <StudioDocIcon className="w-3.5 h-3.5 text-text-secondary shrink-0" />
          ) : (
            <FilenameIcon
              filename={mention.attachedScope.title}
              sourceType={mention.attachedScope.source_type}
              className="w-3.5 h-3.5 text-text-secondary shrink-0"
            />
          )}
          <span className="truncate max-w-45 sm:max-w-xs">{mention.attachedScope.title}</span>
          <button
            type="button"
            onClick={() => mention.clearScope()}
            className="cursor-pointer ml-0.5 text-text-muted hover:text-text-primary shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <div className="relative rounded-2xl bg-sidebar border border-border p-2 sm:p-2.5 flex items-center gap-2 sm:gap-3 shadow-2xs hover:border-[#D1D5DB] transition-all">
        <div className="pl-2 sm:pl-3 flex items-center text-text-muted shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-text-secondary">
            <path
              d="M6 4h8a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4H8a4 4 0 0 0-4 4v1a4 4 0 0 0 4 4h10"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={askQuery}
          onChange={handleAskChange}
          onKeyDown={handleAskKeyDown}
          placeholder="Ask Quello anything... type @ to reference"
          className="flex-1 bg-transparent text-xs sm:text-sm text-text-primary placeholder-text-muted focus:outline-none min-w-0"
        />
        <button
          type="button"
          onClick={submitToPlayground}
          className="w-8 h-8 rounded-xl bg-accent-hover/20 hover:bg-accent-hover/30 text-accent-hover flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="Send query"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        {/* Mention Autocomplete Dropdown */}
        {mention.showMentions && mention.allFilteredMentions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-border p-2 max-h-56 overflow-y-auto z-40 animate-fade-in text-xs">
            {mention.filteredDocs.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                  STUDIO DOCUMENTS
                </div>
                {mention.filteredDocs.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleSelectMention(d)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer hover:bg-[#F3F4F6] text-text-primary"
                  >
                    <StudioDocIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{d.title}</span>
                  </button>
                ))}
              </div>
            )}
            {mention.filteredAssets.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                  UPLOADED ASSETS
                </div>
                {mention.filteredAssets.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => handleSelectMention(a)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer hover:bg-[#F3F4F6] text-text-primary"
                  >
                    <FilenameIcon
                      filename={a.title}
                      sourceType={a.source_type}
                      className="w-3.5 h-3.5 shrink-0"
                    />
                    <span className="truncate">{a.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Start Writing Action Card */}
      <Link
        href="/studio"
        className="flex items-center justify-between p-4 rounded-xl bg-sidebar hover:bg-accent-subtle border border-border transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-[#111113] flex items-center justify-center text-white shrink-0 shadow-xs">
            <PenLine className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Start writing</h3>
            <p className="text-xs text-text-secondary">Open a blank canvas and let ideas flow</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
      </Link>

      {/* Quick Prompt Action Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {quickChips.map((chip) => {
          const Icon = chip.icon;
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => setAskQuery(chip.label + ': ')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-white hover:bg-sidebar text-xs text-[#4B5563] hover:text-text-primary transition-colors cursor-pointer shadow-2xs"
            >
              <Icon className="w-3.5 h-3.5 text-text-secondary" />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Recent Assets Section */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-text-primary">Recent Assets</h2>
          <Link
            href="/assets"
            className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
          >
            <span>View all</span>
          </Link>
        </div>

        <div className="space-y-1">
          {recentAssets.map((asset) => (
            <Link
              key={asset.id}
              href="/assets"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-sidebar transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center shrink-0">
                  <FilenameIcon filename={asset.title} sourceType={asset.sourceType} className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-text-primary group-hover:text-accent-hover transition-colors">
                    {asset.title}
                  </h4>
                  <p className="text-[11px] text-text-muted">{asset.subtitle}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#D1D5DB] group-hover:text-text-secondary transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Documents Section */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-text-primary">Recent Documents</h2>
          <Link
            href="/studio"
            className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
          >
            <span>View all</span>
          </Link>
        </div>

        <div className="space-y-1">
          {recentDocs.map((doc) => (
            <Link
              key={doc.id}
              href="/studio"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-sidebar transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center shrink-0">
                  <StudioDocIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-text-primary group-hover:text-accent-hover transition-colors">
                    {doc.title}
                  </h4>
                  <p className="text-[11px] text-text-muted">{doc.subtitle}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#D1D5DB] group-hover:text-text-secondary transition-colors" />
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
