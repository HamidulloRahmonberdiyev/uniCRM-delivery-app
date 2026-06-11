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
