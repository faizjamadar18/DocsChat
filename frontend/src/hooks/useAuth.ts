import { useState, useEffect } from 'react';
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
  preferences?: Record<string, any>;
  created_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    if (auth.isAuthenticated()) {
      try {
        const userData = await api.get('/auth/me');
        setUser(userData);
        return userData;
      } catch (error) {
        console.error("Failed to fetch user", error);
        auth.removeToken();
        setUser(null);
      }
    }
    return null;
  };

  useEffect(() => {
    fetchUser().finally(() => setLoading(false));
  }, []);

  const logout = () => {
    auth.removeToken();
    setUser(null);
    router.push('/login');
  };

  return { user, loading, logout, isAuthenticated: !!user, refreshUser: fetchUser, setUser };
}
