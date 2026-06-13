import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { onDisconnect, ref, update, set } from 'firebase/database';

import { getFirebaseDatabase } from '@/lib/firebase';
import { haversineDistanceMeters } from '@/utils/geo';

export const LOCATION_TASK_NAME = 'UNIGO_COURIER_LOCATION_TASK';

const LOCATION_CHECK_INTERVAL_MS = 12_000;
const MIN_DISTANCE_METERS = 30;
const MIN_WRITE_INTERVAL_MS = 60_000;

const STORAGE_KEYS = {
  supplierId: '@unigo/tracking/supplierId',
  lastLat: '@unigo/tracking/lastLat',
  lastLng: '@unigo/tracking/lastLng',
  lastWriteAt: '@unigo/tracking/lastWriteAt',
} as const;

type LastPoint = { lat: number; lng: number };

let currentSupplierId: string | null = null;
let lastPoint: LastPoint | null = null;
let lastWriteAt = 0;

function courierPath(supplierId: string | number) {
  return `active_couriers/supplier_${supplierId}`;
}

async function hydrateTrackingState() {
  try {
    const entries = await AsyncStorage.multiGet(Object.values(STORAGE_KEYS));
    const map = Object.fromEntries(entries);

    currentSupplierId = map[STORAGE_KEYS.supplierId] ?? null;

    const lat = map[STORAGE_KEYS.lastLat];
    const lng = map[STORAGE_KEYS.lastLng];
    if (lat != null && lng != null) {
      const parsedLat = Number(lat);
      const parsedLng = Number(lng);
      if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
        lastPoint = { lat: parsedLat, lng: parsedLng };
      }
    }

    const storedWriteAt = map[STORAGE_KEYS.lastWriteAt];
    if (storedWriteAt != null) {
      const parsed = Number(storedWriteAt);
      if (Number.isFinite(parsed)) {
        lastWriteAt = parsed;
      }
    }
  } catch {
    // AsyncStorage vaqtincha ishlamasa, xotiradagi qiymatlar bilan davom etamiz.
  }
}

async function persistTrackingState() {
  try {
    const pairs: [string, string][] = [];

    if (currentSupplierId) {
      pairs.push([STORAGE_KEYS.supplierId, currentSupplierId]);
    }

    if (lastPoint) {
      pairs.push(
        [STORAGE_KEYS.lastLat, String(lastPoint.lat)],
        [STORAGE_KEYS.lastLng, String(lastPoint.lng)],
      );
    }

    pairs.push([STORAGE_KEYS.lastWriteAt, String(lastWriteAt)]);

    await AsyncStorage.multiSet(pairs);
  } catch {
    // Firebase yozuvi muvaffaqiyatli bo'lsa ham, keyingi tsikl ishlashda davom etadi.
  }
}

async function resolveSupplierId(): Promise<string | null> {
  if (currentSupplierId) return currentSupplierId;

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.supplierId);
    currentSupplierId = stored;
    return stored;
  } catch {
    return null;
  }
}

type CourierPayload = {
  lat: number;
  lng: number;
  updated_at: number;
  is_online: boolean;
};

async function publishCourierLocation(
  supplierId: string,
  lat: number,
  lng: number,
  now: number,
): Promise<void> {
  const db = getFirebaseDatabase();
  const courierRef = ref(db, courierPath(supplierId));

  const payload: CourierPayload = {
    lat,
    lng,
    updated_at: now,
    is_online: true,
  };

  await set(courierRef, payload);
  await onDisconnect(courierRef).update({ is_online: false });
}

async function markCourierOffline(supplierId: string): Promise<void> {
  const db = getFirebaseDatabase();
  const courierRef = ref(db, courierPath(supplierId));

  await onDisconnect(courierRef).cancel();
  await update(courierRef, { is_online: false });
}

