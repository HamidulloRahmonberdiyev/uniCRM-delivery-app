import AsyncStorage from '@react-native-async-storage/async-storage';

import type { User } from '@/types/auth';

const AUTH_KEY = '@unigo_auth_session';

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  phone: string;
  user: User | null;
}

export function expiresAtFromExpiresIn(expiresIn: string | number): number {
  const seconds =
    typeof expiresIn === 'string' ? parseInt(expiresIn, 10) : expiresIn;
  return Date.now() + seconds * 1000;
}

export function isTokenExpired(
  session: StoredSession,
  bufferMs = 60_000,
): boolean {
  return Date.now() >= session.accessTokenExpiresAt - bufferMs;
}

export async function loadSession(): Promise<StoredSession | null> {
  const raw = await AsyncStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as StoredSession;
    if (!session.accessToken || !session.refreshToken) {
      await AsyncStorage.removeItem(AUTH_KEY);
      return null;
    }
    return session;
  } catch {
    await AsyncStorage.removeItem(AUTH_KEY);
    return null;
  }
}

export async function saveSession(session: StoredSession): Promise<void> {
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_KEY);
}
