'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

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
