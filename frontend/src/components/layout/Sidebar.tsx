/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Home01Icon,
  CommandLineIcon,
  NoteEditIcon,
  Folder01Icon,
  Plug01Icon,
  ServerStack01Icon,
  Edit02Icon,
  Add01Icon,
  SlidersHorizontalIcon,
  Cancel01Icon,
  ArrowDown01Icon,
  ArrowUpDownIcon,
  Delete02Icon,
  Settings01Icon,
  Logout01Icon,
} from 'hugeicons-react';
import {
  MessageSquare,
} from 'lucide-react';
import { usePathname as useSwitcherPathname, useRouter as useSwitcherRouter } from 'next/navigation';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../hooks/useAuth';
import { useChatThreads } from '../../hooks/useChatThreads';
import { useConfirm } from '../../context/ConfirmContext';
import CreateWorkspaceModal from '../workspaces/CreateWorkspaceModal';

function WorkspaceTile({
  name,
  logoUrl,
  size = 'md',
}: {
  name: string;
  logoUrl?: string | null;
  size?: 'md' | 'sm';
}) {
  const dims = size === 'sm' ? 'w-6 h-6 rounded-md' : 'w-7 h-7 rounded-lg';
  return (
    <div className={`${dims} bg-[#111113] text-white flex items-center justify-center text-[11px] font-bold shrink-0 overflow-hidden shadow-xs`}>
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        (name || 'W').charAt(0).toUpperCase()
      )}
    </div>
  );
}

