'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  role?: 'owner' | 'editor' | 'viewer' | string;
  member_count?: number;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  loading: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  refreshWorkspaces: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  activeDocTitle: string | null;
  setActiveDocTitle: (title: string | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

// --- Hydration-safe sidebar collapse preference (localStorage) ---
// Mirrors AuthContext's pattern: server and first client paint see the
// default (expanded); the sync localStorage snapshot applies right after
// hydration, so reloads restore the rail/full choice without a hydration
// mismatch or a controlled-state warning.
const SIDEBAR_COLLAPSED_KEY = 'quello_sidebar_collapsed';
const SIDEBAR_COLLAPSED_EVENT = 'quello:sidebar-collapsed';

function subscribeSidebarCollapsed(cb: () => void) {
  window.addEventListener(SIDEBAR_COLLAPSED_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(SIDEBAR_COLLAPSED_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

function getSidebarCollapsedSnapshot() {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function getSidebarCollapsedServerSnapshot() {
  return false;
}

function writeSidebarCollapsed(collapsed: boolean) {
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  } catch {
    // Storage unavailable (private mode / quota): the toggle still works in-memory.
  }
  window.dispatchEvent(new Event(SIDEBAR_COLLAPSED_EVENT));
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const sidebarCollapsed = useSyncExternalStore(
    subscribeSidebarCollapsed,
    getSidebarCollapsedSnapshot,
    getSidebarCollapsedServerSnapshot,
  );
  const [activeDocTitle, setActiveDocTitle] = useState<string | null>(null);

  const fetchWorkspacesData = useCallback(async () => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.get('/workspaces');
      const wsList: Workspace[] = data.workspaces || [];
      setWorkspaces(wsList);

      const activeId = data.active_workspace_id;
      const found = wsList.find((w) => w.id === activeId) || wsList[0] || null;

      if (found) {
        setCurrentWorkspace(found);
      } else if (user) {
        setCurrentWorkspace({
          id: 'default',
          owner_id: user.id,
          name: `${user.username || 'My'} HQ`,
          slug: 'my-hq',
          logo_url: null,
          description: 'Default workspace',
        });
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      if (user) {
        setCurrentWorkspace({
          id: 'default',
          owner_id: user.id,
          name: `${user.username || 'My'} HQ`,
          slug: 'my-hq',
          logo_url: null,
          description: 'Default workspace',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isAuthenticated) {
        if (!cancelled) {
          setWorkspaces([]);
          setCurrentWorkspace(null);
          setLoading(false);
        }
        return;
      }

      try {
        const data = await api.get('/workspaces');
        if (cancelled) return;
        const wsList: Workspace[] = data.workspaces || [];
        setWorkspaces(wsList);

        const activeId = data.active_workspace_id;
        const found = wsList.find((w) => w.id === activeId) || wsList[0] || null;

        if (found) {
          setCurrentWorkspace(found);
        } else if (user) {
          setCurrentWorkspace({
            id: 'default',
            owner_id: user.id,
            name: `${user.username || 'My'} HQ`,
            slug: 'my-hq',
            logo_url: null,
            description: 'Default workspace',
          });
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load workspaces:', err);
        if (user) {
          setCurrentWorkspace({
            id: 'default',
            owner_id: user.id,
            name: `${user.username || 'My'} HQ`,
            slug: 'my-hq',
            logo_url: null,
            description: 'Default workspace',
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  const switchWorkspace = async (workspaceId: string) => {
    try {
      await api.post(`/workspaces/${workspaceId}/activate`, {});
      await fetchWorkspacesData();
    } catch (err) {
      console.error('Failed to switch workspace:', err);
    }
  };

  const toggleSidebar = useCallback(() => {
    writeSidebarCollapsed(!getSidebarCollapsedSnapshot());
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    writeSidebarCollapsed(collapsed);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        loading,
        sidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed,
        refreshWorkspaces: fetchWorkspacesData,
        switchWorkspace,
        activeDocTitle,
        setActiveDocTitle,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
