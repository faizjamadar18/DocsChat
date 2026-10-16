'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Plus,
  UploadCloud,
  Mic,
  MessageSquare,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  Home01Icon,
  NoteEditIcon,
  Folder01Icon,
  CommandLineIcon,
  Plug01Icon,
  ServerStack01Icon,
  Settings01Icon,
} from 'hugeicons-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useVoiceAgent } from '../../context/VoiceAgentContext';
import { FilenameIcon, StudioDocIcon } from '../connectors/ConnectorIcons';
import { api } from '../../lib/api';

const emptySubscribe = () => () => {};

interface SearchCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Quick Actions' | 'Settings' | 'Documents' | 'Assets' | 'Conversations' | 'AI';
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: string;
  action: () => void;
}

export default function SearchCommandPalette({
  isOpen,
  onClose,
}: SearchCommandPaletteProps) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const { startVoice } = useVoiceAgent();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Reset query/selection when the modal opens. Adjusted during render (not in
  // an effect) so server and client renders stay consistent.
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }

  // Dynamic workspace items
  const [docs, setDocs] = useState<{ id: string; title: string; updated_at?: string }[]>([]);
  const [assets, setAssets] = useState<{ id: string; filename: string; source_type?: string; file_size?: number }[]>([]);
  const [threads, setThreads] = useState<{ id: string; title: string }[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch workspace documents, assets, and chat threads when modal opens
  useEffect(() => {
    if (!isOpen || !currentWorkspace?.id) return;
    const wsId = currentWorkspace.id;
    let active = true;

    async function loadWorkspaceData() {
      try {
        const [docsRes, assetsRes, threadsRes] = await Promise.all([
          api.get(`/documents?workspace_id=${wsId}`).catch(() => ({ documents: [] })),
          api.get(`/sources?workspace_id=${wsId}`).catch(() => ({ sources: [] })),
          api.get(`/api/chat/threads?workspace_id=${wsId}&mode=universal`).catch(() => ({ threads: [] })),
        ]);

        if (!active) return;
        setDocs((docsRes.documents || []).slice(0, 10));
        setAssets((assetsRes.sources || []).slice(0, 10));
        setThreads((threadsRes.threads || []).slice(0, 8));
      } catch {
        // Best-effort background load
      }
    }

    void loadWorkspaceData();

    return () => {
      active = false;
    };
  }, [isOpen, currentWorkspace?.id]);

  // Focus input when modal opens (no state sync here — reset happens above)
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 30);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Global keyboard shortcut to toggle Command Palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open triggered from parent or event
          window.dispatchEvent(new CustomEvent('open-search-palette'));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Build the list of static and dynamic items
  const query = searchQuery.trim().toLowerCase();

  const allItems: CommandItem[] = [];

  // 1. AI Search action if user typed a query
  if (query) {
    allItems.push({
      id: 'ai-ask',
      category: 'AI',
      label: `Ask Quello: "${searchQuery.trim()}"`,
      subtitle: 'Ask AI assistant grounded in your workspace knowledge',
      icon: <Sparkles className="w-4 h-4 text-[#FF5533]" />,
      badge: '↵ Ask AI',
      action: () => {
        router.push(`/playground?q=${encodeURIComponent(searchQuery.trim())}`);
      },
    });
  }

  // 2. Navigation items
  const navigationItems: CommandItem[] = [
    {
      id: 'nav-home',
      category: 'Navigation',
      label: 'Home',
      subtitle: 'Dashboard, recents & quick draft',
      icon: <Home01Icon size={16} className="text-text-secondary" />,
      action: () => router.push('/home'),
    },
    {
      id: 'nav-studio',
      category: 'Navigation',
      label: 'Studio',
      subtitle: 'Document editor & AI writing canvas',
      icon: <NoteEditIcon size={16} className="text-text-secondary" />,
      action: () => router.push('/studio'),
    },
    {
      id: 'nav-assets',
      category: 'Navigation',
      label: 'Assets',
      subtitle: 'Manage PDFs, sources & connectors',
      icon: <Folder01Icon size={16} className="text-text-secondary" />,
      action: () => router.push('/assets'),
    },
    {
      id: 'nav-playground',
      category: 'Navigation',
      label: 'Playground',
      subtitle: 'RAG chat & multi-model research',
      icon: <CommandLineIcon size={16} className="text-text-secondary" />,
      action: () => router.push('/playground'),
    },
    {
      id: 'nav-connectors',
      category: 'Navigation',
      label: 'Connectors',
      subtitle: 'Notion, Google Drive, GitHub integration',
      icon: <Plug01Icon size={16} className="text-text-secondary" />,
      action: () => router.push('/connectors'),
    },
    {
      id: 'nav-mcp',
      category: 'Navigation',
      label: 'MCP Server',
      subtitle: 'Model Context Protocol endpoints & keys',
      icon: <ServerStack01Icon size={16} className="text-text-secondary" />,
      action: () => router.push('/mcp'),
    },
    {
      id: 'nav-settings',
      category: 'Navigation',
      label: 'Settings',
      subtitle: 'Account, workspace, theme & voice',
      icon: <Settings01Icon size={16} className="text-text-secondary" />,
      action: () => router.push('/settings'),
    },
  ];

  // 3. Quick Action items
  const quickActions: CommandItem[] = [
    {
      id: 'action-new-doc',
      category: 'Quick Actions',
      label: 'New Document',
      subtitle: 'Open blank document in Studio',
      icon: <Plus className="w-4 h-4 text-text-secondary" />,
      action: () => router.push('/studio'),
    },
    {
      id: 'action-upload-file',
      category: 'Quick Actions',
      label: 'Upload File',
      subtitle: 'Upload PDF to workspace assets',
      icon: <UploadCloud className="w-4 h-4 text-text-secondary" />,
      action: () => router.push('/assets'),
    },
    {
      id: 'action-new-chat',
      category: 'Quick Actions',
      label: 'New Chat',
      subtitle: 'Start a fresh conversation in Playground',
      icon: <MessageSquare className="w-4 h-4 text-text-secondary" />,
      action: () => router.push('/playground'),
    },
    {
      id: 'action-voice-agent',
      category: 'Quick Actions',
      label: 'Talk to Quello',
      subtitle: 'Launch real-time voice assistant',
      icon: <Mic className="w-4 h-4 text-text-secondary" />,
      action: () => {
        void startVoice();
      },
    },
  ];

  // 4. Settings Sub-items
  const settingsItems: CommandItem[] = [
    {
      id: 'settings-general',
      category: 'Settings',
      label: 'General & Profile',
      subtitle: 'Update your name, picture & email',
      icon: <Settings01Icon size={16} className="text-text-secondary" />,
      action: () => router.push('/settings?tab=account'),
    },
    {
      id: 'settings-workspace',
      category: 'Settings',
      label: 'Workspace Identity',
      subtitle: 'Configure logo, slug & members',
      icon: <Settings01Icon size={16} className="text-text-secondary" />,
      action: () => router.push('/settings?tab=workspace'),
    },
    {
      id: 'settings-voice',
      category: 'Settings',
      label: 'Voice Assistant BYOK',
      subtitle: 'Manage VAPI voice key & call logs',
      icon: <Mic className="w-4 h-4 text-text-secondary" />,
      action: () => router.push('/settings?tab=voice'),
    },
  ];

  // Filter static items by query
  const filteredNav = navigationItems.filter(
    (item) => !query || item.label.toLowerCase().includes(query) || item.subtitle?.toLowerCase().includes(query)
  );

  const filteredQuick = quickActions.filter(
    (item) => !query || item.label.toLowerCase().includes(query) || item.subtitle?.toLowerCase().includes(query)
  );

  const filteredSettings = settingsItems.filter(
    (item) => !query || item.label.toLowerCase().includes(query) || item.subtitle?.toLowerCase().includes(query)
  );

  // Dynamic Workspace Documents matching query
  const filteredDocs: CommandItem[] = docs
    .filter((doc) => !query || doc.title.toLowerCase().includes(query))
    .slice(0, 5)
    .map((doc) => ({
      id: `doc-${doc.id}`,
      category: 'Documents',
      label: doc.title || 'Untitled Document',
      subtitle: 'Studio Document',
      icon: <StudioDocIcon className="w-4 h-4" />,
      action: () => router.push('/studio'),
    }));

  // Dynamic Workspace Assets matching query
  const filteredAssets: CommandItem[] = assets
    .filter((asset) => !query || asset.filename.toLowerCase().includes(query))
    .slice(0, 5)
    .map((asset) => ({
      id: `asset-${asset.id}`,
      category: 'Assets',
      label: asset.filename,
      subtitle: 'Workspace Asset',
      icon: <FilenameIcon filename={asset.filename} sourceType={asset.source_type} className="w-4 h-4" />,
      action: () => router.push('/assets'),
    }));

  // Dynamic Chat Threads matching query
  const filteredThreads: CommandItem[] = threads
    .filter((thread) => !query || thread.title.toLowerCase().includes(query))
    .slice(0, 4)
    .map((thread) => ({
      id: `thread-${thread.id}`,
      category: 'Conversations',
      label: thread.title,
      subtitle: 'Chat Thread',
      icon: <MessageSquare className="w-4 h-4 text-text-secondary" />,
      action: () => router.push(`/playground?thread_id=${thread.id}`),
    }));

  // Combine items into ordered list
  allItems.push(
    ...filteredNav,
    ...filteredQuick,
    ...filteredDocs,
    ...filteredAssets,
    ...filteredThreads,
    ...filteredSettings
  );

  // Clamp the selection during render instead of syncing it in an effect.
  const clampedIndex =
    allItems.length === 0 ? 0 : Math.min(Math.max(selectedIndex, 0), allItems.length - 1);

  // Scroll active item into view
  useEffect(() => {
    const activeEl = document.getElementById(`command-item-${clampedIndex}`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [clampedIndex]);

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (allItems.length ? (prev + 1) % allItems.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (allItems.length ? (prev - 1 + allItems.length) % allItems.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allItems[clampedIndex];
      if (current) {
        current.action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen || !isMounted) return null;

  // Group items by category for rendering while preserving flat indexing
  let globalItemIndex = 0;
  const categories = Array.from(new Set(allItems.map((i) => i.category)));

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[12vh] px-3 sm:px-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-border overflow-hidden animate-fade-in flex flex-col max-h-[75vh]">
        {/* Top Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/70 shrink-0">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent border-none text-base sm:text-sm text-text-primary placeholder-text-muted focus:outline-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results & Categories List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-4">
          {allItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">
              No results found for &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            categories.map((category) => {
              const categoryItems = allItems.filter((i) => i.category === category);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category} className="space-y-1">
                  <div className="px-3 py-1 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    {category}
                  </div>
                  <div className="space-y-0.5">
                    {categoryItems.map((item) => {
                      const itemIndex = globalItemIndex++;
                      const isSelected = itemIndex === clampedIndex;

                      return (
                        <div
                          key={item.id}
                          id={`command-item-${itemIndex}`}
                          onClick={() => {
                            item.action();
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#F3F4F6] text-text-primary font-medium'
                              : 'text-text-secondary hover:bg-[#F3F4F6]/70 hover:text-text-primary'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="shrink-0 flex items-center justify-center">
                              {item.icon}
                            </div>
                            <div className="min-w-0 flex-1 truncate">
                              <span className="truncate block leading-tight">{item.label}</span>
                              {item.subtitle && (
                                <span className="text-[11px] text-text-muted truncate block leading-tight mt-0.5 font-normal">
                                  {item.subtitle}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {item.badge ? (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white border border-border text-text-secondary">
                                {item.badge}
                              </span>
                            ) : isSelected ? (
                              <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Footer Bar */}
        <div className="hidden sm:flex items-center justify-between px-4 py-2.5 bg-sidebar/50 border-t border-border/70 text-xs text-text-muted select-none shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 text-[10px] text-text-secondary bg-surface border border-border rounded shadow-2xs font-sans">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] text-text-secondary bg-surface border border-border rounded shadow-2xs font-sans">
                ↓
              </kbd>
              <span className="text-[11px] text-text-secondary">Navigate</span>
            </span>

            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 text-[10px] text-text-secondary bg-surface border border-border rounded shadow-2xs font-sans">
                ↵
              </kbd>
              <span className="text-[11px] text-text-secondary">Select</span>
            </span>

            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 text-[10px] text-text-secondary bg-surface border border-border rounded shadow-2xs font-sans">
                Esc
              </kbd>
              <span className="text-[11px] text-text-secondary">Close</span>
            </span>
          </div>

          <span className="text-[11px] font-medium text-text-muted hidden sm:inline">
            Quello Workspace
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
