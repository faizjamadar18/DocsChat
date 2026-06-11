import { useState, useEffect } from 'react';
import { auth } from '../lib/auth';
import { api } from '../lib/api';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      if (auth.isAuthenticated()) {
        try {
          const userData = await api.get('/auth/me');
          setUser(userData);
        } catch (error) {
          console.error("Failed to fetch user", error);
          auth.removeToken();
          setUser(null);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const logout = () => {
    auth.removeToken();
    setUser(null);
    router.push('/login');
  };

  return { user, loading, logout, isAuthenticated: !!user };
}
