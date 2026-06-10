export interface Coordinates {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Ikki nuqta orasidagi masofa (km) — Haversine */
export function haversineDistanceKm(
  from: Coordinates,
  to: Coordinates,
): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
  if (!Number.isFinite(km)) return '—';
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/** Taxminiy yetib borish vaqti (shahar trafigi ~35 km/soat) */
export function formatEtaFromKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return '—';

  const minutes = Math.max(1, Math.round((km / 35) * 60));
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest > 0 ? `${hours} soat ${rest} min` : `${hours} soat`;
  }

  return `${minutes} min`;
}

export function etaBetween(from: Coordinates, to: Coordinates): string {
  return formatEtaFromKm(haversineDistanceKm(from, to));
}
