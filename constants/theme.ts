import { Platform } from 'react-native';

/**
 * Clean, monochrome Telegram-inspired palette.
 * Primary = Telegram Blue. Accents used sparingly for semantic states only.
 */
export const Palette = {
  primary: '#0088CC',
  primaryDark: '#006FA6',
  primarySoft: '#EBF5FB',
  primaryMuted: '#B0D9EF',

  bg: '#F4F6F8',
  card: '#FFFFFF',

  textPrimary: '#1B2A3D',
  textSecondary: '#5A6B7D',
  textMuted: '#9CAAB8',

  border: '#EDF0F4',
  divider: '#E5E9ED',

  danger: '#E5453E',
  dangerSoft: '#FEF1F0',

  overlay: 'rgba(0,0,0,0.04)',
} as const;

export const Colors = {
  light: {
    text: Palette.textPrimary,
    background: Palette.bg,
    tint: Palette.primary,
    icon: Palette.textMuted,
    tabIconDefault: Palette.textMuted,
    tabIconSelected: Palette.primary,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
