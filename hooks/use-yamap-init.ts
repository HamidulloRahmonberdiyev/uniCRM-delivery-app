import {
  ensureYamapInitialized,
  isExpoGo,
  isYamapInitialized,
  YANDEX_MAPS_API_KEY,
} from '@/lib/yandex-maps';
import { useEffect, useState } from 'react';

/**
 * Yandex MapKit init holatini qaytaradi.
 * Xarita faqat `ready === true` bo'lganda render qilinishi kerak,
 * aks holda native view crash beradi.
 */
export function useYamapInit(): { ready: boolean } {
  const [ready, setReady] = useState(
    // Native init allaqachon bo'lgan yoki umuman kerak emas (WebView yo'li)
    () => isYamapInitialized() || isExpoGo || !YANDEX_MAPS_API_KEY,
  );

  useEffect(() => {
    if (ready) return;
    // Expo Go yoki kalit yo'q — native init kerak emas (WebView ishlatiladi)
    if (isExpoGo || !YANDEX_MAPS_API_KEY) {
      setReady(true);
      return;
    }
    setReady(ensureYamapInitialized());
  }, [ready]);

  return { ready };
}
