/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useEffect, useRef, useState } from 'react';
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
  ArrowDown01Icon,
  ArrowUpDownIcon,
  Delete02Icon,
  Settings01Icon,
  Logout01Icon,
} from 'hugeicons-react';
import { usePathname as useSwitcherPathname, useRouter as useSwitcherRouter } from 'next/navigation';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../hooks/useAuth';
import { useChatThreads } from '../../hooks/useChatThreads';
import { useConfirm } from '../../context/ConfirmContext';

function WorkspaceTile({ name, logoUrl, size = 'md' }: { name: string; logoUrl?: string | null; size?: 'md' | 'sm' }) {
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

function WorkspaceSwitcher({ onSwitch }: { onSwitch?: () => void }) {
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace();
  const { user } = useAuth();
  const switcherPathname = useSwitcherPathname();
  const switcherRouter = useSwitcherRouter();
  const [open, setOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
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
    // A thread_id in the URL belongs to the previous workspace — drop it so
    // the remounted chat never opens another workspace's thread.
    if (switcherPathname?.startsWith('/playground')) {
      switcherRouter.replace('/playground');
    }
  };

  const rows = workspaces.length > 0
    ? workspaces
    : currentWorkspace
      ? [currentWorkspace]
      : [];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-2.5 min-w-0 hover:opacity-85 transition-opacity text-left w-full cursor-pointer"
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

      {open && (
        <div
          role="listbox"
          aria-label="Switch workspace"
          className="absolute top-full left-0 right-0 mt-1 min-w-56 bg-white rounded-xl shadow-lg border border-border p-1 z-30 animate-fade-in max-h-72 overflow-y-auto"
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
        </div>
      )}
    </div>
  );
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
  const { confirm } = useConfirm();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // The sidebar body renders twice (desktop + hidden mobile drawer), so each
  // copy needs its own menu ref. A single shared ref points at only the
  // last-mounted copy, making every click in the other copy look "outside".
  const userMenuRefDesktop = useRef<HTMLDivElement>(null);
  const userMenuRefMobile = useRef<HTMLDivElement>(null);

  // Close the profile menu on outside click or Escape.
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

  const handleNewChat = () => {
    router.push('/playground');
    onCloseMobile?.();
  };

  const navItems = [
    { label: 'Home', href: '/home', icon: Home01Icon },
    { label: 'Playground', href: '/playground', icon: CommandLineIcon },
    { label: 'Studio', href: '/studio', icon: NoteEditIcon },
    { label: 'Assets', href: '/assets', icon: Folder01Icon },
    { label: 'Connectors', href: '/connectors', icon: Plug01Icon },
    { label: 'MCP Server', href: '/mcp', icon: ServerStack01Icon },
  ];

  const content = (menuRef: React.RefObject<HTMLDivElement | null>) => (
    <aside
      className={`h-full w-64 bg-sidebar flex flex-col justify-between select-none transition-all duration-200 ${
        sidebarCollapsed ? 'lg:-ml-64' : 'lg:ml-0'
      }`}
    >
      {/* Top section: fixed header + New Chat, scrollable nav & history */}
      <div className="flex flex-col flex-1 min-h-0">
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-accent-subtle text-accent-hover'
                    : 'text-text-secondary hover:text-text-primary hover:bg-accent-subtle'
                }`}
              >
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
                            description: 'Delete this conversation? All associated messages and context will be permanently removed.',
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
        </div>
      </div>

      {/* User profile footer */}
      <div className="p-3 pb-safe border-t border-border/80 relative" ref={menuRef}>
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

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full shrink-0">
        {content(userMenuRefDesktop)}
      </div>

      {/* Mobile Off-Canvas Drawer with GPU slide transition */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ease-in-out ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!mobileOpen}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
        <div
          className={`absolute left-0 top-0 bottom-0 z-10 w-72 max-w-[85vw] bg-sidebar shadow-2xl transition-transform duration-300 ease-out transform ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {content(userMenuRefMobile)}
        </div>
      </div>
    </>
  );
}
