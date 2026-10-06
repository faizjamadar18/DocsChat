'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import { PanelLeft, Search, Bell } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../hooks/useAuth';

export default function Header({
  onToggleMobileSidebar,
}: {
  onToggleMobileSidebar?: () => void;
}) {
  const pathname = usePathname();
  const { currentWorkspace, toggleSidebar } = useWorkspace();
  const { user } = useAuth();

  const workspaceName = currentWorkspace?.name || (user?.username ? `${user.username} HQ` : 'DocsChat HQ');

  // Compute breadcrumb segments
  const getBreadcrumbs = () => {
    const parts = [{ label: workspaceName, href: '/home' }];
    if (pathname?.startsWith('/studio')) {
      parts.push({ label: 'Studio', href: '/studio' });
    } else if (pathname?.startsWith('/assets')) {
      parts.push({ label: 'Assets', href: '/assets' });
    } else if (pathname?.startsWith('/settings')) {
      parts.push({ label: 'Settings', href: '/settings' });
    }
    return parts;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-14 px-4 sm:px-6 bg-[#FFFFFF] border-b border-[#ECECEE] flex items-center justify-between shrink-0 select-none">
      {/* Left side: Sidebar collapse toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Desktop Sidebar Toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          title="Toggle sidebar"
          className="hidden lg:flex p-1.5 rounded-md text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Mobile Sidebar Toggle */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          title="Open menu"
          className="lg:hidden p-1.5 rounded-md text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-[#6B7280] font-medium">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.href + idx}>
              {idx > 0 && <span className="text-[#9CA3AF] select-none">&rsaquo;</span>}
              <span
                className={
                  idx === breadcrumbs.length - 1
                    ? 'text-[#111827] font-semibold'
                    : 'hover:text-[#111827] transition-colors'
                }
              >
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right side: Search bar, Ora voice pill, Notification bell */}
      <div className="flex items-center gap-3">
        {/* Search input box */}
        <div className="relative hidden sm:flex items-center">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#FBFBFD] hover:border-[#D1D5DB] transition-colors w-44 md:w-56 cursor-text">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none text-xs text-[#111827] placeholder-[#9CA3AF] focus:outline-none w-full"
            />
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] text-[#6B7280] bg-[#FFFFFF] border border-[#ECECEE] rounded shadow-2xs font-sans">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Black Pill: ●● Ora */}
        <button
          type="button"
          className="bg-[#111113] hover:bg-black text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-all shadow-xs hover:shadow-sm"
          title="Ora Voice Assistant"
        >
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          </span>
          <span className="tracking-tight">Ora</span>
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
