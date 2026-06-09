import { Linking, Platform } from 'react-native';

export type NavigationTarget = {
  address: string;
  latitude?: number;
  longitude?: number;
};

async function tryOpen(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

function yandexNaviUrl(lat: number, lon: number) {
  return `yandexnavi://build_route_on_map?lat_to=${lat}&lon_to=${lon}`;
}

function yandexMapsUrl(address: string, lat?: number, lon?: number) {
  if (lat != null && lon != null) {
    return `yandexmaps://maps.yandex.ru/?rtext=~${lat},${lon}&rtt=auto`;
  }
  return `yandexmaps://maps.yandex.ru/?text=${encodeURIComponent(address)}`;
}

function googleMapsAppUrl(address: string, lat?: number, lon?: number) {
  if (lat != null && lon != null) {
    if (Platform.OS === 'android') {
      return `google.navigation:q=${lat},${lon}`;
    }
    return `comgooglemaps://?daddr=${lat},${lon}&directionsmode=driving`;
  }
  const encoded = encodeURIComponent(address);
  if (Platform.OS === 'android') {
    return `google.navigation:q=${encoded}`;
  }
  return `comgooglemaps://?daddr=${encoded}&directionsmode=driving`;
}

function googleMapsWebUrl(address: string, lat?: number, lon?: number) {
  if (lat != null && lon != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`;
}

/** Yandex Navigator → Yandex Maps → Google Maps (navigatsiya bilan) */
export async function openNavigation({
  address,
  latitude,
  longitude,
}: NavigationTarget): Promise<void> {
  const hasCoords = latitude != null && longitude != null;

  if (hasCoords && (await tryOpen(yandexNaviUrl(latitude, longitude)))) {
    return;
  }

  if (await tryOpen(yandexMapsUrl(address, latitude, longitude))) {
    return;
  }

  if (await tryOpen(googleMapsAppUrl(address, latitude, longitude))) {
    return;
  }

  if (Platform.OS === 'ios') {
    const appleUrl = hasCoords
      ? `maps://?daddr=${latitude},${longitude}&dirflg=d`
      : `maps://?daddr=${encodeURIComponent(address)}&dirflg=d`;
    if (await tryOpen(appleUrl)) {
      return;
    }
  }

  await tryOpen(googleMapsWebUrl(address, latitude, longitude));
}
