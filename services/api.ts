import { API_BASE_URL } from '@/constants/api';
import {
  clearSession,
  expiresAtFromExpiresIn,
  isTokenExpired,
  loadSession,
  saveSession,
  type StoredSession,
} from '@/services/auth-storage';
import { AuthExpiredError, refreshAuthToken } from '@/services/auth-api';

type SessionInvalidatedHandler = () => void;

let onSessionInvalidated: SessionInvalidatedHandler | null = null;
let refreshLock: Promise<string> | null = null;

export function setSessionInvalidatedHandler(
  handler: SessionInvalidatedHandler | null,
) {
  onSessionInvalidated = handler;
}

async function applyRefreshedTokens(
  session: StoredSession,
): Promise<string> {
  const tokens = await refreshAuthToken(session.refreshToken);
  const updated: StoredSession = {
    ...session,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    accessTokenExpiresAt: expiresAtFromExpiresIn(tokens.expires_in),
  };
  await saveSession(updated);
  return updated.accessToken;
}

export async function refreshSessionIfNeeded(): Promise<StoredSession | null> {
  const session = await loadSession();
  if (!session) return null;

  if (!isTokenExpired(session)) {
    return session;
  }

  if (!refreshLock) {
    refreshLock = applyRefreshedTokens(session)
      .catch(async (error) => {
        if (error instanceof AuthExpiredError) {
          await clearSession();
          onSessionInvalidated?.();
        }
        throw error;
      })
      .finally(() => {
        refreshLock = null;
      });
  }

  await refreshLock;
  return loadSession();
}

export async function getValidAccessToken(): Promise<string | null> {
  const session = await refreshSessionIfNeeded();
  return session?.accessToken ?? null;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getValidAccessToken();
  if (!token) {
    throw new AuthExpiredError('Session expired');
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Accept', 'application/json');

  let res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status !== 401) {
    return res;
  }

  const session = await loadSession();
  if (!session) {
    onSessionInvalidated?.();
    throw new AuthExpiredError('Session expired');
  }

  try {
    if (!refreshLock) {
      refreshLock = applyRefreshedTokens(session)
        .catch(async (error) => {
          await clearSession();
          onSessionInvalidated?.();
          throw error;
        })
        .finally(() => {
          refreshLock = null;
        });
    }
    const newToken = await refreshLock;
    headers.set('Authorization', `Bearer ${newToken}`);
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (error) {
    throw error;
  }

  if (res.status === 401) {
    await clearSession();
    onSessionInvalidated?.();
    throw new AuthExpiredError('Session expired');
  }

  return res;
}
