import type { Coordinates } from '@/utils/geo';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type LocationMapHandle = {
  centerOn: (coords: Coordinates, zoom: number, duration?: number) => void;
  zoomBy: (delta: number) => void;
};

export const DRIVER_ZOOM = 12;
export const ORDER_FOCUS_ZOOM = 15;
export const MAP_MIN_ZOOM = 4;
export const MAP_MAX_ZOOM = 18;

export const YANDEX_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_YANDEX_MAPS_API_KEY ??
  (Constants.expoConfig?.extra?.yandexMapsApiKey as string | undefined) ??
  '';

export const isExpoGo = Constants.executionEnvironment === 'storeClient';

export function canShowYandexMap(): boolean {
  return Platform.OS !== 'web' && Boolean(YANDEX_MAPS_API_KEY);
}

let yamapInitialized = false;

/**
 * Yandex MapKit ni native xarita render qilinishidan OLDIN init qiladi.
 * Init qilinmasa native view crash beradi ("MapKitFactory ... not initialized").
 * Bir marta ishlaydi, takror chaqirilsa darhol qaytadi.
 */
export function ensureYamapInitialized(): boolean {
  if (yamapInitialized) return true;
  if (isExpoGo || Platform.OS === 'web' || !YANDEX_MAPS_API_KEY) return false;

  try {
    const { YamapInstance } = require('react-native-yamap-plus');
    // init/setLocale Promise qaytaradi — fire-and-forget, lekin
    // unhandled rejection bo'lmasligi uchun .catch ulaymiz.
    void Promise.resolve(YamapInstance.init(YANDEX_MAPS_API_KEY)).catch(
      () => undefined,
    );
    void Promise.resolve(YamapInstance.setLocale('ru_RU')).catch(
      () => undefined,
    );
    yamapInitialized = true;
    return true;
  } catch {
    return false;
  }
}

export function isYamapInitialized(): boolean {
  return yamapInitialized;
}
