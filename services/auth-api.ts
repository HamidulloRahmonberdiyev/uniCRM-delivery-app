import { API_BASE_URL } from '@/constants/api';
import type { AuthTokens, LoginResponseData } from '@/types/auth';

export class AuthExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthExpiredError';
  }
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s/g, '');
}

async function parseJson<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

type ValidationError = {
  message?: string;
  errors?: Record<string, string[]>;
};

type LoginByPhoneResponse =
  | LoginResponseData
  | {
      success: boolean;
      message: string;
      data: LoginResponseData | null;
    };

export async function loginByPhone(
  phone: string,
  password: string,
): Promise<LoginResponseData> {
  const res = await fetch(`${API_BASE_URL}/auth/login-by-phone`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      phone: normalizePhone(phone),
      password,
    }),
  });

  const json = await parseJson<LoginByPhoneResponse & ValidationError>(res);

  if (!res.ok) {
    if (res.status === 422 && json.errors) {
      const first = Object.values(json.errors)[0]?.[0];
      throw new Error(first ?? json.message ?? 'Maʼlumotlar noto‘g‘ri');
    }
    throw new Error(json.message ?? 'Telefon yoki parol noto‘g‘ri');
  }

  if ('data' in json && json.data?.access_token) {
    return json.data;
  }

  if ('access_token' in json && json.access_token) {
    return json;
  }

  throw new Error(
    typeof json === 'object' && json && 'message' in json
      ? String(json.message)
      : 'Kirish amalga oshmadi',
  );
}

export async function refreshAuthToken(
  refreshToken: string,
): Promise<AuthTokens> {
  const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const json = await parseJson<AuthTokens & { message?: string }>(res);

  if (!res.ok) {
    if (res.status === 401) {
      throw new AuthExpiredError(
        json.message ?? 'Refresh token expired',
      );
    }
    throw new Error(json.message ?? 'Token yangilash xatosi');
  }

  return json;
}

export async function logoutApi(accessToken: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });
  } catch {
    // Offline yoki server xatosi — mahalliy sessiyani baribir tozalaymiz
  }
}
