import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = '@unigo_auth_session';

interface AuthSession {
  phone: string;
}

interface AuthContextValue {
  phone: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [phone, setPhone] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_KEY)
      .then((stored) => {
        if (!stored) return;
        const session = JSON.parse(stored) as AuthSession;
        setPhone(session.phone);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = useCallback(async (fullPhone: string, password: string) => {
    if (!password.trim()) {
      throw new Error('Parolni kiriting');
    }
    if (password.length < 4) {
      throw new Error("Parol kamida 4 ta belgidan iborat bo'lishi kerak");
    }

    // TODO: API orqali autentifikatsiya
    const session: AuthSession = { phone: fullPhone };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(session));
    setPhone(fullPhone);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setPhone(null);
  }, []);

  const value = useMemo(
    () => ({
      phone,
      isAuthenticated: Boolean(phone),
      isLoading,
      signIn,
      signOut,
    }),
    [phone, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
