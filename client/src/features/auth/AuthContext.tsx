import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AuthSession, AuthUser, LoginCredentials, RegisterPayload, AuthError } from '../../types/auth';
import { mockLogin, mockRegister, mockChangePassword, mockGetUser } from './mockSession';
import { setApiToken, api } from '../../lib/api';

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

  const login = useCallback(async (creds: LoginCredentials) => {
    setError(null);
    setIsLoading(true);
    try {
      const s = await mockLogin(creds);
      applySession(s);
      // Sync isAdmin from DB — non-blocking; swallow errors if server is down
      try {
        const whoami = await api.get<{ id: string; email: string; role: string; isAdmin: boolean }>('/api/admin/whoami');
        setSession(prev => {
          if (!prev) return prev;
          const updated = { ...prev, user: { ...prev.user, isAdmin: whoami.isAdmin } };
          persistSession(updated);
          return updated;
        });
      } catch { /* server unavailable or user not in DB yet */ }
    } catch (err) {
      setError(err as AuthError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setError(null);
    setIsLoading(true);
    try {
      const s = await mockRegister(payload);
      applySession(s);
    } catch (err) {
      setError(err as AuthError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    applySession(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const updateProfile = useCallback((data: Partial<Pick<AuthUser, 'name' | 'email' | 'avatarUrl' | 'theme' | 'betaReaderPrivate'>>) => {
    setSession(prev => {
      if (!prev) return prev;
      let next: AuthSession;
      if (data.email) {
        const fresh = mockGetUser(data.email);
        next = fresh ? { ...prev, user: { ...fresh, ...data } } : { ...prev, user: { ...prev.user, ...data } };
      } else {
        next = { ...prev, user: { ...prev.user, ...data } };
      }
      persistSession(next);
      return next;
    });
  }, []);

  const changePassword = useCallback(async (current: string, next: string) => {
    const email = session?.user.email;
    if (!email) throw { code: 'UNKNOWN', message: 'Not logged in' } as AuthError;
    await mockChangePassword(email, current, next);
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
