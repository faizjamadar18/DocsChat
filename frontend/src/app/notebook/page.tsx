"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function NotebookIndex() {
  const router = useRouter();

  useEffect(() => {
    async function loadWorkspace() {
      try {
        const response = await api.get('/workspaces');
        if (response.workspaces && response.workspaces.length > 0) {
          router.push(`/notebook/${response.workspaces[0].id}`);
        } else {
          // Create default workspace
          const newWorkspace = await api.post('/workspaces', { name: "Default Workspace", description: "Your default workspace" });
          router.push(`/notebook/${newWorkspace.id}`);
        }
      } catch (error) {
        console.error("Failed to load or create workspace", error);
      }
    }
    
    loadWorkspace();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading workspace...</p>
      </div>
    </div>
  );
}
