import { brand, colors, layout, radius, sizes, spacing, typography, lightTheme } from '@bidplace/design-tokens';

// Re-export layout primitives used across the app
export const mobileSpacing = spacing;
export const mobileRadius = radius;
export const mobileSizes = sizes;
export const mobileLayout = layout;
export const mobileBrand = brand;

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

// Single light theme — MVP is light-only.
// Dark theme will be a new token map in a future task.
export { lightTheme } from '@bidplace/design-tokens';

export type AppThemePalette = typeof lightTheme;

export const typographyTokens = typography;

// Tamagui-compatible theme shape (keys match $tokens used in JSX)
export const tamaguiTheme = {
  background: lightTheme.background,
  surface: lightTheme.surface,
  surfaceMuted: lightTheme.surfaceMuted,

  border: lightTheme.borderColor,
  borderStrong: lightTheme.borderColorStrong,

  text: lightTheme.color,
  textSecondary: lightTheme.colorSecondary,
  textMuted: lightTheme.colorMuted,

  primary: lightTheme.primary,
  primaryHover: lightTheme.primaryHover,
  primaryPressed: lightTheme.primaryPressed,
  primaryTint: lightTheme.primaryTint,
  onPrimary: lightTheme.onPrimary,
  focusRing: lightTheme.focusRing,

  positive: lightTheme.positive,
  positiveTint: lightTheme.positiveTint,
  warning: lightTheme.warning,
  warningTint: lightTheme.warningTint,
  negative: lightTheme.negative,
  negativeTint: lightTheme.negativeTint,

  imageBackground: lightTheme.imageBackground,
  overlay: lightTheme.overlay,
} as const;

export type TamaguiTheme = typeof tamaguiTheme;

// Color palette for direct usage (non-Tamagui contexts)
export const palette = colors;
