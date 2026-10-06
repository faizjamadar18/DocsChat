'use client';
import React, { useState } from 'react';
import ProtectedRoute from '../ProtectedRoute';
import { WorkspaceProvider } from '../../context/WorkspaceContext';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <WorkspaceProvider>
        <div className="flex h-screen w-screen overflow-hidden bg-[#FBFBFD] text-[#111827]">
          {/* Persistent Sidebar */}
          <Sidebar
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />

          {/* Main Content Area */}
          <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
            {/* Persistent Header */}
            <Header onToggleMobileSidebar={() => setMobileSidebarOpen(true)} />

            {/* Scrollable Canvas */}
            <main className="flex-1 min-h-0 overflow-y-auto bg-[#FFFFFF]">
              {children}
            </main>
          </div>
        </div>
      </WorkspaceProvider>
    </ProtectedRoute>
  );
}
