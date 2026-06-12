/**
 * Xaritadagi markerlar — native va WebView ikkalasida ham shu PNG fayllar.
 */

import type { ImageSourcePropType } from 'react-native';

import { assetWebUri } from '@/lib/assets';

export const ORDER_PIN_IMAGE: ImageSourcePropType = require('@/assets/images/order-pin.png');
export const DRIVER_PIN_IMAGE: ImageSourcePropType = require('@/assets/images/driver-pin.png');

/** WebView (Expo Go) — assets/images dagi yangilangan PNG */
export const ORDER_PIN_DATA_URI = assetWebUri(ORDER_PIN_IMAGE);
export const DRIVER_PIN_DATA_URI = assetWebUri(DRIVER_PIN_IMAGE);

/** Marker tasvirining haqiqiy nuqtaga to'g'ri keladigan anchor nuqtasi (0..1) */
export const ORDER_PIN_ANCHOR = { x: 0.5, y: 0.962 } as const;
export const DRIVER_PIN_ANCHOR = { x: 0.5, y: 0.5 } as const;

/** Native Yamap marker scale */
export const ORDER_MARKER_SCALE = 0.38;
export const DRIVER_MARKER_SCALE = 0.52;

/** WebView placemark o'lchamlari (px) */
export const ORDER_PIN_DISPLAY = { width: 44, height: 52 } as const;
export const DRIVER_PIN_DISPLAY = { width: 52, height: 52 } as const;
