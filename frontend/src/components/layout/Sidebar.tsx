/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Home,
  Sparkles,
  FileEdit,
  Folder,
  Plug2,
  Server,
  Settings,
  ChevronDown,
  ChevronsUpDown,
  LogOut,
  MessageSquare,
  Plus,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../hooks/useAuth';
import { useChatThreads } from '../../hooks/useChatThreads';
import { useVoiceLogs } from '../../hooks/useVoiceLogs';
import type { VoiceLog } from '../../hooks/useVoiceLogs';
import VoiceLogModal from '../voice/VoiceLogModal';

function isToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  try {
    const clean = !dateStr.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(dateStr) ? `${dateStr}Z` : dateStr;
    const d = new Date(clean);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  } catch {
    return false;
  }
}

function formatShortTime(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const clean = !dateStr.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(dateStr) ? `${dateStr}Z` : dateStr;
    const date = new Date(clean);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(Math.max(0, diffMs / 1000) / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMin < 1) return 'now';
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function Sidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentThreadId = searchParams.get('thread_id');

  const { currentWorkspace, sidebarCollapsed } = useWorkspace();
  const { user, logout } = useAuth();
  const { threads, deleteThread } = useChatThreads(currentWorkspace?.id, 'universal');
  const { logs: voiceLogs, deleteLog: deleteVoiceLog } = useVoiceLogs(currentWorkspace?.id);

  const [chatsOpen, setChatsOpen] = useState(true);
  const [voiceOpen, setVoiceOpen] = useState(true);
  const [selectedVoiceLog, setSelectedVoiceLog] = useState<VoiceLog | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleNewChat = () => {
    router.push('/playground');
    onCloseMobile?.();
  };

  const navItems = [
    { label: 'Home', href: '/home', icon: Home },
    { label: 'Ora', href: '/playground', icon: Sparkles },
    { label: 'Studio', href: '/studio', icon: FileEdit },
    { label: 'Assets', href: '/assets', icon: Folder },
    { label: 'Connectors', href: '/connectors', icon: Plug2 },
    { label: 'MCP Server', href: '/mcp', icon: Server },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const workspaceName = currentWorkspace?.name || (user?.username ? `${user.username} HQ` : 'DocsChat HQ');

  const content = (
    <aside
      className={`h-full w-64 bg-sidebar border-r border-border flex flex-col justify-between select-none transition-all duration-200 ${
        sidebarCollapsed ? 'lg:-ml-64' : 'lg:ml-0'
      }`}
    >
      {/* Top section: Workspace header & Navigation */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Workspace Brand / Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-border/60">
          <button
            type="button"
            className="flex items-center gap-2.5 min-w-0 hover:opacity-85 transition-opacity text-left w-full cursor-pointer"
          >
            {/* Logo Mark: rounded black square with custom orange/red ribbon motif */}
            <div className="w-6 h-6 rounded-md bg-[#111113] flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
              {currentWorkspace?.logo_url ? (
                <img
                  src={currentWorkspace.logo_url}
                  alt={workspaceName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  width="14"
                  height="14"
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
              )}
            </div>

            <span className="text-sm font-semibold text-text-primary truncate flex-1">
              {workspaceName}
            </span>

            <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/home' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-accent-subtle text-accent-hover'
                    : 'text-text-secondary hover:text-text-primary hover:bg-[#EFEFF2]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-accent-hover' : 'text-text-secondary'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Collapsible CHATS section */}
        <div className="px-3 pt-3 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-3 py-1.5">
            <button
              type="button"
              onClick={() => setChatsOpen(!chatsOpen)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted tracking-wider uppercase hover:text-text-primary transition-colors cursor-pointer"
            >
              <span>CHATS</span>
              <ChevronDown
                className={`w-3 h-3 text-text-muted transition-transform duration-200 ${
                  chatsOpen ? '' : '-rotate-90'
                }`}
              />
            </button>
            <button
              type="button"
              onClick={handleNewChat}
              title="New Chat"
              className="p-1 rounded-md hover:bg-[#EFEFF2] text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {chatsOpen && (
            <div className="mt-1 space-y-3 overflow-y-auto max-h-72 pr-1">
              {threads.length === 0 ? (
                <div className="px-3 py-2 text-xs text-text-muted italic">
                  No conversations yet
                </div>
              ) : (
                <>
                  {(() => {
                    const todayThreads = threads.filter((t) => isToday(t.updated_at || t.created_at));
                    const olderThreads = threads.filter((t) => !isToday(t.updated_at || t.created_at));
                    const renderThreadRow = (thread: (typeof threads)[number]) => {
                      const isActive = pathname === '/playground' && currentThreadId === thread.id;
                      return (
                        <div
                          key={thread.id}
                          onClick={() => {
                            router.push(`/playground?thread_id=${thread.id}`);
                            onCloseMobile?.();
                          }}
                          className={`group px-3 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between cursor-pointer ${
                            isActive
                              ? 'bg-accent-subtle text-accent-hover font-medium'
                              : 'text-text-secondary hover:text-text-primary hover:bg-[#EFEFF2]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
                            <MessageSquare
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isActive ? 'text-accent-hover' : 'text-text-muted'
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <span className="truncate block leading-tight">{thread.title}</span>
                              {thread.attached_scope && (
                                <span className="truncate block text-[10px] text-text-muted leading-tight mt-0.5">
                                  {thread.attached_scope.title}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            <span className="text-[10px] text-text-muted">
                              {formatShortTime(thread.updated_at || thread.created_at)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete this conversation?')) {
                                  void deleteThread(thread.id);
                                  if (currentThreadId === thread.id) {
                                    router.push('/playground');
                                  }
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 rounded transition-all shrink-0 cursor-pointer"
                              title="Delete chat"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    };
                    return (
                      <>
                        {todayThreads.length > 0 && (
                          <div>
                            <div className="px-3 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                              Today
                            </div>
                            <div className="space-y-0.5">{todayThreads.map(renderThreadRow)}</div>
                          </div>
                        )}
                        {olderThreads.length > 0 && (
                          <div>
                            <div className="px-3 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                              Older
                            </div>
                            <div className="space-y-0.5">{olderThreads.map(renderThreadRow)}</div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          )}
        </div>

        {/* Separate VOICE LOGS section (voice history never mixes with text chats) */}
        <div className="px-3 pt-2 flex flex-col min-h-0 shrink-0">
          <div className="flex items-center justify-between px-3 py-1.5">
            <button
              type="button"
              onClick={() => setVoiceOpen(!voiceOpen)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted tracking-wider uppercase hover:text-text-primary transition-colors cursor-pointer"
            >
              <span>VOICE LOGS</span>
              <ChevronDown
                className={`w-3 h-3 text-text-muted transition-transform duration-200 ${
                  voiceOpen ? '' : '-rotate-90'
                }`}
              />
            </button>
            {voiceLogs.length > 0 ? (
              <span className="text-[10px] text-text-muted">{voiceLogs.length}</span>
            ) : null}
          </div>

          {voiceOpen && (
            <div className="mt-1 space-y-0.5 overflow-y-auto max-h-40 pr-1">
              {voiceLogs.length === 0 ? (
                <div className="px-3 py-2 text-xs text-text-muted italic">
                  No voice chats yet — tap ●● Ora to talk
                </div>
              ) : (
                voiceLogs.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    title="Click to view full conversation"
                    onClick={() => setSelectedVoiceLog(log)}
                    className="group px-3 py-1.5 rounded-md text-xs text-text-secondary hover:text-text-primary hover:bg-[#EFEFF2] transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 text-text-muted" />
                      <div className="min-w-0 flex-1">
                        <span className="truncate block leading-tight">{log.title}</span>
                        <span className="block text-[10px] text-text-muted leading-tight mt-0.5">
                          {log.duration_seconds}s · {formatShortTime(log.created_at)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void deleteVoiceLog(log.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 rounded transition-all shrink-0 cursor-pointer"
                      title="Delete voice log"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* User profile footer */}
      <div className="p-3 border-t border-border/80 relative">
        <div
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-[#EFEFF2] cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar */}
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.username || 'User'}
                className="w-7 h-7 rounded-full object-cover shrink-0 border border-border-subtle"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-text-primary text-white flex items-center justify-center text-xs font-semibold shrink-0">
                {(user?.username || 'U')[0].toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-text-primary truncate leading-tight">
                {user?.username || 'user'}
              </p>
              <p className="text-[11px] text-text-secondary truncate leading-tight">
                {user?.email || ''}
              </p>
            </div>
          </div>

          <ChevronsUpDown className="w-3.5 h-3.5 text-text-muted shrink-0 ml-1" />
        </div>

        {/* Dropdown Menu */}
        {userMenuOpen && (
          <div className="absolute bottom-16 left-3 right-3 bg-white rounded-xl shadow-lg border border-border p-1 z-30 animate-fade-in">
            <Link
              href="/settings"
              onClick={() => {
                setUserMenuOpen(false);
                onCloseMobile?.();
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-sidebar rounded-lg transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-text-secondary" />
              Settings
            </Link>
            <button
              type="button"
              onClick={() => {
                setUserMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-red-600" />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Full voice conversation viewer (key-remount resets copy state per log) */}
      <VoiceLogModal
        key={selectedVoiceLog?.id ?? 'closed'}
        log={selectedVoiceLog}
        onClose={() => setSelectedVoiceLog(null)}
        onDelete={(id) => {
          void deleteVoiceLog(id);
          setSelectedVoiceLog(null);
        }}
      />
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full shrink-0">
        {content}
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="absolute left-0 top-0 bottom-0 z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