function WorkspaceSwitcher({
  onSwitch,
  collapsed = false,
  onMouseEnter,
  onMouseLeave,
}: {
  onSwitch?: () => void;
  collapsed?: boolean;
  onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: () => void;
}) {
  const { workspaces, currentWorkspace, switchWorkspace, loading } = useWorkspace();
  const { user } = useAuth();
  const switcherPathname = useSwitcherPathname();
  const switcherRouter = useSwitcherRouter();
  const [open, setOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const workspaceName =
    currentWorkspace?.name || (user?.username ? `${user.username} HQ` : 'Quello HQ');

  const handleSwitch = async (id: string) => {
    if (id === currentWorkspace?.id || switchingId) return;
    setSwitchingId(id);
    try {
      await switchWorkspace(id);
    } finally {
      setSwitchingId(null);
    }
    setOpen(false);
    onSwitch?.();
    if (switcherPathname?.startsWith('/playground')) {
      switcherRouter.replace('/playground');
    }
  };

  const rows = workspaces.length > 0
    ? workspaces
    : currentWorkspace
      ? [currentWorkspace]
      : [];

  if (!loading && workspaces.length === 0) {
    if (collapsed) {
      return (
        <div
          className="w-9 h-9 rounded-lg bg-sidebar border border-border flex items-center justify-center shrink-0 cursor-default"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <span className="text-[11px] font-semibold text-text-muted">–</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2.5 min-w-0 w-full cursor-default">
        <div className="w-6 h-6 rounded-md bg-sidebar border border-border flex items-center justify-center shrink-0">
          <span className="text-[11px] font-semibold text-text-muted">–</span>
        </div>
        <span className="text-sm font-medium text-text-muted truncate flex-1">
          No workspaces
        </span>
      </div>
    );
  }

  const dropdownContent = open && (
    <div
      role="listbox"
      aria-label="Switch workspace"
      className={`absolute min-w-56 bg-white rounded-xl shadow-xl border border-border p-1 z-50 animate-fade-in max-h-72 overflow-y-auto ${
        collapsed ? 'left-full top-0 ml-3' : 'top-full left-0 right-0 mt-1'
      }`}
    >
      <p className="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        Workspaces
      </p>
      {rows.map((ws) => {
        const isActive = ws.id === currentWorkspace?.id;
        const isSwitching = switchingId === ws.id;
        return (
          <button
            key={ws.id}
            type="button"
            role="option"
            aria-selected={isActive}
            disabled={switchingId !== null}
            onClick={() => void handleSwitch(ws.id)}
            className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors disabled:cursor-default ${
              isActive ? 'bg-accent-subtle' : 'hover:bg-accent-subtle'
            }`}
          >
            <WorkspaceTile name={ws.name} logoUrl={ws.logo_url} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-text-primary truncate leading-tight">
                {ws.name}
                {ws.role && ws.role !== 'owner' && (
                  <span className="ml-1.5 inline-flex items-center px-1.5 py-px rounded-full bg-accent-soft text-accent text-[10px] font-medium align-middle">
                    {ws.role === 'editor' ? 'Shared • Editor' : 'Shared'}
                  </span>
                )}
              </span>
              <span className="block text-[11px] text-text-muted truncate leading-tight">
                quello.app/{ws.slug}
              </span>
            </span>
            {isSwitching ? (
              <span className="w-3.5 h-3.5 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin shrink-0" />
            ) : (
              isActive && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-accent-hover shrink-0"
                  aria-hidden="true"
                >
                  <path d="M5 12l4 4 10-10" />
                </svg>
              )
            )}
          </button>
        );
      })}

      {/* Workspace actions */}
      <div role="separator" className="mx-1 my-1 border-t border-border/80" />
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setShowCreate(true);
        }}
        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left text-xs font-medium text-text-primary hover:bg-accent-subtle transition-colors cursor-pointer"
      >
        <span className="w-6 h-6 rounded-md border border-border bg-sidebar flex items-center justify-center shrink-0">
          <Add01Icon size={14} className="text-text-primary" />
        </span>
        <span className="flex-1 truncate">Create new workspace</span>
      </button>
      <Link
        href="/settings?tab=workspace"
        onClick={() => {
          setOpen(false);
          onSwitch?.();
        }}
        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left text-xs font-medium text-text-primary hover:bg-accent-subtle transition-colors cursor-pointer"
      >
        <span className="w-6 h-6 flex items-center justify-center shrink-0">
          <SlidersHorizontalIcon size={15} className="text-text-primary" />
        </span>
        <span className="flex-1 truncate">Settings &amp; members</span>
      </Link>
    </div>
  );

  const createWorkspaceModal = (
    <CreateWorkspaceModal open={showCreate} onClose={() => setShowCreate(false)} />
  );

  if (collapsed) {
    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => {
            onMouseLeave?.();
            setOpen((prev) => !prev);
          }}
          aria-expanded={open}
          aria-haspopup="listbox"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-accent-subtle transition-colors cursor-pointer"
        >
          {currentWorkspace?.logo_url ? (
            <div className="w-7 h-7 rounded-lg bg-[#111113] flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
              <img
                src={currentWorkspace.logo_url}
                alt={workspaceName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-[#111113] flex items-center justify-center shrink-0 shadow-xs overflow-hidden text-white font-bold text-xs">
              {workspaceName.charAt(0).toUpperCase()}
            </div>
          )}
        </button>
        {dropdownContent}
        {createWorkspaceModal}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-2.5 pl-2 min-w-0 hover:opacity-85 transition-opacity text-left w-full cursor-pointer"
      >
        {currentWorkspace?.logo_url ? (
          <div className="w-6 h-6 rounded-md bg-[#111113] flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
            <img
              src={currentWorkspace.logo_url}
              alt={workspaceName}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-md bg-[#111113] flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
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
          </div>
        )}

        <span className="text-sm font-semibold text-text-primary truncate flex-1">
          {workspaceName}
        </span>

        <ArrowDown01Icon
          size={14}
          className={`text-text-muted shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {dropdownContent}
      {createWorkspaceModal}
    </div>
  );
}

interface TooltipData {
  label: string;
  sublabel?: string;
  shortcut?: string;
  top: number;
  left: number;
}

export default function Sidebar({
  mobileOpen,
  onCloseMobile,
  onOpenMobile,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenMobile?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentThreadId = searchParams.get('thread_id');

  const { currentWorkspace, sidebarCollapsed, toggleSidebar } = useWorkspace();
  const { user, logout } = useAuth();
  const { threads, deleteThread } = useChatThreads(currentWorkspace?.id, 'universal');
  const { confirm } = useConfirm();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [collapsedChatsOpen, setCollapsedChatsOpen] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const userMenuRefDesktop = useRef<HTMLDivElement>(null);
  const userMenuRefMobile = useRef<HTMLDivElement>(null);
  const collapsedChatsRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: ⌘B / Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        setTooltip(null);
        // ⌘B is responsive: on narrow viewports it toggles the mobile drawer,
        // never the hidden desktop rail (whose collapse state would otherwise
        // re-layout the desktop tree invisibly in the background).
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          if (mobileOpen) onCloseMobile?.();
          else onOpenMobile?.();
        } else {
          toggleSidebar();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, mobileOpen, onOpenMobile, onCloseMobile]);

  // Close menus on outside click or Escape
  useEffect(() => {
    if (!userMenuOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const inDesktop = userMenuRefDesktop.current?.contains(target);
      const inMobile = userMenuRefMobile.current?.contains(target);
      if (!inDesktop && !inMobile) {
        setUserMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    if (!collapsedChatsOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (collapsedChatsRef.current && !collapsedChatsRef.current.contains(e.target as Node)) {
        setCollapsedChatsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCollapsedChatsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [collapsedChatsOpen]);

  // Close the mobile drawer on Escape (platform drawer behavior)
  useEffect(() => {
    if (!mobileOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile?.();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [mobileOpen, onCloseMobile]);

  const showTooltip = (label: string, sublabel?: string, shortcut?: string) => {
    return (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({
        label,
        sublabel,
        shortcut,
        top: rect.top + rect.height / 2,
        left: rect.right + 10,
      });
    };
  };

  const hideTooltip = () => {
    setTooltip(null);
  };

  const handleNewChat = () => {
    hideTooltip();
    setCollapsedChatsOpen(false);
    router.push('/playground');
    onCloseMobile?.();
  };

  const navItems = [
    { label: 'Home', href: '/home', icon: Home01Icon, description: 'Overview and recents' },
    { label: 'Playground', href: '/playground', icon: CommandLineIcon, description: 'Chat with AI and documents' },
    { label: 'Studio', href: '/studio', icon: NoteEditIcon, description: 'AI document editor' },
    { label: 'Assets', href: '/assets', icon: Folder01Icon, description: 'Upload and manage files' },
    { label: 'Connectors', href: '/connectors', icon: Plug01Icon, description: 'Notion, Drive, and GitHub' },
    { label: 'MCP Server', href: '/mcp', icon: ServerStack01Icon, description: 'External MCP integrations' },
  ];

  const workspaceName =
    currentWorkspace?.name || (user?.username ? `${user.username} HQ` : 'Quello HQ');

  const renderSidebar = (
    isCollapsed: boolean,
    menuRef: React.RefObject<HTMLDivElement | null>,
    mobile = false
  ) => {
    // Content is re-keyed so it remounts and fades in each switch, while the
    // rail/full width transitions — masks the instantaneous subtree swap.
    const stateKey = isCollapsed ? 'rail' : 'expanded';

    if (isCollapsed) {
      return (
        <aside
          className="h-full w-16 bg-sidebar flex flex-col justify-between select-none py-3 transition-[width] duration-200 ease-in-out relative overflow-hidden"
        >
          {/* Top section: Workspace icon, New Chat */}
          <div key={`${stateKey}-top`} className="flex flex-col items-center gap-1 shrink-0 animate-fade-in">
            {/* Workspace Switcher */}
            <WorkspaceSwitcher
              collapsed
              onSwitch={onCloseMobile}
              onMouseEnter={showTooltip(workspaceName, 'Switch workspace')}
              onMouseLeave={hideTooltip}
            />

            {/* New Chat Button */}
            <button
              type="button"
              onClick={handleNewChat}
              onMouseEnter={showTooltip('New Chat', 'Start a new conversation')}
              onMouseLeave={hideTooltip}
              aria-label="New chat"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-accent-subtle transition-colors cursor-pointer"
            >
              <Edit02Icon size={16} />
            </button>
          </div>

          {/* Middle Nav Items */}
          <div key={`${stateKey}-mid`} className="flex-1 flex flex-col items-center gap-1 py-2 animate-fade-in">
            <nav className="flex flex-col items-center gap-1 w-full">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/home' && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      hideTooltip();
                      onCloseMobile?.();
                    }}
                    onMouseEnter={showTooltip(item.label, item.description)}
                    onMouseLeave={hideTooltip}
                    aria-label={item.label}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer relative ${
                      isActive
                        ? 'bg-accent-subtle text-accent-hover font-medium shadow-2xs'
                        : 'text-text-secondary hover:text-text-primary hover:bg-accent-subtle'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-accent rounded-r-full" />
                    )}
                    <Icon
                      size={16}
                      className={`shrink-0 ${
                        isActive ? 'text-accent-hover' : 'text-text-secondary'
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Recent Chats flyout trigger */}
            <div ref={collapsedChatsRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  hideTooltip();
                  setCollapsedChatsOpen((prev) => !prev);
                }}
                onMouseEnter={showTooltip(
                  'Recent Chats',
                  `${threads.length} conversation${threads.length === 1 ? '' : 's'}`
                )}
                onMouseLeave={hideTooltip}
                aria-label="Recent chats"
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer relative ${
                  collapsedChatsOpen || (pathname === '/playground' && currentThreadId)
                    ? 'bg-accent-subtle text-accent-hover font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-accent-subtle'
                }`}
              >
                <MessageSquare size={16} />
                {threads.length > 0 && (
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </button>

              {/* Flyout for Chats in collapsed mode */}
              {collapsedChatsOpen && (
                <div className="absolute left-full bottom-0 ml-3 w-72 bg-white rounded-2xl shadow-xl border border-border p-2 z-50 animate-fade-in max-h-96 flex flex-col">
                  <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/80 shrink-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                      Recent Chats ({threads.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCollapsedChatsOpen(false);
                        handleNewChat();
                      }}
                      className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                      title="New conversation"
                    >
                      <Edit02Icon size={14} />
                    </button>
                  </div>

                  <div className="overflow-y-auto space-y-0.5 mt-1 pr-1 flex-1">
                    {threads.length === 0 ? (
                      <div className="px-3 py-6 text-center text-xs text-text-muted italic">
                        No conversations yet
                      </div>
                    ) : (
                      threads.map((thread) => {
                        const isActive =
                          pathname === '/playground' && currentThreadId === thread.id;
                        return (
                          <div
                            key={thread.id}
                            onClick={() => {
                              setCollapsedChatsOpen(false);
                              router.push(`/playground?thread_id=${thread.id}`);
                              onCloseMobile?.();
                            }}
                            className={`group px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                              isActive
                                ? 'bg-accent-subtle text-text-primary font-medium'
                                : 'text-text-secondary hover:text-text-primary hover:bg-accent-subtle'
                            }`}
                          >
                            <span className="truncate flex-1 mr-2 leading-tight">
                              {thread.title}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {isActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                              )}
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const ok = await confirm({
                                    title: 'Delete Conversation',
                                    description:
                                      'Delete this conversation? All associated messages and context will be permanently removed.',
                                    confirmLabel: 'Delete',
                                    variant: 'danger',
                                  });
                                  if (ok) {
                                    void deleteThread(thread.id);
                                    if (currentThreadId === thread.id) {
                                      router.push('/playground');
                                    }
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-600 rounded transition-all shrink-0 cursor-pointer"
                                title="Delete chat"
                              >
                                <Delete02Icon size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom user profile icon */}
          <div key={`${stateKey}-foot`} className="pt-2 flex flex-col items-center relative animate-fade-in" ref={menuRef}>
            <button
              type="button"
              onClick={() => {
                hideTooltip();
                setUserMenuOpen(!userMenuOpen);
              }}
              onMouseEnter={showTooltip(
                user?.username || 'Account',
                user?.email || 'Settings & sign out'
              )}
              onMouseLeave={hideTooltip}
              aria-label="User account"
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-accent-subtle cursor-pointer transition-colors"
            >
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
            </button>

            {/* Dropdown Menu (anchored to right) */}
            {userMenuOpen && (
              <div className="absolute bottom-0 left-full ml-3 bg-white rounded-xl shadow-xl border border-border p-1 z-50 animate-fade-in min-w-48">
                <div className="px-3 py-2 border-b border-border/80 mb-1">
                  <p className="text-xs font-semibold text-text-primary truncate leading-tight">
                    {user?.username || 'user'}
                  </p>
                  <p className="text-[11px] text-text-secondary truncate leading-tight">
                    {user?.email || ''}
                  </p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onCloseMobile?.();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-sidebar rounded-lg transition-colors"
                >
                  <Settings01Icon size={14} className="text-text-secondary" />
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
                  <Logout01Icon size={14} className="text-red-600" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </aside>
      );
    }

    // Expanded Sidebar (Full w-64; fills the whole mobile drawer panel)
    return (
      <aside className={`h-full ${mobile ? 'w-full' : 'w-64'} bg-sidebar flex flex-col justify-between select-none transition-[width] duration-200 ease-in-out relative overflow-hidden`}>
        {/* Top section: fixed header + New Chat, scrollable nav & history */}
        <div key={`${stateKey}-top`} className="flex flex-col flex-1 min-h-0 animate-fade-in">
          {/* Mobile drawer: explicit close affordance (ChatGPT/Claude pattern) */}
          {mobile && (
            <div className="flex items-center justify-end px-3 pt-2 pb-1">
              <button
                type="button"
                onClick={onCloseMobile}
                title="Close menu"
                aria-label="Close menu"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-accent-subtle transition-colors cursor-pointer"
              >
                <Cancel01Icon size={16} />
              </button>
            </div>
          )}

          {/* Workspace Brand / Switcher */}
          <div className="px-4 py-3 shrink-0">
            <WorkspaceSwitcher onSwitch={onCloseMobile} />
          </div>

          {/* New Chat — fixed at top, always visible */}
          <div className="px-3 pt-1 pb-2 shrink-0">
            <button
              type="button"
              onClick={handleNewChat}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-accent-subtle transition-colors cursor-pointer w-full text-left"
            >
              <Edit02Icon size={16} className="text-text-secondary shrink-0" />
              <span>New Chat</span>
            </button>
          </div>

          {/* Scrollable middle: navigation + history */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* Navigation list */}
            <nav className="px-3 pb-1 space-y-1">
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
                    className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-accent-subtle text-accent-hover'
                        : 'text-text-secondary hover:text-text-primary hover:bg-accent-subtle'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-accent rounded-r-full" />
                    )}
                    <Icon
                      size={16}
                      className={`shrink-0 ${
                        isActive ? 'text-accent-hover' : 'text-text-secondary'
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Chats section */}
            <div className="px-3 pt-3">
              <div className="px-3 py-1 text-xs font-semibold text-text-muted">
                Chats
              </div>

              <div className="mt-1 space-y-0.5 pr-1">
                {threads.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-text-muted italic">
                    No conversations yet
                  </div>
                ) : (
                  threads.map((thread) => {
                    const isActive =
                      pathname === '/playground' && currentThreadId === thread.id;
                    return (
                      <div
                        key={thread.id}
                        onClick={() => {
                          router.push(`/playground?thread_id=${thread.id}`);
                          onCloseMobile?.();
                        }}
                        className={`group px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                          isActive
                            ? 'bg-accent-subtle text-text-primary font-medium'
                            : 'text-text-secondary hover:text-text-primary hover:bg-accent-subtle'
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
                            onClick={async (e) => {
                              e.stopPropagation();
                              const ok = await confirm({
                                title: 'Delete Conversation',
                                description:
                                  'Delete this conversation? All associated messages and context will be permanently removed.',
                                confirmLabel: 'Delete',
                                variant: 'danger',
                              });
                              if (ok) {
                                void deleteThread(thread.id);
                                if (currentThreadId === thread.id) {
                                  router.push('/playground');
                                }
                              }
                            }}
                            className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-0.5 hover:text-red-600 rounded transition-all shrink-0 cursor-pointer"
                            title="Delete chat"
                          >
                            <Delete02Icon size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User profile footer */}
        <div key={`${stateKey}-foot`} className="p-3 pb-safe relative animate-fade-in" ref={menuRef}>
          <div
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-accent-subtle cursor-pointer transition-colors"
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

            <ArrowUpDownIcon size={14} className="text-text-muted shrink-0 ml-1" />
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
                <Settings01Icon size={14} className="text-text-secondary" />
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
                <Logout01Icon size={14} className="text-red-600" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full shrink-0">
        {renderSidebar(sidebarCollapsed, userMenuRefDesktop)}
      </div>

      {/* Mobile Off-Canvas Drawer — the wrapper NEVER animates opacity: an
          ancestor with opacity<1 becomes a CSS "backdrop root", which makes the
          scrim's backdrop-filter sample nothing mid-animation (the blur pop).
          Instead the scrim interpolates its color + blur radius directly, and
          the panel slides at full opacity, blur perfectly synced to the slide. */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!mobileOpen}
      >
        <div
          className={`absolute inset-0 transition-[background-color,backdrop-filter] duration-300 ease-out ${
            mobileOpen
              ? 'bg-black/40 backdrop-blur-xs'
              : 'bg-black/0 backdrop-blur-[0px]'
          }`}
          onClick={onCloseMobile}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Workspace navigation"
          className={`absolute left-0 top-0 bottom-0 z-10 w-72 max-w-[85vw] bg-sidebar shadow-2xl transform-gpu transition-transform duration-300 ease-out overscroll-contain ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {renderSidebar(false, userMenuRefMobile, true)}
        </div>
      </div>

      {/* Hover Tooltip Portal for Collapsed Rail */}
      {typeof document !== 'undefined' && tooltip && createPortal(
        <div
          style={{
            position: 'fixed',
            top: tooltip.top,
            left: tooltip.left,
            transform: 'translateY(-50%)',
          }}
          className="z-9999 pointer-events-none px-2.5 py-1.5 bg-text-primary text-white rounded-lg shadow-xl animate-fade-in flex flex-col gap-0.5 select-none whitespace-nowrap"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold leading-tight">{tooltip.label}</span>
            {tooltip.shortcut && (
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-white/20 text-white rounded leading-none">
                {tooltip.shortcut}
              </kbd>
            )}
          </div>
          {tooltip.sublabel && (
            <span className="text-[10px] text-white/70 leading-tight">
              {tooltip.sublabel}
            </span>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
