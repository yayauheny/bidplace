import { Platform } from 'react-native';

export const modernColors = {
  canvas: '#F7F4EE',
  surface: '#FFFFFF',
  surfaceMuted: '#F1EEE8',
  ink: '#111111',
  inkSoft: '#252525',
  textSecondary: '#77736D',
  textMuted: '#A5A099',
  border: '#E2DDD4',
  chip: '#EEEAE4',
  placeholder: '#D8D4CD',
  accent: '#D94A24',
  accentDark: '#BC3C1B',
  accentSoft: '#FFF0E8',
  success: '#3F7A48',
  danger: '#D6453D',
  overlay: 'rgba(0, 0, 0, 0.22)',
} as const;

export const modernSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 32,
  largeSection: 40,
  page: 20,
  pageWide: 32,
} as const;

export const modernRadius = {
  control: 14,
  image: 16,
  button: 18,
  panel: 22,
  sheet: 28,
  pill: 999,
} as const;

export const modernFonts = {
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansStrong: 'Inter_600SemiBold',
  mono: 'PTMono_400Regular',
  fallbackMono: Platform.select({ web: 'monospace', default: 'monospace' }),
} as const;
