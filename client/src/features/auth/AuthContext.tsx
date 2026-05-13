import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AuthSession, AuthUser, LoginCredentials, RegisterPayload, AuthError } from '../../types/auth';
import { mockLogin, mockRegister, mockChangePassword } from './mockSession';
import { setApiToken, api } from '../../lib/api';
import { supabase, hasSupabase } from '../../lib/supabase';

interface AuthContextValue {
  session: AuthSession | null;
  currentUser: AuthUser | null;
  isLoading: boolean;
  error: AuthError | null;
  login: (creds: LoginCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateProfile: (data: Partial<Pick<AuthUser, 'name' | 'email' | 'avatarUrl' | 'theme' | 'betaReaderPrivate'>>) => void;
  changePassword: (current: string, next: string) => Promise<void>;
}

const SESSION_KEY = 'bookending_session';

function loadStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function persistSession(s: AuthSession | null) {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else    localStorage.removeItem(SESSION_KEY);
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Helpers ────────────────────────────────────────────────────────────────

async function buildUserFromSupabase(
  supabaseUser: { id: string; email?: string; user_metadata?: Record<string, unknown> },
  token: string,
): Promise<AuthUser> {
  setApiToken(token);
  const [whoami, profile] = await Promise.all([
    api.get<{ id: string; role: string; isAdmin: boolean }>('/api/admin/whoami').catch(() => null),
    api.get<{ name: string; avatarUrl?: string | null }>('/api/author-profile').catch(() => null),
  ]);
  return {
    id:          supabaseUser.id,
    email:       supabaseUser.email ?? '',
    name:        profile?.name ?? (supabaseUser.user_metadata?.name as string | undefined) ?? supabaseUser.email ?? '',
    role:        (whoami?.role ?? supabaseUser.user_metadata?.role ?? 'AUTHOR') as 'AUTHOR' | 'READER',
    lastLoginAt: new Date().toISOString(),
    isAdmin:     whoami?.isAdmin ?? false,
    avatarUrl:   profile?.avatarUrl ?? null,
  };
}

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session,   setSession]   = useState<AuthSession | null>(() => {
    const stored = loadStoredSession();
    if (stored?.token) setApiToken(stored.token);
    return stored;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<AuthError | null>(null);

  function applySession(s: AuthSession | null) {
    setApiToken(s?.token ?? null);
    persistSession(s);
    setSession(s);
  }

  // ── Login ──────────────────────────────────────────────────────────────

  const login = useCallback(async (creds: LoginCredentials) => {
    setError(null);
    setIsLoading(true);
    try {
      if (hasSupabase) {
        const { data, error: sbError } = await supabase.auth.signInWithPassword({
          email:    creds.email,
          password: creds.password,
        });
        if (sbError || !data.session) {
          const err: AuthError = { code: 'INVALID_CREDENTIALS', message: sbError?.message ?? 'Invalid credentials' };
          throw err;
        }
        const token = data.session.access_token;
        const user  = await buildUserFromSupabase(data.user, token);
        const s: AuthSession = {
          user,
          token,
          expiresAt: data.session.expires_at
            ? new Date(data.session.expires_at * 1000).toISOString()
            : null,
        };
        applySession(s);
      } else {
        // Dev bypass — works without a Supabase project
        const s = await mockLogin(creds);
        applySession(s);
        try {
          const whoami = await api.get<{ id: string; role: string; isAdmin: boolean }>('/api/admin/whoami');
          setSession(prev => {
            if (!prev) return prev;
            const updated = { ...prev, user: { ...prev.user, isAdmin: whoami.isAdmin } };
            persistSession(updated);
            return updated;
          });
        } catch { /* server unavailable */ }
      }
    } catch (err) {
      setError(err as AuthError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Register ───────────────────────────────────────────────────────────

  const register = useCallback(async (payload: RegisterPayload) => {
    setError(null);
    setIsLoading(true);
    try {
      if (hasSupabase) {
        await api.post('/api/auth/register', payload);
        // After server creates the account, sign in to get the session
        const { data, error: sbError } = await supabase.auth.signInWithPassword({
          email:    payload.email,
          password: payload.password,
        });
        if (sbError || !data.session) {
          const err: AuthError = { code: 'UNKNOWN', message: sbError?.message ?? 'Sign-in after registration failed' };
          throw err;
        }
        const token = data.session.access_token;
        const user  = await buildUserFromSupabase(data.user, token);
        const s: AuthSession = {
          user,
          token,
          expiresAt: data.session.expires_at
            ? new Date(data.session.expires_at * 1000).toISOString()
            : null,
        };
        applySession(s);
      } else {
        const s = await mockRegister(payload);
        applySession(s);
      }
    } catch (err) {
      setError(err as AuthError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    if (hasSupabase) {
      await supabase.auth.signOut().catch(() => { /* ignore network errors on logout */ });
    }
    applySession(null);
    setError(null);
  }, []);

  // ── Clear error ────────────────────────────────────────────────────────

  const clearError = useCallback(() => setError(null), []);

  // ── Update profile ─────────────────────────────────────────────────────

  const updateProfile = useCallback((data: Partial<Pick<AuthUser, 'name' | 'email' | 'avatarUrl' | 'theme' | 'betaReaderPrivate'>>) => {
    // Optimistic local update
    setSession(prev => {
      if (!prev) return prev;
      const next: AuthSession = { ...prev, user: { ...prev.user, ...data } };
      persistSession(next);
      return next;
    });
    // Persist to server in background
    const patch: Record<string, unknown> = {};
    if (data.name      !== undefined) patch.name      = data.name;
    if (data.avatarUrl !== undefined) patch.avatarUrl = data.avatarUrl;
    api.patch('/api/author-profile', patch).catch(() => { /* non-critical */ });
  }, []);

  // ── Change password ────────────────────────────────────────────────────

  const changePassword = useCallback(async (_current: string, next: string) => {
    if (hasSupabase) {
      const { error: sbError } = await supabase.auth.updateUser({ password: next });
      if (sbError) {
        throw { code: 'UNKNOWN', message: sbError.message } as AuthError;
      }
    } else {
      const email = session?.user.email;
      if (!email) throw { code: 'UNKNOWN', message: 'Not logged in' } as AuthError;
      await mockChangePassword(email, _current, next);
    }
  }, [session]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    currentUser: session?.user ?? null,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    updateProfile,
    changePassword,
  }), [session, isLoading, error, login, register, logout, clearError, updateProfile, changePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
