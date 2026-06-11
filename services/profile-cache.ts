import AsyncStorage from '@react-native-async-storage/async-storage';

import type { User } from '@/types/auth';

const PROFILE_CACHE_KEY = '@unigo_profile_cache';

export interface ProfileCacheData {
  userId: number;
  profile: User;
  activeOrders: number;
  deliveredOrders: number;
  cachedAt: number;
}

export async function loadProfileCache(): Promise<ProfileCacheData | null> {
  const raw = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw) as ProfileCacheData;
    if (
      !data.profile ||
      typeof data.userId !== 'number' ||
      typeof data.activeOrders !== 'number'
    ) {
      await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
    return null;
  }
}

export async function saveProfileCache(data: ProfileCacheData): Promise<void> {
  await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
}

export async function clearProfileCache(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
}
