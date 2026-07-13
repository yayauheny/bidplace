import { colors, layout, radius, sizes, spacing, typography } from '@bidplace/design-tokens';

export const mobileSpacing = spacing;
export const mobileRadius = radius;
export const mobileSizes = sizes;
export const mobileLayout = {
  ...layout,
  formMaxWidth: 520,
  compactFormMaxWidth: 440,
} as const;

export const lightTheme = {
  background: colors.paper,
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
  overlay: colors.overlay,
  shadowColor: 'rgba(39, 22, 19, 0.14)',
  focusRing: colors.accentStrong,
} as const;

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
  overlay: colors.darkOverlay,
  shadowColor: colors.darkOverlay,
  focusRing: colors.darkAccent,
} as const;

export const typographyTokens = typography;
