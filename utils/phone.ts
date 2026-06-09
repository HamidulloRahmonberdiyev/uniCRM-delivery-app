/** Uzbekistan: +998 XX XXX XX XX (9 raqam 998 dan keyin) */

export const UZ_PHONE_PREFIX = '+998';
export const UZ_PHONE_DIGITS = 9;

export function formatUzPhone(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, UZ_PHONE_DIGITS);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
}

export function digitsFromInput(text: string): string {
  return text.replace(/\D/g, '').slice(0, UZ_PHONE_DIGITS);
}

export function toFullPhone(digits: string): string {
  return `${UZ_PHONE_PREFIX} ${formatUzPhone(digits)}`;
}

export function isValidUzPhone(digits: string): boolean {
  return digits.length === UZ_PHONE_DIGITS && digits.startsWith('9');
}
