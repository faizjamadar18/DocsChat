'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowUp,
  PenLine,
  ChevronRight,
  FileText,
  Search,
  Feather,
  Clock,
  File,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { api } from '../../../lib/api';

interface RecentItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'document' | 'asset';
}

export default function HomePage() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();

  const [askQuery, setAskQuery] = useState('');
  const [recentAssets, setRecentAssets] = useState<RecentItem[]>([]);
  const [recentDocs, setRecentDocs] = useState<RecentItem[]>([]);

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

  useEffect(() => {
    async function loadData() {
      try {
        const sourcesData = await api.get('/sources');
        if (sourcesData && sourcesData.sources) {
          const mapped: RecentItem[] = sourcesData.sources.slice(0, 3).map((s: any) => ({
            id: s.id,
            title: s.filename,
            subtitle: `${(s.page_count || 1) * 20} KB • Recently uploaded`,
            type: 'asset',
          }));
          setRecentAssets(mapped);
        }
      } catch {
        // Fallback display items matching visual reference
        setRecentAssets([
          {
            id: '1',
            title: 'agentic_resume.pdf',
            subtitle: '33.8 KB • Added recently',
            type: 'asset',
          },
          {
            id: '2',
            title: 'DocsChat_Architecture.pdf',
            subtitle: '45.6 KB • Added recently',
            type: 'asset',
          },
        ]);
      }

      // Default sample recent documents until Studio Phase 5 creates backend documents
      setRecentDocs([
        {
          id: '1',
          title: 'Plura Doc',
          subtitle: 'Edited 3 days ago',
          type: 'document',
        },
        {
          id: '2',
          title: 'RAG Chatbot Explained',
          subtitle: 'Edited 3 days ago',
          type: 'document',
        },
        {
          id: '3',
          title: 'JavaScript Async Await Basics',
          subtitle: 'Edited 2 months ago',
          type: 'document',
        },
      ]);
    }
    loadData();
  }, []);

  const quickChips = [
    { label: 'Improve a draft', icon: PenLine },
    { label: 'Research a topic', icon: Search },
    { label: 'Capture a thought', icon: Feather },
    { label: 'Recap my week', icon: Clock },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
      {/* Greeting Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
          {getGreeting()}, {displayName}
        </h1>
        <p className="text-xs text-[#6B7280] mt-1 font-normal">
          Let&apos;s bring your ideas to life
        </p>
      </div>

      {/* Ask Ora Input Bar */}
      <div className="relative rounded-2xl bg-[#F7F7F9] border border-[#ECECEE] p-2 flex items-center gap-3 shadow-2xs hover:border-[#D1D5DB] transition-all">
        <div className="pl-3 flex items-center text-[#9CA3AF]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#6B7280]">
            <path
              d="M6 4h8a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4H8a4 4 0 0 0-4 4v1a4 4 0 0 0 4 4h10"
              stroke="#6B7280"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <input
          type="text"
          value={askQuery}
          onChange={(e) => setAskQuery(e.target.value)}
          placeholder="Ask Ora anything... type @ to reference"
          className="flex-1 bg-transparent text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none"
        />
        <button
          type="button"
          className="w-8 h-8 rounded-xl bg-[#5B45B2]/20 hover:bg-[#5B45B2]/30 text-[#5B45B2] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="Send query"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>

      {/* Start Writing Action Card */}
      <Link
        href="/studio"
        className="flex items-center justify-between p-4 rounded-xl bg-[#F7F7F9] hover:bg-[#EFEFF2] border border-[#ECECEE] transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-[#111113] flex items-center justify-center text-white shrink-0 shadow-xs">
            <PenLine className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#111827]">Start writing</h3>
            <p className="text-xs text-[#6B7280]">Open a blank canvas and let ideas flow</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#111827] group-hover:translate-x-0.5 transition-all" />
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#ECECEE] bg-white hover:bg-[#F7F7F9] text-xs text-[#4B5563] hover:text-[#111827] transition-colors cursor-pointer shadow-2xs"
            >
              <Icon className="w-3.5 h-3.5 text-[#6B7280]" />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Recent Documents Section */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-[#111827]">Recent Documents</h2>
          <Link
            href="/studio"
            className="text-xs text-[#6B7280] hover:text-[#111827] flex items-center gap-1 transition-colors"
          >
            <span>View all</span>
          </Link>
        </div>

        <div className="space-y-1">
          {recentDocs.map((doc) => (
            <Link
              key={doc.id}
              href="/studio"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F7F7F9] transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-[#111827] group-hover:text-[#5B45B2] transition-colors">
                    {doc.title}
                  </h4>
                  <p className="text-[11px] text-[#9CA3AF]">{doc.subtitle}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#D1D5DB] group-hover:text-[#6B7280] transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Assets Section */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-[#111827]">Recent Assets</h2>
          <Link
            href="/assets"
            className="text-xs text-[#6B7280] hover:text-[#111827] flex items-center gap-1 transition-colors"
          >
            <span>View all</span>
          </Link>
        </div>

        <div className="space-y-1">
          {recentAssets.map((asset) => (
            <Link
              key={asset.id}
              href="/assets"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F7F7F9] transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] shrink-0">
                  <File className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-[#111827] group-hover:text-[#5B45B2] transition-colors">
                    {asset.title}
                  </h4>
                  <p className="text-[11px] text-[#9CA3AF]">{asset.subtitle}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#D1D5DB] group-hover:text-[#6B7280] transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
