import { Image, type ImageSourcePropType } from 'react-native';

/**
 * Rasmlarni almashtirganda shu raqamni 1 ga oshiring — Expo Go / Metro keshi yangilanadi.
 */
export const ASSET_CACHE_VERSION = 3;

/** require() asset uchun kesh-bust URI (faqat http(s) Metro URL lar uchun) */
export function bustAssetCache(
  source: ImageSourcePropType,
): ImageSourcePropType {
  const resolved = Image.resolveAssetSource(source);
  if (!resolved?.uri) return source;

  // Android res:/file: URI larga query qo'shish rasmni yuklamay qo'yadi
  if (!/^https?:\/\//i.test(resolved.uri)) return source;

  const sep = resolved.uri.includes('?') ? '&' : '?';
  return { uri: `${resolved.uri}${sep}v=${ASSET_CACHE_VERSION}` };
}

/** WebView ichida ishlatish uchun to'liq URI */
export function assetWebUri(source: ImageSourcePropType): string {
  const busted = bustAssetCache(source);
  if (typeof busted === 'number') return '';
  return busted.uri ?? '';
}
