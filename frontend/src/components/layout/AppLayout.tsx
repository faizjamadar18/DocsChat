'use client';
import React, { useState } from 'react';
import ProtectedRoute from '../ProtectedRoute';
import { WorkspaceProvider, useWorkspace } from '../../context/WorkspaceContext';
import { VoiceAgentProvider } from '../../context/VoiceAgentContext';
import VoiceNotch from '../voice/VoiceNotch';
import Sidebar from './Sidebar';
import Header from './Header';

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
  const { currentWorkspace } = useWorkspace();

  return (
    // Remount the entire workspace subtree on switch so no previous-workspace
    // state (docs, threads, recents, selections) survives. Providers above stay
    // mounted: no re-login, no reboot cost.
    <div
      key={currentWorkspace?.id ?? 'loading'}
      className="flex h-dvh w-screen overflow-hidden bg-sidebar text-text-primary"
    >
      {/* Persistent Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={onCloseMobile}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden bg-sidebar">
        {/* Persistent Header */}
        <Header onToggleMobileSidebar={onOpenMobile} />

        {/* Scrollable Canvas / Workspace View */}
        <main className="flex-1 min-h-0 flex flex-col overflow-y-auto bg-surface rounded-none lg:rounded-tl-[20px] border-0 lg:border-t lg:border-l border-border/80 shadow-none lg:shadow-2xs">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <WorkspaceProvider>
        <VoiceAgentProvider>
          <AppShell
            mobileSidebarOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
            onOpenMobile={() => setMobileSidebarOpen(true)}
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
