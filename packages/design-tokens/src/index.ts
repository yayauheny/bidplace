export const themeNames = ['light', 'dark'] as const;

export type ThemeName = (typeof themeNames)[number];

export const colors = {
  background: '#F8F7F3',
  paper: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F2ED',
  surfaceStrong: '#FFFFFF',
  border: '#DFDDD7',
  borderStrong: '#CFCBC2',
  ink: '#111111',
  mutedInk: '#77746E',
  accent: '#111111',
  accentStrong: '#050505',
  accentSoft: '#EFEDE7',
  accentMuted: '#3E3C38',
  success: '#2D6A4F',
  warning: '#9C6D2D',
  danger: '#B74335',
  info: '#51667D',
  imageBackground: '#F0F0EE',
  overlay: 'rgba(17, 17, 17, 0.34)',
  darkBackground: '#111111',
  darkSurface: '#181818',
  darkSurfaceElevated: '#222222',
  darkSurfaceMuted: '#2C2C2C',
  darkBorder: '#3A3A3A',
  darkInk: '#F8F7F3',
  darkMutedInk: '#B9B4AB',
  darkAccent: '#F8F7F3',
  darkAccentSoft: '#2E2A24',
  darkSuccess: '#8CB89D',
  darkWarning: '#C3A16A',
  darkDanger: '#D97B6F',
  darkOverlay: 'rgba(0, 0, 0, 0.72)',
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

export const radius = {
  xs: 2,
  sm: 6,
  md: 12,
  lg: 18,
  xl: 24,
  '2xl': 30,
  full: 999,
} as const;

export const sizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
  '2xl': 64,
  '3xl': 72,
  touch: 44,
} as const;

export const typography = {
  display: {
    size: 56,
    lineHeight: 62,
    letterSpacing: -1.4,
    weight: '600',
  },
  hero: {
    size: 72,
    lineHeight: 76,
    letterSpacing: -1.8,
    weight: '600',
  },
  heading: {
    size: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
    weight: '600',
  },
  title: {
    size: 24,
    lineHeight: 30,
    letterSpacing: -0.25,
    weight: '600',
  },
  body: {
    size: 16,
    lineHeight: 25,
    letterSpacing: 0,
    weight: '400',
  },
  bodyStrong: {
    size: 16,
    lineHeight: 25,
    letterSpacing: 0,
    weight: '600',
  },
  small: {
    size: 14,
    lineHeight: 21,
    letterSpacing: 0,
    weight: '400',
  },
  caption: {
    size: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    weight: '500',
  },
  nav: {
    size: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    weight: '500',
  },
} as const;

export const shadows = {
  soft: '0 10px 26px rgba(17, 17, 17, 0.05)',
  medium: '0 18px 42px rgba(17, 17, 17, 0.08)',
  strong: '0 28px 68px rgba(17, 17, 17, 0.12)',
  darkSoft: '0 12px 30px rgba(0, 0, 0, 0.28)',
  darkMedium: '0 20px 50px rgba(0, 0, 0, 0.36)',
  darkStrong: '0 30px 80px rgba(0, 0, 0, 0.45)',
} as const;

export const layout = {
  pageMaxWidth: 1480,
  contentMaxWidth: 1320,
  readingMaxWidth: 720,
  formMaxWidth: 540,
  compactFormMaxWidth: 460,
} as const;

export const lightTheme = {
  background: colors.background,
  backgroundStrong: colors.paper,
  backgroundMuted: colors.surfaceMuted,
  surface: colors.surfaceStrong,
  surfaceMuted: colors.surfaceMuted,
  surfaceRaised: colors.paper,
  borderColor: colors.border,
  borderColorStrong: colors.borderStrong,
  color: colors.ink,
  colorMuted: colors.mutedInk,
  accent: colors.accent,
  accentStrong: colors.accentStrong,
  accentMuted: colors.accentMuted,
  accentSoft: colors.accentSoft,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  info: colors.info,
  imageBackground: colors.imageBackground,
  shadowColor: 'rgba(17, 17, 17, 0.12)',
  overlay: colors.overlay,
  focusRing: colors.accentStrong,
} as const;

export const darkTheme = {
  background: colors.darkBackground,
  backgroundStrong: colors.darkSurface,
  backgroundMuted: colors.darkSurfaceMuted,
  surface: colors.darkSurface,
  surfaceMuted: colors.darkSurfaceMuted,
  surfaceRaised: colors.darkSurfaceElevated,
  borderColor: colors.darkBorder,
  borderColorStrong: '#4a3e54',
  color: colors.darkInk,
  colorMuted: colors.darkMutedInk,
  accent: colors.darkAccent,
  accentStrong: '#ff977d',
  accentMuted: '#c45f49',
  accentSoft: colors.darkAccentSoft,
  success: colors.darkSuccess,
  warning: colors.darkWarning,
  danger: colors.darkDanger,
  info: '#6fb0df',
  imageBackground: '#242424',
  shadowColor: colors.darkOverlay,
  overlay: colors.darkOverlay,
  focusRing: colors.darkAccent,
} as const;

export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

export type ThemeTokens = typeof themes.light;
