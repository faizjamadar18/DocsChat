'use client';
import { useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import SourcesSidebar from '../../components/SourcesSidebar';
import ChatPanel from '../../components/ChatPanel';
import { useAuth } from '../../hooks/useAuth';

export default function Notebook() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="h-screen bg-base p-2 sm:p-4 flex flex-col">
        <div className="flex justify-between items-center px-3 sm:px-6 py-2 sm:py-3 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-8 h-8 flex items-center justify-center text-white/60 hover:text-white cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <a href="/" className="text-xl font-semibold tracking-tight text-white hover:text-white/80 transition-colors">DocsChat</a>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-white/60">
              {user?.email}
            </span>
            <button
              onClick={logout}
              className="text-sm text-white px-3 py-1.5 rounded-full bg-white/10 cursor-pointer hover:bg-white/20 transition-colors flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Sign out
            </button>
          </div>
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Desktop sidebar */}
          <div className="hidden lg:block w-[300px] shrink-0">
            <SourcesSidebar />
          </div>

          {/* Mobile sidebar drawer */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-[320px] bg-base p-4">
                <div className="flex justify-end mb-3">
                  <button onClick={() => setSidebarOpen(false)} className="text-white/60 hover:text-white text-xl cursor-pointer">✕</button>
                </div>
                <SourcesSidebar />
              </div>
            </div>
          )}

          <ChatPanel />
        </div>
      </div>
    </ProtectedRoute>
  );
}
