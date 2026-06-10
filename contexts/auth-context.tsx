import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AuthExpiredError,
  loginByPhone,
  logoutApi,
} from '@/services/auth-api';
import {
  clearSession,
  expiresAtFromExpiresIn,
  loadSession,
  saveSession,
  type StoredSession,
} from '@/services/auth-storage';
import {
  refreshSessionIfNeeded,
  setSessionInvalidatedHandler,
} from '@/services/api';
import type { User } from '@/types/auth';

interface AuthContextValue {
  user: User | null;
  phone: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function applySession(
  session: StoredSession,
  setUser: (u: User | null) => void,
  setPhone: (p: string | null) => void,
) {
  setPhone(session.phone);
  setUser(session.user);
}

function clearAuthState(
  setUser: (u: User | null) => void,
  setPhone: (p: string | null) => void,
) {
  setPhone(null);
  setUser(null);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleSessionInvalidated = useCallback(() => {
    clearAuthState(setUser, setPhone);
  }, []);

  useEffect(() => {
    setSessionInvalidatedHandler(handleSessionInvalidated);
    return () => setSessionInvalidatedHandler(null);
  }, [handleSessionInvalidated]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const session = await refreshSessionIfNeeded();
        if (!active) return;

        if (session) {
          applySession(session, setUser, setPhone);
        }
      } catch (error) {
        if (!active) return;
        if (error instanceof AuthExpiredError) {
          clearAuthState(setUser, setPhone);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (fullPhone: string, password: string) => {
    if (!password.trim()) {
      throw new Error('Parolni kiriting');
    }
    if (password.length < 5) {
      throw new Error("Parol kamida 5 ta belgidan iborat bo'lishi kerak");
    }

    const data = await loginByPhone(fullPhone, password);

    const session: StoredSession = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      accessTokenExpiresAt: expiresAtFromExpiresIn(data.expires_in),
      phone: data.user.phone ?? fullPhone,
      user: data.user,
    };

    await saveSession(session);
    applySession(session, setUser, setPhone);
  }, []);

  const signOut = useCallback(async () => {
    const session = await loadSession();
    if (session?.accessToken) {
      await logoutApi(session.accessToken);
    }
    await clearSession();
    clearAuthState(setUser, setPhone);
  }, []);

  const value = useMemo(
    () => ({
      user,
      phone,
      isAuthenticated: Boolean(user),
      isLoading,
      signIn,
      signOut,
    }),
    [user, phone, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
