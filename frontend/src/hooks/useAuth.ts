'use client';

import { useAuthSession } from '../context/AuthContext';

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
// The AuthSessionProvider listens and refetches without a page refresh.
export const USER_UPDATED_EVENT = 'quello:user-updated';

export function notifyUserUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(USER_UPDATED_EVENT));
  }
}

/**
 * Shared session hook backed by AuthSessionProvider (single /auth/me
 * request per page load, sync token read on mount).
 *
 * Backwards-compatible return shape; adds `hasSession` (optimistic,
 * network-independent) and `mounted` for hydration-safe nav CTAs.
 */
export function useAuth() {
  const session = useAuthSession();
  return {
    user: session.user,
    loading: session.loading,
    logout: session.logout,
    isAuthenticated: session.isAuthenticated,
    refreshUser: session.refreshUser,
    setUser: session.setUser,
    hasSession: session.hasSession,
    mounted: session.mounted,
  };
}
