export const themeNames = ['light', 'dark'] as const;

export type ThemeName = (typeof themeNames)[number];

export const colors = {
  cream: '#f8f1e8',
  paper: '#fffaf5',
  surface: '#fff4eb',
  surfaceMuted: '#f3e7dd',
  surfaceStrong: '#ffffff',
  border: '#e7d5c8',
  borderStrong: '#ceb6a8',
  ink: '#20161f',
  mutedInk: '#6d5b66',
  accent: '#d4573f',
  accentStrong: '#b8422f',
  accentSoft: '#f6d8cf',
  accentMuted: '#7d4238',
  success: '#2f7a4a',
  warning: '#b77716',
  danger: '#c14343',
  info: '#2c6ca3',
  overlay: 'rgba(23, 16, 22, 0.56)',
  darkBackground: '#110e16',
  darkSurface: '#191521',
  darkSurfaceElevated: '#231c2d',
  darkSurfaceMuted: '#2a2236',
  darkBorder: '#3a3143',
  darkInk: '#f6efe9',
  darkMutedInk: '#b6abb5',
  darkAccent: '#ff7b63',
  darkAccentSoft: '#442119',
  darkSuccess: '#53ad73',
  darkWarning: '#d3a14a',
  darkDanger: '#ee7474',
  darkOverlay: 'rgba(7, 5, 10, 0.7)',
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
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const sizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
  '2xl': 64,
  touch: 44,
} as const;

export const typography = {
  display: {
    size: 48,
    lineHeight: 56,
    letterSpacing: -1.1,
    weight: '700',
  },
  heading: {
    size: 32,
    lineHeight: 38,
    letterSpacing: -0.6,
    weight: '700',
  },
  title: {
    size: 24,
    lineHeight: 30,
    letterSpacing: -0.2,
    weight: '650',
  },
  body: {
    size: 16,
    lineHeight: 24,
    letterSpacing: 0,
    weight: '400',
  },
  bodyStrong: {
    size: 16,
    lineHeight: 24,
    letterSpacing: 0,
    weight: '600',
  },
  small: {
    size: 14,
    lineHeight: 20,
    letterSpacing: 0,
    weight: '400',
  },
  caption: {
    size: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
    weight: '500',
  },
} as const;

export const shadows = {
  soft: '0 10px 30px rgba(39, 22, 19, 0.08)',
  medium: '0 18px 50px rgba(39, 22, 19, 0.12)',
  strong: '0 30px 80px rgba(39, 22, 19, 0.18)',
  darkSoft: '0 12px 30px rgba(0, 0, 0, 0.35)',
  darkMedium: '0 20px 50px rgba(0, 0, 0, 0.45)',
  darkStrong: '0 30px 80px rgba(0, 0, 0, 0.55)',
} as const;

export const layout = {
  pageMaxWidth: 1280,
  contentMaxWidth: 1040,
  readingMaxWidth: 720,
} as const;

export const lightTheme = {
  background: colors.cream,
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
  shadowColor: 'rgba(39, 22, 19, 0.14)',
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
  shadowColor: colors.darkOverlay,
  overlay: colors.darkOverlay,
  focusRing: colors.darkAccent,
} as const;

export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

export type ThemeTokens = typeof themes.light;
