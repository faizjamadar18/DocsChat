'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-base">
        <div className="w-5 h-5 border-3 border-white/10 border-l-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
