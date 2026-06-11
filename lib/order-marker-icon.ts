/** Xaritadagi markerlar — SVG data URI (native va WebView) */

const ORDER_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="54" height="64" viewBox="0 0 54 64">
  <defs>
    <linearGradient id="og" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFBA5C"/>
      <stop offset="100%" stop-color="#E67E22"/>
    </linearGradient>
    <filter id="sh" x="-35%" y="-35%" width="170%" height="170%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <path d="M27 60 C27 60 9 40 9 27 C9 15.4 16.9 7 27 7 C37.1 7 45 15.4 45 27 C45 40 27 60 27 60 Z" fill="url(#og)" stroke="#FFFFFF" stroke-width="3.5" filter="url(#sh)"/>
  <circle cx="27" cy="26" r="10" fill="#FFFFFF" opacity="0.96"/>
  <circle cx="27" cy="26" r="4.5" fill="#E67E22"/>
</svg>`;

export const ORDER_PIN_DATA_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(ORDER_PIN_SVG)}`;

export const ORDER_PIN_SIZE = { width: 54, height: 64 } as const;

const DRIVER_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <defs>
    <radialGradient id="rg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#33A8E8"/>
      <stop offset="100%" stop-color="#0088CC"/>
    </radialGradient>
    <filter id="ds" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0088CC" flood-opacity="0.5"/>
    </filter>
  </defs>
  <circle cx="30" cy="30" r="26" fill="rgba(0,136,204,0.22)"/>
  <circle cx="30" cy="30" r="20" fill="url(#rg)" stroke="#FFFFFF" stroke-width="3.5" filter="url(#ds)"/>
  <rect x="15" y="24" width="17" height="11" rx="2" fill="#FFFFFF"/>
  <path d="M32 26 H37.5 L41 29.5 V35 H32 Z" fill="#FFFFFF"/>
  <circle cx="21" cy="37" r="2.8" fill="#FFFFFF"/>
  <circle cx="38" cy="37" r="2.8" fill="#FFFFFF"/>
</svg>`;

export const DRIVER_PIN_DATA_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(DRIVER_PIN_SVG)}`;
