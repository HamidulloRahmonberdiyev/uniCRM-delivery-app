import { YANDEX_MAPS_API_KEY, isExpoGo } from '@/lib/yandex-maps';
import { useEffect } from 'react';

let initialized = false;

export function useYamapInit() {
  useEffect(() => {
    if (initialized || isExpoGo || !YANDEX_MAPS_API_KEY) return;

    try {
      const { YamapInstance } = require('react-native-yamap-plus');
      YamapInstance.init(YANDEX_MAPS_API_KEY);
      YamapInstance.setLocale('ru_RU');
      initialized = true;
    } catch {
      // Native modul mavjud emas (masalan, Expo Go)
    }
  }, []);
}
