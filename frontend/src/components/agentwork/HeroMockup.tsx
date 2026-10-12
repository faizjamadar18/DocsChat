'use client';

import React from 'react';
import {
  Home01Icon,
  CommandLineIcon,
  NoteEditIcon,
  Folder01Icon,
  Plug01Icon,
  ServerStack01Icon,
  Edit02Icon,
  ArrowDown01Icon,
  ArrowUpDownIcon,
} from 'hugeicons-react';
import {
  ArrowUp,
  PenLine,
  ChevronRight,
  Search,
  Feather,
  Clock,
  PanelLeft,
  Bell,
} from 'lucide-react';
import {
  NotionIcon,
  GitHubIcon,
  GoogleDriveIcon,
  PdfIcon,
  StudioDocIcon,
} from '../connectors/ConnectorIcons';

export default function HeroMockup() {
  const quickChips = [
    { label: 'Improve a draft', icon: PenLine },
    { label: 'Research a topic', icon: Search },
    { label: 'Capture a thought', icon: Feather },
    { label: 'Recap my week', icon: Clock },
  ];

  const recentAssets = [
    {
      id: 'asset-notion',
      title: 'Engineering Knowledge Base',
      subtitle: 'Notion • Synced 2 hours ago',
      icon: NotionIcon,
    },
    {
      id: 'asset-github',
      title: 'docschat-core-backend',
      subtitle: 'GitHub • Synced 1 day ago',
      icon: GitHubIcon,
    },
    {
      id: 'asset-drive',
      title: 'Q4 Strategic Roadmap & OKRs',
      subtitle: 'Google Drive • Synced 3 days ago',
      icon: GoogleDriveIcon,
    },
    {
      id: 'asset-pdf',
      title: 'Enterprise Security & RAG Compliance.pdf',
      subtitle: '2.4 MB • Added 5 days ago',
      icon: PdfIcon,
    },
  ];

  const recentDocs = [
    {
      id: 'doc-1',
      title: 'System Architecture & Unified Indexing Spec',
      subtitle: 'Edited today',
    },
  ];

  const chatHistory = [
    'Cross-source PR analysis & launch blockers',
    'API contract diff: v1 vs v2 embeddings',
    'Synthesize Q4 roadmap with engineering tasks',
    'Compliance review for vector storage',
    'Evaluate vector index latency & Qdrant recall',
    'SOC2 data boundary & connector access audit',
    'Summarize feedback from customer syncs',
  ];

  return (
    <div className="w-full h-full bg-sidebar rounded-2xl border border-border shadow-ui-visual flex overflow-hidden text-text-primary select-none text-left relative">
      {/* Left Sidebar */}
      <aside className="w-52 shrink-0 flex flex-col justify-between bg-sidebar">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Workspace Brand / Header */}
          <div className="h-12 px-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {/* Logo Mark */}
              <div className="w-6 h-6 rounded-md bg-[#111113] flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white"
                >
                  <path
                    d="M6 4h8a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4H8a4 4 0 0 0-4 4v1a4 4 0 0 0 4 4h10"
                    stroke="#FF5533"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-xs font-semibold text-text-primary truncate">
                Faiz HQ
              </span>
            </div>
            <ArrowDown01Icon size={13} className="text-text-muted shrink-0" />
          </div>

          {/* New Chat Button */}
          <div className="px-2.5 pt-2 pb-1.5 shrink-0">
            <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-accent-subtle transition-colors w-full cursor-default">
              <Edit02Icon size={15} className="text-text-secondary shrink-0" />
              <span>New Chat</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="px-2.5 pb-1 space-y-0.5">
            <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-accent-subtle text-accent-hover cursor-default">
              <Home01Icon size={15} className="text-accent-hover shrink-0" />
              <span>Home</span>
            </div>
            <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-accent-subtle transition-colors cursor-default">
              <CommandLineIcon size={15} className="shrink-0 text-text-secondary" />
              <span>Playground</span>
            </div>
            <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-accent-subtle transition-colors cursor-default">
              <NoteEditIcon size={15} className="shrink-0 text-text-secondary" />
              <span>Studio</span>
            </div>
            <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-accent-subtle transition-colors cursor-default">
              <Folder01Icon size={15} className="shrink-0 text-text-secondary" />
              <span>Assets</span>
            </div>
            <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-accent-subtle transition-colors cursor-default">
              <Plug01Icon size={15} className="shrink-0 text-text-secondary" />
              <span>Connectors</span>
            </div>
            <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-accent-subtle transition-colors cursor-default">
              <ServerStack01Icon size={15} className="shrink-0 text-text-secondary" />
              <span>MCP Server</span>
            </div>
          </nav>

          {/* Chats Section */}
          <div className="px-2.5 pt-2 flex-1 min-h-0 overflow-y-auto no-scrollbar scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="px-2.5 py-1 text-[11px] font-semibold text-text-muted">
              Chats
            </div>
            <div className="mt-0.5 space-y-0.5">
              {chatHistory.map((title, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] text-text-secondary hover:text-text-primary hover:bg-accent-subtle transition-colors cursor-default truncate leading-tight"
                >
                  {title}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-2.5 border-t border-border/80">
          <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-accent-subtle cursor-default transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-text-primary text-white flex items-center justify-center text-[10px] font-semibold shrink-0">
                F
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-text-primary truncate leading-tight">
                  Faiz Jamadar
                </p>
                <p className="text-[10px] text-text-secondary truncate leading-tight">
                  faiz@quello.dev
                </p>
              </div>
            </div>
            <ArrowUpDownIcon size={13} className="text-text-muted shrink-0 ml-1" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden bg-sidebar">
        {/* Header Bar */}
        <header className="h-12 px-4 bg-sidebar flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-md text-text-secondary">
              <PanelLeft className="w-4 h-4" />
            </div>
            <nav className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
              <span className="text-text-primary font-semibold">Faiz HQ</span>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Box */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border-subtle bg-base w-44">
              <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span className="text-[11px] text-text-muted flex-1 truncate">Search...</span>
              <kbd className="inline-flex items-center px-1 py-0.2 text-[9px] text-text-secondary bg-surface border border-border rounded font-sans shadow-2xs">
                ⌘K
              </kbd>
            </div>

            {/* Quello Voice Pill */}
            <div className="bg-[#111113] text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium shadow-xs shrink-0 cursor-default">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              </span>
              <span className="tracking-tight text-[11px]">Quello</span>
            </div>

            {/* Notification Bell */}
            <div className="p-1 rounded-lg text-text-secondary">
              <Bell className="w-3.5 h-3.5" />
            </div>
          </div>
        </header>

        {/* Scrollable Canvas / Workspace View */}
        <main className="flex-1 min-h-0 flex flex-col overflow-y-auto no-scrollbar scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-surface rounded-tl-[20px] shadow-2xs p-5 space-y-4">
          {/* Greeting Header */}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Good Afternoon, Faiz
            </h1>
            <p className="text-xs text-text-secondary mt-0.5 font-normal">
              Let&apos;s bring your ideas to life
            </p>
          </div>

          {/* Ask Quello Input Bar */}
          <div className="relative rounded-2xl bg-sidebar border border-border p-2.5 flex items-center gap-2.5 shadow-2xs">
            <div className="pl-2 flex items-center text-text-muted">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-text-secondary">
                <path
                  d="M6 4h8a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4H8a4 4 0 0 0-4 4v1a4 4 0 0 0 4 4h10"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="flex-1 text-sm text-text-muted truncate select-none">
              Ask Quello anything... type @ to reference
            </span>
            <div className="w-7 h-7 rounded-xl bg-accent-hover/20 text-accent-hover flex items-center justify-center shrink-0 cursor-default">
              <ArrowUp className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Start Writing Action Card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-sidebar border border-border cursor-default hover:bg-accent-subtle transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#111113] flex items-center justify-center text-white shrink-0 shadow-xs">
                <PenLine className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-text-primary">Start writing</h3>
                <p className="text-[11px] text-text-secondary">Open a blank canvas and let ideas flow</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted" />
          </div>

          {/* Quick Prompt Action Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {quickChips.map((chip) => {
              const Icon = chip.icon;
              return (
                <div
                  key={chip.label}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-white text-[11px] text-[#4B5563] shadow-2xs cursor-default"
                >
                  <Icon className="w-3 h-3 text-text-secondary" />
                  <span>{chip.label}</span>
                </div>
              );
            })}
          </div>

          {/* Recent Assets Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-text-primary">Recent Assets</h2>
              <span className="text-[11px] text-text-secondary cursor-default">View all</span>
            </div>

            <div>
              {recentAssets.map((asset) => {
                const Icon = asset.icon;
                return (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-sidebar transition-colors cursor-default"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-medium text-text-primary truncate">
                          {asset.title}
                        </h4>
                        <p className="text-[10px] text-text-muted truncate">{asset.subtitle}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#D1D5DB] shrink-0 ml-2" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Documents Section */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-text-primary">Recent Documents</h2>
              <span className="text-[11px] text-text-secondary cursor-default">View all</span>
            </div>

            <div>
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-sidebar transition-colors cursor-default"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center shrink-0">
                      <StudioDocIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-medium text-text-primary truncate">
                        {doc.title}
                      </h4>
                      <p className="text-[10px] text-text-muted truncate">{doc.subtitle}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#D1D5DB] shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
