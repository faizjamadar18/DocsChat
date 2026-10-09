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
  ChevronsUpDown,
  ChevronDown,
  LogOut,
  SquarePen,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../hooks/useAuth';
import { useChatThreads } from '../../hooks/useChatThreads';

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
      className={`h-full w-64 bg-sidebar flex flex-col justify-between select-none transition-all duration-200 ${
        sidebarCollapsed ? 'lg:-ml-64' : 'lg:ml-0'
      }`}
    >
      {/* Top section: Workspace header & Navigation */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Workspace Brand / Header */}
        <div className="h-14 px-4 flex items-center justify-between">
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

        {/* Chats section */}
        <div className="px-3 pt-3 flex-1 flex flex-col min-h-0">
          <div className="px-3 py-1 text-xs font-semibold text-text-muted">
            Chats
          </div>

          <button
            type="button"
            onClick={handleNewChat}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-text-primary hover:bg-[#EFEFF2] transition-colors cursor-pointer w-full text-left"
          >
            <SquarePen className="w-4 h-4 text-text-secondary shrink-0" />
            <span>New Chat</span>
          </button>

          <div className="mt-1 space-y-0.5 overflow-y-auto flex-1 pr-1">
            {threads.length === 0 ? (
              <div className="px-3 py-2 text-xs text-text-muted italic">
                No conversations yet
              </div>
            ) : (
              threads.map((thread) => {
                const isActive = pathname === '/playground' && currentThreadId === thread.id;
                return (
                  <div
                    key={thread.id}
                    onClick={() => {
                      router.push(`/playground?thread_id=${thread.id}`);
                      onCloseMobile?.();
                    }}
                    className={`group px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-[#EFEFF2] text-text-primary font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-[#EFEFF2]'
                    }`}
                  >
                    <span className="truncate flex-1 mr-2 leading-tight">
                      {thread.title}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      )}
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
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-600 rounded transition-all shrink-0 cursor-pointer"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
