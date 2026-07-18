import { colors, layout, radius, sizes, spacing, typography } from '@bidplace/design-tokens';

export const mobileSpacing = spacing;
export const mobileRadius = radius;
export const mobileSizes = sizes;
export const mobileLayout = layout;
export const appMedia = {
  mobileMax: 640,
  tabletMax: 1024,
  desktopMin: 1025,
  wideMin: 1440,
} as const;
export const fontFamilies = {
  serifRegular: 'CormorantGaramond_500Medium',
  serifStrong: 'CormorantGaramond_600SemiBold',
  sansRegular: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansStrong: 'Inter_600SemiBold',
} as const;

export const lightTheme = {
  background: colors.background,
  surface: colors.surfaceStrong,
  surfaceMuted: colors.surfaceMuted,
  surfaceRaised: colors.paper,
  border: colors.border,
  borderStrong: colors.borderStrong,
  text: colors.ink,
  textMuted: colors.mutedInk,
  primary: colors.accent,
  primaryPressed: colors.accentStrong,
  primarySoft: colors.accentSoft,
  onPrimary: '#FFFFFF',
  success: colors.success,
  successSoft: '#EAF7F0',
  warning: colors.warning,
  warningSoft: '#FFF4D6',
  danger: colors.danger,
  dangerSoft: '#FDECEC',
  info: colors.info,
  imageBackground: colors.imageBackground,
  overlay: colors.overlay,
  shadowColor: 'rgba(17, 17, 17, 0.12)',
  focusRing: colors.accentStrong,
} as const;

export type AppThemePalette = Record<keyof typeof lightTheme, string>;

export const darkTheme = {
  background: colors.darkBackground,
  surface: colors.darkSurface,
  surfaceMuted: colors.darkSurfaceMuted,
  surfaceRaised: colors.darkSurfaceElevated,
  border: colors.darkBorder,
  borderStrong: '#4a3e54',
  text: colors.darkInk,
  textMuted: colors.darkMutedInk,
  primary: colors.darkAccent,
  primaryPressed: '#ff977d',
  primarySoft: colors.darkAccentSoft,
  onPrimary: '#110e16',
  success: colors.darkSuccess,
  successSoft: '#1b3327',
  warning: colors.darkWarning,
  warningSoft: '#3d311d',
  danger: colors.darkDanger,
  dangerSoft: '#3b1c22',
  info: '#6fb0df',
  imageBackground: '#242424',
  overlay: colors.darkOverlay,
  shadowColor: colors.darkOverlay,
  focusRing: colors.darkAccent,
} as const satisfies AppThemePalette;

export const typographyTokens = typography;
