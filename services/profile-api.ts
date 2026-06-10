import { apiFetch } from '@/services/api';
import type { User } from '@/types/auth';

export async function getUserProfile(): Promise<User> {
  const res = await apiFetch('/auth/profile');
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? 'Profilni yuklash xatosi');
  }

  return (json.data ?? json) as User;
}
