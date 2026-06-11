/** Yandex Maps ilovasiga o'xshash qorong'u vector xarita sozlamalari */

export const MAP_BG = '#0f1419';

export const NATIVE_MAP_PROPS = {
  mapType: 'vector' as const,
  nightMode: true,
  tiltGesturesDisabled: true,
  rotateGesturesDisabled: true,
  logoPosition: { horizontal: 'left' as const, vertical: 'bottom' as const },
  logoPadding: { horizontal: 10, vertical: 10 },
};

export const WEB_MAP_TYPE = 'yandex#darkMap';
