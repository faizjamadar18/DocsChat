'use client';
import { useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import SourcesSidebar from '../../components/SourcesSidebar';
import ChatPanel from '../../components/ChatPanel';
import { useAuth } from '../../hooks/useAuth';

export default function Notebook() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <ProtectedRoute>
      <div className="h-screen bg-base flex flex-col">
        <div className="flex flex-1 min-h-0">
          {/* Desktop sidebar */}
          <div className={`hidden lg:flex ${sidebarCollapsed ? 'w-[56px]' : 'w-[280px]'} shrink-0 flex-col border-r border-white/[0.06] transition-all duration-300 ease-in-out overflow-hidden`}>
            <SourcesSidebar
              user={user}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              onCloseMobile={() => setSidebarOpen(false)}
            />
          </div>

          {/* Mobile sidebar drawer */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-[300px] bg-base">
                <SourcesSidebar user={user} collapsed={false} onCloseMobile={() => setSidebarOpen(false)} />
              </div>
            </div>
          )}

          <ChatPanel
            user={user}
            onLogout={logout}
            onToggleSidebar={() => setSidebarOpen(true)}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
