// Semantic design tokens for bidplace.
// light-only MVP — dark theme removed from runtime.
// Future dark theme: add a new token map, not component rewrites.

export * from './modern';

export const colors = {
  // Backgrounds
  background: '#F7F6F3',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F0ED',

  // Text
  textPrimary: '#171717',
  textSecondary: '#595959',
  textMuted: '#7A7A7A',

  // Borders
  border: '#DEDDD9',
  borderStrong: '#BEBDB8',

  // Primary (neutral cobalt)
  primary: '#2457E6',
  primaryHover: '#1E49C7',
  primaryPressed: '#18399D',
  primaryTint: '#EEF3FF',
  focus: '#7FA1FF',
  onPrimary: '#FFFFFF',

  // Semantic status
  positive: '#247A4A',
  positiveTint: '#EAF4EE',
  warning: '#9A6415',
  warningTint: '#FDF3E0',
  negative: '#B63B3B',
  negativeTint: '#FDECEC',
  info: '#51667D',
  infoTint: '#EBF1F7',

  // Media & overlay
  imageBackground: '#F1F0ED',
  overlay: 'rgba(23,23,23,0.40)',
  overlayStrong: 'rgba(23,23,23,0.72)',
} as const;

export const spacing = {
  0: 0,
  '0.5': 2,
  1: 4,
  '1.5': 6,
  2: 8,
  '2.5': 10,
  3: 12,
  '3.5': 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

// Semantic radius scale — do not add ad-hoc values in components
export const radius = {
  small: 4,   // tags, chips
  control: 8, // buttons, inputs
  panel: 12,  // cards, panels
  large: 16,  // modals, sheets
  round: 999, // icon buttons, avatars
} as const;

export const sizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
  '2xl': 64,
  '3xl': 72,
  touch: 44,   // minimum interactive target
} as const;

export const typography = {
  display: { size: 48, lineHeight: 54, letterSpacing: -1.0, weight: '600' },
  hero: { size: 64, lineHeight: 70, letterSpacing: -1.4, weight: '600' },
  heading: { size: 32, lineHeight: 40, letterSpacing: -0.5, weight: '600' },
  title: { size: 22, lineHeight: 28, letterSpacing: -0.2, weight: '600' },
  titleSm: { size: 18, lineHeight: 24, letterSpacing: -0.1, weight: '600' },
  body: { size: 16, lineHeight: 26, letterSpacing: 0, weight: '400' },
  bodyStrong: { size: 16, lineHeight: 26, letterSpacing: 0, weight: '600' },
  small: { size: 14, lineHeight: 21, letterSpacing: 0, weight: '400' },
  smallStrong: { size: 14, lineHeight: 21, letterSpacing: 0, weight: '600' },
  caption: { size: 12, lineHeight: 16, letterSpacing: 0.3, weight: '500' },
  nav: { size: 13, lineHeight: 18, letterSpacing: 0.3, weight: '500' },
} as const;

// Minimal shadows — prefer borders and whitespace
export const shadows = {
  soft: '0 2px 8px rgba(23,23,23,0.06)',
  medium: '0 4px 16px rgba(23,23,23,0.08)',
  overlay: '0 8px 32px rgba(23,23,23,0.12)',
} as const;

export const layout = {
  pageMaxWidth: 1440,
  contentMaxWidth: 1280,
  readingMaxWidth: 680,
  formMaxWidth: 520,
  compactFormMaxWidth: 440,
} as const;

// Brand tokens — wordmark can be changed by updating these only
export const brand = {
  fontFamily: 'CormorantGaramond_500Medium',
  fontSize: 17,
  fontWeight: '500' as const,
  letterSpacing: 0.2,
  markSizeCompact: 26,
  markSizeDefault: 32,
  gap: 8,
} as const;

// Light theme — single source of truth for MVP
export const lightTheme = {
  background: colors.background,
  surface: colors.surface,
  surfaceMuted: colors.surfaceMuted,
  surfaceRaised: colors.surface,

  borderColor: colors.border,
  borderColorStrong: colors.borderStrong,

  color: colors.textPrimary,
  colorSecondary: colors.textSecondary,
  colorMuted: colors.textMuted,

  primary: colors.primary,
  primaryHover: colors.primaryHover,
  primaryPressed: colors.primaryPressed,
  primaryTint: colors.primaryTint,
  onPrimary: colors.onPrimary,
  focusRing: colors.focus,

  positive: colors.positive,
  positiveTint: colors.positiveTint,
  warning: colors.warning,
  warningTint: colors.warningTint,
  negative: colors.negative,
  negativeTint: colors.negativeTint,
  info: colors.info,
  infoTint: colors.infoTint,

  imageBackground: colors.imageBackground,
  overlay: colors.overlay,
  overlayStrong: colors.overlayStrong,
} as const;

export type LightTheme = typeof lightTheme;

// Alias — keep ThemeTokens for any existing imports
export type ThemeTokens = LightTheme;

// Legacy alias removed: themeNames, ThemeName, darkTheme, themes
// Dark theme will be added as a new token map in a future task.
