'use client';
import React, { useState } from 'react';
import ProtectedRoute from '../ProtectedRoute';
import { WorkspaceProvider } from '../../context/WorkspaceContext';
import { VoiceAgentProvider } from '../../context/VoiceAgentContext';
import VoiceNotch from '../voice/VoiceNotch';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <WorkspaceProvider>
        <VoiceAgentProvider>
          <div className="flex h-screen w-screen overflow-hidden bg-base text-text-primary">
            {/* Persistent Sidebar */}
            <Sidebar
              mobileOpen={mobileSidebarOpen}
              onCloseMobile={() => setMobileSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
              {/* Persistent Header */}
              <Header onToggleMobileSidebar={() => setMobileSidebarOpen(true)} />

              {/* Scrollable Canvas / Workspace View */}
              <main className="flex-1 min-h-0 flex flex-col overflow-y-auto bg-surface">
                {children}
              </main>
            </div>
          </div>
          {/* Ora voice bubble: tap-open, closes on outside tap / route change */}
          <VoiceNotch />
        </VoiceAgentProvider>
      </WorkspaceProvider>
    </ProtectedRoute>
  );
}
