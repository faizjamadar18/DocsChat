'use client';
import React, { useCallback, useState } from 'react';
import ProtectedRoute from '../ProtectedRoute';
import { WorkspaceProvider, useWorkspace } from '../../context/WorkspaceContext';
import { VoiceAgentProvider } from '../../context/VoiceAgentContext';
import VoiceNotch from '../voice/VoiceNotch';
import Sidebar from './Sidebar';
import Header from './Header';
import EmptyWorkspaceGate from './EmptyWorkspaceGate';

function AppShell({
  children,
  mobileSidebarOpen,
  onCloseMobile,
  onOpenMobile,
}: {
  children: React.ReactNode;
  mobileSidebarOpen: boolean;
  onCloseMobile: () => void;
  onOpenMobile: () => void;
}) {
  const { currentWorkspace, workspaces, loading: workspacesLoading } = useWorkspace();

  // Zero-room gate: no rooms left (left/removed with nothing else) blocks
  // EVERY workspace tab at the shell — never a per-tab message, never a
  // forced modal, never onboarding again. /join, /login, /onboarding live
  // outside this shell and keep working.
  const roomless = !workspacesLoading && workspaces.length === 0;

  return (
    // Remount the entire workspace subtree on switch so no previous-workspace
    // state (docs, threads, recents, selections) survives. Providers above stay
    // mounted: no re-login, no reboot cost.
    <div
      key={currentWorkspace?.id ?? 'loading'}
      className="flex h-dvh w-full overflow-hidden bg-sidebar text-text-primary"
    >
      {/* Persistent Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={onCloseMobile}
        onOpenMobile={onOpenMobile}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden bg-sidebar">
        {/* Persistent Header */}
        <Header onToggleMobileSidebar={onOpenMobile} />

        {/* Scrollable Canvas / Workspace View */}
        <main className="flex-1 min-h-0 flex flex-col overflow-y-auto bg-surface rounded-none lg:rounded-tl-[20px] border-0 lg:border-t lg:border-l border-border/80 shadow-none lg:shadow-2xs">
          {roomless ? <EmptyWorkspaceGate /> : children}
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Stable identities: Header/Sidebar props don't churn per render
  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);
  const openMobileSidebar = useCallback(() => setMobileSidebarOpen(true), []);

  return (
    <ProtectedRoute>
      <WorkspaceProvider>
        <VoiceAgentProvider>
          <AppShell
            mobileSidebarOpen={mobileSidebarOpen}
            onCloseMobile={closeMobileSidebar}
            onOpenMobile={openMobileSidebar}
          >
            {children}
          </AppShell>
          {/* Ora voice bubble: tap-open, closes on outside tap / route change */}
          <VoiceNotch />
        </VoiceAgentProvider>
      </WorkspaceProvider>
    </ProtectedRoute>
  );
}
