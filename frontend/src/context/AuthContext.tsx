'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { useRouter } from 'next/navigation';
import { auth, TOKEN_CHANGED_EVENT } from '../lib/auth';
import { api } from '../lib/api';
import type { User } from '../hooks/useAuth';

// Keep in sync with hooks/useAuth (string-duplicated to avoid a runtime import cycle).
const USER_UPDATED_EVENT = 'quello:user-updated';
const TOKEN_KEY = 'notebooklm_token';
const CACHE_TTL_MS = 60_000;

// Module-level single-flight cache: every useAuth instance on the page shares
// one /auth/me request instead of each firing its own on mount.
let cachedUser: User | null = null;
let cacheAt = 0;
let inflight: Promise<User | null> | null = null;

async function verifySession(force = false): Promise<User | null> {
  if (!auth.isAuthenticated()) {
    cachedUser = null;
    cacheAt = 0;
    return null;
  }
  if (!force && cachedUser && Date.now() - cacheAt < CACHE_TTL_MS) {
    return cachedUser;
  }
  if (inflight) return inflight;
  inflight = api
    .get('/auth/me', { skipAuthRedirect: true })
    .then((userData) => {
      cachedUser = userData as User;
      cacheAt = Date.now();
      return cachedUser;
    })
    .catch(() => {
      // Background probe only: a 401/cold-start failure means "treat as
      // signed out", never a forced navigation (skipAuthRedirect above).
      // removeToken emits TOKEN_CHANGED_EVENT so subscribers re-render.
      auth.removeToken();
      cachedUser = null;
      cacheAt = 0;
      return null;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

// --- Hydration-safe session reads (no set-state-in-effect) ---
// Server and first client paint both see `false`; the client snapshot
// (sync localStorage read, no network) applies immediately after hydration,
// so nav CTAs resolve on first paint instead of after a /auth/me round-trip.

function subscribeTokenChange(cb: () => void) {
  window.addEventListener(TOKEN_CHANGED_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(TOKEN_CHANGED_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}
function getTokenSnapshot() {
  return auth.isAuthenticated();
}
function getTokenServerSnapshot() {
  return false;
}
function subscribeNoop() {
  return () => {};
}
function getMountedSnapshot() {
  return true;
}
function getMountedServerSnapshot() {
  return false;
}

interface AuthSessionValue {
  user: User | null;
  /** True only after hydration (server/first paint see false). */
  mounted: boolean;
  /** Token present in storage (sync, no network). */
  hasToken: boolean;
  /**
   * Optimistic session flag for low-stakes UI (nav CTAs): true when a token
   * exists locally or the user is verified. Never blocks on the network.
   */
  hasSession: boolean;
  /** Verified auth state. True only with a verified user and a token. */
  isAuthenticated: boolean;
  /**
   * Verification pending. False immediately for signed-out visitors
   * (no network call); true while a present token is being verified.
   */
  loading: boolean;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  setUser: Dispatch<SetStateAction<User | null>>;
}

const AuthSessionContext = createContext<AuthSessionValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    subscribeNoop,
    getMountedSnapshot,
    getMountedServerSnapshot,
  );
  const hasToken = useSyncExternalStore(
    subscribeTokenChange,
    getTokenSnapshot,
    getTokenServerSnapshot,
  );
  const [user, setUserState] = useState<User | null>(() => cachedUser);

  const setUser = useCallback<Dispatch<SetStateAction<User | null>>>((action) => {
    // Resolve against the module cache (all updates funnel through here,
    // so it always holds the latest user) and keep the value form for React
    // state to avoid impure updaters under StrictMode.
    const next =
      typeof action === 'function'
        ? (action as (prev: User | null) => User | null)(cachedUser)
        : action;
    cachedUser = next;
    cacheAt = next ? Date.now() : 0;
    setUserState(next);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!auth.isAuthenticated()) {
      cachedUser = null;
      cacheAt = 0;
      setUserState(null);
      return null;
    }
    const result = await verifySession(true);
    setUserState(result);
    return result;
  }, []);

  // Verify a present-but-unverified token in the background (initial mount,
  // same-tab login, cross-tab sign-in). State updates happen only in the
  // async continuation, never synchronously in the effect body.
  useEffect(() => {
    if (!hasToken) return;
    let cancelled = false;
    void verifySession(false).then((result) => {
      if (!cancelled) setUserState(result);
    });
    return () => {
      cancelled = true;
    };
  }, [hasToken]);

  // External auth changes: cross-tab storage events, same-tab token
  // mutations, and in-app profile updates. setState only in callbacks.
  useEffect(() => {
    const onAuthChange = (e: Event) => {
      if (e instanceof StorageEvent && e.key !== null && e.key !== TOKEN_KEY) return;
      if (!auth.isAuthenticated()) {
        cachedUser = null;
        cacheAt = 0;
        setUserState(null);
      } else {
        void refreshUser();
      }
    };
    const onUserUpdated = () => {
      void refreshUser();
    };
    window.addEventListener(TOKEN_CHANGED_EVENT, onAuthChange);
    window.addEventListener('storage', onAuthChange);
    window.addEventListener(USER_UPDATED_EVENT, onUserUpdated);
    return () => {
      window.removeEventListener(TOKEN_CHANGED_EVENT, onAuthChange);
      window.removeEventListener('storage', onAuthChange);
      window.removeEventListener(USER_UPDATED_EVENT, onUserUpdated);
    };
  }, [refreshUser]);

  const logout = useCallback(() => {
    auth.removeToken();
    cachedUser = null;
    cacheAt = 0;
    setUserState(null);
    router.push('/login');
  }, [router]);

  const value = useMemo<AuthSessionValue>(() => {
    const verified = !!user && hasToken;
    return {
      user,
      mounted,
      hasToken,
      hasSession: mounted && (hasToken || !!user),
      isAuthenticated: verified,
      loading: !mounted || (hasToken && !user),
      logout,
      refreshUser,
      setUser,
    };
  }, [user, mounted, hasToken, logout, refreshUser, setUser]);

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): AuthSessionValue {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) throw new Error('useAuthSession must be used within an AuthSessionProvider');
  return ctx;
}
