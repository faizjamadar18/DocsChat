'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
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
import { api } from '../../../lib/api';

interface RecentItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'document' | 'asset';
}

export default function HomePage() {
  const { user } = useAuth();

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
    async function loadData() {
      if (!user?.active_workspace_id) return;
      try {
        const data = await api.get(`/workspaces/${user.active_workspace_id}/dashboard`);
        if (data) {
          const assets: RecentItem[] = (data.recent_assets || []).map((a: { id: string; filename: string; file_size: number; uploaded_at: string }) => ({
            id: a.id,
            title: a.filename,
            subtitle: `${(a.file_size / 1024).toFixed(1)} KB • Added ${formatTimeAgo(a.uploaded_at)}`,
            type: 'asset',
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
        console.error("Failed to fetch dashboard data:", err);
      }
    }
    loadData();
  }, [user?.active_workspace_id]);

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
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          {getGreeting()}, {displayName}
        </h1>
        <p className="text-xs text-text-secondary mt-1 font-normal">
          Let&apos;s bring your ideas to life
        </p>
      </div>

      {/* Ask Ora Input Bar */}
      <div className="relative rounded-2xl bg-sidebar border border-border p-2 flex items-center gap-3 shadow-2xs hover:border-[#D1D5DB] transition-all">
        <div className="pl-3 flex items-center text-text-muted">
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
          type="text"
          value={askQuery}
          onChange={(e) => setAskQuery(e.target.value)}
          placeholder="Ask Ora anything... type @ to reference"
          className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted focus:outline-none"
        />
        <button
          type="button"
          className="w-8 h-8 rounded-xl bg-accent-hover/20 hover:bg-accent-hover/30 text-accent-hover flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="Send query"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>

      {/* Start Writing Action Card */}
      <Link
        href="/studio"
        className="flex items-center justify-between p-4 rounded-xl bg-sidebar hover:bg-[#EFEFF2] border border-border transition-colors cursor-pointer group"
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
                <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-text-secondary shrink-0">
                  <FileText className="w-4 h-4" />
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
                <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-text-secondary shrink-0">
                  <File className="w-4 h-4" />
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
    </div>
  );
}
