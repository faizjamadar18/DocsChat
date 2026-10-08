'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Plug2, ChevronRight } from 'lucide-react';
import { useConnectors } from '@/hooks/useConnectors';
import {
  NotionIcon, GoogleDriveIcon, SlackIcon, GitHubIcon, MicrosoftIcon,
  AtlassianIcon, LinearIcon, HubSpotIcon,
} from '@/components/connectors/ConnectorIcons';

const COMING_SOON = [
  { key: 'slack', name: 'Slack', desc: 'Import threads and shared docs', icon: <SlackIcon /> },
  { key: 'github', name: 'GitHub', desc: 'Import READMEs and docs', icon: <GitHubIcon /> },
  { key: 'm365', name: 'Microsoft 365', desc: 'Import Word and OneDrive files', icon: <MicrosoftIcon /> },
  { key: 'atlassian', name: 'Atlassian', desc: 'Import Confluence pages', icon: <AtlassianIcon /> },
  { key: 'linear', name: 'Linear', desc: 'Import issues and specs', icon: <LinearIcon /> },
  { key: 'hubspot', name: 'HubSpot', desc: 'Import notes and docs', icon: <HubSpotIcon /> },
];

export default function ConnectorsPage() {
  const { status, loading } = useConnectors();
  const [query, setQuery] = useState('');

  const q = query.toLowerCase();
  const showNotion = 'notion'.includes(q) || query === '';
  const showDrive = 'drive'.includes(q) || 'google'.includes(q) || query === '';
  const filteredComingSoon = COMING_SOON.filter((c) =>
    c.name.toLowerCase().includes(q),
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
          <Plug2 className="w-5 h-5" />
          Connectors
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Import content from your tools as sources for Q&amp;A and voice. Answers cite these sources.
        </p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search connectors..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-xs text-text-primary focus:outline-none focus:border-accent-hover"
        />
      </div>

      <div className="rounded-xl border border-border bg-white divide-y divide-border overflow-hidden">
        {showNotion ? (
          <Link
            href="/connectors/notion"
            className="flex items-center gap-3 p-4 hover:bg-sidebar/60 transition-colors cursor-pointer"
          >
            <NotionIcon />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary">Notion</p>
              <p className="text-[11px] text-text-secondary">Import pages from Notion</p>
            </div>
            {loading ? (
              <span className="text-[11px] text-text-muted">Loading...</span>
            ) : status?.notion.connected ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">Connected</span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#EFEFF2] text-text-secondary">Not connected</span>
            )}
            <ChevronRight className="w-4 h-4 text-text-muted" />
          </Link>
        ) : null}

        {showDrive ? (
          <Link
            href="/connectors/drive"
            className="flex items-center gap-3 p-4 hover:bg-sidebar/60 transition-colors cursor-pointer"
          >
            <GoogleDriveIcon />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary">Google Drive</p>
              <p className="text-[11px] text-text-secondary">Import Docs and PDFs from Drive</p>
            </div>
            {loading ? (
              <span className="text-[11px] text-text-muted">Loading...</span>
            ) : status?.drive.connected ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">Connected</span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#EFEFF2] text-text-secondary">Not connected</span>
            )}
            <ChevronRight className="w-4 h-4 text-text-muted" />
          </Link>
        ) : null}

        {filteredComingSoon.map((c) => (
          <div key={c.key} className="flex items-center gap-3 p-4 opacity-70">
            {c.icon}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary">{c.name}</p>
              <p className="text-[11px] text-text-secondary">{c.desc}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#EFEFF2] text-text-secondary">Soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}
