import { useState, useEffect, useCallback } from 'react';
import { auth } from '../lib/auth';
import { api } from '../lib/api';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  username: string;
  email: string;
  auth_provider?: string;
  picture?: string | null;
  active_workspace_id?: string | null;
  onboarding_completed?: boolean;
  preferences?: Record<string, unknown>;
  created_at: string;
}

// Broadcast when the user profile changes (e.g. avatar saved in Settings).
// Each useAuth instance owns independent state, so listeners refetch to stay
// in sync without a page refresh.
export const USER_UPDATED_EVENT = 'quello:user-updated';

export function notifyUserUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(USER_UPDATED_EVENT));
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      if (!auth.isAuthenticated()) return null;
      try {
        const userData = await api.get('/auth/me');
        setUser(userData);
        return userData;
      } catch (error) {
        console.error("Failed to fetch user", error);
        auth.removeToken();
        setUser(null);
        return null;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUser();
    const handleUserUpdated = () => {
      void fetchUser();
    };
    window.addEventListener(USER_UPDATED_EVENT, handleUserUpdated);
    return () => window.removeEventListener(USER_UPDATED_EVENT, handleUserUpdated);
  }, [fetchUser]);

  const logout = () => {
    auth.removeToken();
    setUser(null);
    router.push('/login');
  };

  return { user, loading, logout, isAuthenticated: !!user, refreshUser: fetchUser, setUser };
}