async function pushLocationIfNeeded(lat: number, lng: number) {
  const supplierId = await resolveSupplierId();
  if (!supplierId) return;

  const now = Date.now();

  if (lastPoint) {
    const movedMeters = haversineDistanceMeters(
      { latitude: lastPoint.lat, longitude: lastPoint.lng },
      { latitude: lat, longitude: lng },
    );
    if (movedMeters < MIN_DISTANCE_METERS) return;
  }

  if (lastWriteAt > 0 && now - lastWriteAt < MIN_WRITE_INTERVAL_MS) return;

  try {
    await publishCourierLocation(supplierId, lat, lng, now);

    lastPoint = { lat, lng };
    lastWriteAt = now;
    await persistTrackingState();
  } catch {
    // Internet uzilishi yoki Firebase xatosi — keyingi tsiklda qayta uriniladi.
  }
}

async function ensureCourierOnlinePresence(
  supplierId: string,
  lat: number,
  lng: number,
): Promise<void> {
  try {
    await publishCourierLocation(supplierId, lat, lng, Date.now());
    lastPoint = { lat, lng };
    lastWriteAt = Date.now();
    await persistTrackingState();
  } catch {
    // onDisconnect keyingi muvaffaqiyatli yozuvda qayta ro'yxatdan o'tadi.
  }
}

TaskManager.defineTask(
  LOCATION_TASK_NAME,
  async ({ data, error }: TaskManager.TaskManagerTaskBody<{
    locations?: Location.LocationObject[];
  }>) => {
    if (error) return;

    try {
      const locations = data?.locations;
      const latest = locations?.[locations.length - 1];
      if (!latest) return;

      await hydrateTrackingState();
      await pushLocationIfNeeded(
        latest.coords.latitude,
        latest.coords.longitude,
      );
    } catch {
      // Fon vazifasi hech qachon ilovani to'xtatmasligi kerak.
    }
  },
);

export async function isTrackingActive(): Promise<boolean> {
  try {
    return Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  } catch {
    return false;
  }
}

export async function ensureAutoTracking(
  supplierId: number | string,
): Promise<void> {
  try {
    await startTracking(supplierId);
  } catch {
    // Ruxsat rad etilgan yoki vaqtincha xato — keyingi ochilishda qayta uriniladi.
  }
}

export async function startTracking(supplierId: number | string): Promise<void> {
  const supplierKey = String(supplierId);

  try {
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (foreground.status !== 'granted') {
      throw new Error('Joylashuv ruxsati berilmagan');
    }

    const background = await Location.requestBackgroundPermissionsAsync();
    if (background.status !== 'granted') {
      throw new Error(
        'Fon rejimida joylashuv ruxsati kerak. Sozlamalardan "Har doim" ruxsatini bering.',
      );
    }

    currentSupplierId = supplierKey;
    await AsyncStorage.setItem(STORAGE_KEYS.supplierId, supplierKey);

    const alreadyRunning = await isTrackingActive();
    if (!alreadyRunning) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: LOCATION_CHECK_INTERVAL_MS,
        distanceInterval: 0,
        deferredUpdatesInterval: LOCATION_CHECK_INTERVAL_MS,
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'uniGO',
          notificationBody: 'Joylashuvingiz yangilanmoqda',
          notificationColor: '#0088CC',
        },
      });
    }

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await ensureCourierOnlinePresence(
        supplierKey,
        position.coords.latitude,
        position.coords.longitude,
      );
    } catch {
      // Birinchi nuqta keyingi fon yangilanishida yoziladi.
    }
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Joylashuv kuzatuvini boshlab bo\'lmadi');
  }
}

export async function stopTracking(): Promise<void> {
  try {
    const supplierId = (await resolveSupplierId()) ?? currentSupplierId;

    if (supplierId) {
      try {
        await markCourierOffline(supplierId);
      } catch {
        // Internet yo'q bo'lsa onDisconnect server tomonida is_online ni false qiladi.
      }
    }

    const running = await isTrackingActive();
    if (running) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  } catch {
    // To'xtatishda xato bo'lsa ham holatni tozalaymiz.
  } finally {
    currentSupplierId = null;
    lastPoint = null;
    lastWriteAt = 0;

    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch {
      // ignore
    }
  }
}
