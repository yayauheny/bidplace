/**
 * Semantic color contract for the app theme.
 *
 * `lightColorMap` is the single source of light values, measured from the
 * live Figma file `pAPQo6cADmG5XzVmBX76EE` — moved here verbatim from the
 * former `designTokens.color` block. `blackColorMap` shares the exact same
 * key contract (`SemanticColorMap`), so typecheck fails when a black role
 * is missing.
 *
 * NEEDS-FIGMA: the black values are a provisional high-contrast test
 * palette chosen to exercise the theme wiring. They are NOT the design;
 * replace them with the live Figma black values before enabling a black
 * theme for users. Do not read palette completeness as design approval.
 */

export const lightColorMap = {
  canvas: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceWarm: '#FFFFFF',
  surfaceMuted: '#F3F3F3',
  surfaceStrong: '#E8E8E8',
  mediaStage: '#E9E9E9',
  previewSurface: '#FAFAFA',
  previewBorder: '#E3E3E3',
  surfacePanel: '#F3F3F3',
  searchSurface: '#F3F3F3',
  dialogSurface: '#FFFFFF',
  ink: '#2A2A2A',
  inkSoft: '#2A2A2A',
  // Figma variable `Black`: media sheet heading and close glyph.
  inkStrong: '#121212',
  textSecondary: '#8A8A8A',
  textMuted: '#8A8A8A',
  tabInactive: '#565656',
  textSubdued: '#565656',
  gray2: '#858585',
  legalText: '#858585',
  legalLink: '#001ECA',
  border: '#DEDEDE',
  borderStrong: '#2A2A2A',
  divider: '#E2E2E2',
  chip: 'rgba(0, 0, 0, 0.15)',
  chipOutline: 'rgba(255, 255, 255, 0.16)',
  // Gradient stroke stops of onDark/tinted chips (light values verbatim from
  // the former literal in figma-chip-style).
  chipBorderGradientStart: 'rgba(255, 255, 255, 0.16)',
  chipBorderGradientEnd: 'rgba(153, 153, 153, 0.16)',
  placeholder: '#8A8A8A',
  action: '#292929',
  actionHover: '#000000',
  accent: '#E9401A',
  accentDark: '#E9401A',
  accentSoft: '#F3F3F3',
  success: '#039600',
  warning: '#A66B12',
  danger: '#FF0000',
  dangerHover: '#C40000',
  destructiveFill: '#D22F0B',
  feedbackDangerSurface: '#FFF0F0',
  feedbackDangerTitle: '#A51E28',
  feedbackDangerText: '#9D4D52',
  error: '#FF0000',
  focus: '#121212',
  overlay: 'rgba(41, 41, 41, 0.70)',
  overlayScrim: 'rgba(0, 0, 0, 0.70)',
  glass: 'rgba(255, 255, 255, 0.60)',
  glassStrong: 'rgba(255, 255, 255, 0.80)',
  glassChip: 'rgba(255, 255, 255, 0.70)',
  glassBorder: '#DEDEDE',
  glassBorderEnd: '#F3F3F3',
  atmosphereWash: 'rgba(255, 255, 255, 0.40)',
  modalDimmer: 'rgba(42, 42, 42, 0.50)',
  headerControl: '#F3F3F3',
  solid: '#292929',
  solidHover: '#000000',
  solidDisabled: '#949494',
  muted: '#8A8A8A',
  fieldLabel: '#999999',
  fieldValue: '#121212',
  fieldIcon: '#858585',
  // Empty border and placeholder of the `authorApplication` field variant.
  authorApplicationField: '#999999',
  // Username availability status on the registration nickname step.
  usernameAvailable: '#267B07',
  usernameTaken: '#731A06',
  // Report action on the author share sheet (Figma 06). Own role on purpose:
  // same light hex as usernameTaken, different meaning — do not merge.
  report: '#731A06',
  // Hairline border of the story editor tool pill.
  toolbarBorder: '#D1D1D1',
  // Front card elevation of the home author fan (Frame 47 geometry).
  fanShadow: '0 6px 20px rgba(58, 58, 58, 0.40)',
  // Guide lines drawn over the author photo placeholder (Стать автором 527:16416).
  photoGuide: '#911E05',
  fieldHoverBorder: '#535353',
  ghostHover: '#F7F7F7',
  mutedFill: '#F3F3F3',
  mutedHover: '#E8E8E8',
  quietFill: '#EFEFEF',
  // Account caption signature (account @handle, settings group label).
  // Same light hex as gray2, own role: do not rename gray2 consumers.
  accountMeta: '#858585',
  // Settings list divider — same light hex as quietFill, different purpose
  // (hairline separator, not fill); do not merge.
  settingsDivider: '#EFEFEF',
  quietBorderStart: '#FFFFFF',
  quietBorderEnd: '#999999',
  textSubtle: '#6F6F6F',
  fieldHoverFill: '#FCFCFC',
  saleLive: '#E9401A',
  saleAnnounce: '#51E91A',
  white: '#FFFFFF',
  // Button-only roles (former figmaButtonTokens palette; light values verbatim).
  onAction: '#FFFFFF',
  mutedStroke: '#F3F3F3',
  solidBorderGradientStart: '#2A2A2A',
  solidBorderGradientEnd: '#585858',
  outlineBorderGradientStart: '#D1D1D1',
  outlineBorderGradientEnd: '#EBEBEB',
  searchChromeGradientStart: '#D1D1D1',
  searchChromeGradientEnd: '#EBEBEB',
  dialogBorder: 'rgba(20, 20, 20, 0.08)',
  overlayOnSolid: 'rgba(255, 255, 255, 0.15)',
  overlayOnLight: 'rgba(0, 0, 0, 0.05)',
  overlayOnMuted: 'rgba(0, 0, 0, 0.06)',
  floatingShadow: '0 10px 24px rgba(17, 17, 17, 0.12)',
  // Account avatar placeholder disc (Figma account screen).
  accountAvatarPlaceholder: '#E0E0E0',
  // Settings group surface (Figma #FBFBFB, radius radius.sheet).
  settingsSurface: '#FBFBFB',
} as const;

export type SemanticColorRole = keyof typeof lightColorMap;
export type SemanticColorMap = Record<SemanticColorRole, string>;
export type AppThemeName = 'light' | 'black';

/**
 * Provisional black palette — NEEDS-FIGMA (see file header). High-contrast
 * dark values for exercising the theme wiring only.
 */
export const blackColorMap: SemanticColorMap = {
  canvas: '#0E0E0E',
  surface: '#161616',
  surfaceWarm: '#1A1815',
  surfaceMuted: '#242424',
  surfaceStrong: '#2E2E2E',
  mediaStage: '#2E2E2E',
  previewSurface: '#242424',
  previewBorder: '#3A3A3A',
  surfacePanel: '#1E1E1E',
  searchSurface: '#1E1E1E',
  dialogSurface: '#1C1C1C',
  ink: '#ECECEC',
  inkSoft: '#E6E6E6',
  inkStrong: '#FFFFFF',
  textSecondary: '#A3A3A3',
  textMuted: '#A3A3A3',
  tabInactive: '#B5B5B5',
  textSubdued: '#9A9A9A',
  gray2: '#8F8F8F',
  legalText: '#8F8F8F',
  legalLink: '#ADC0FF',
  border: '#3A3A3A',
  borderStrong: '#ECECEC',
  divider: '#2C2C2C',
  chip: 'rgba(255, 255, 255, 0.18)',
  chipOutline: 'rgba(0, 0, 0, 0.35)',
  // Provisional black gradient stops for the chip stroke — NEEDS-FIGMA.
  chipBorderGradientStart: 'rgba(255, 255, 255, 0.22)',
  chipBorderGradientEnd: 'rgba(150, 150, 150, 0.22)',
  placeholder: '#8F8F8F',
  action: '#F2F2F2',
  actionHover: '#FFFFFF',
  accent: '#FF5A36',
  accentDark: '#FF6A4A',
  accentSoft: '#2A1A16',
  success: '#2FBF71',
  warning: '#D9A44A',
  danger: '#FF4D4D',
  dangerHover: '#FF7070',
  destructiveFill: '#D22F0B',
  feedbackDangerSurface: '#3A1B20',
  feedbackDangerTitle: '#FF7070',
  feedbackDangerText: '#FFB4B4',
  error: '#FF4D4D',
  focus: '#FFFFFF',
  overlay: 'rgba(10, 10, 10, 0.72)',
  overlayScrim: 'rgba(0, 0, 0, 0.78)',
  glass: 'rgba(22, 22, 22, 0.60)',
  glassStrong: 'rgba(22, 22, 22, 0.80)',
  glassChip: 'rgba(30, 30, 30, 0.70)',
  glassBorder: '#3A3A3A',
  glassBorderEnd: '#242424',
  atmosphereWash: 'rgba(14, 14, 14, 0.40)',
  modalDimmer: 'rgba(0, 0, 0, 0.55)',
  headerControl: '#242424',
  solid: '#F2F2F2',
  solidHover: '#FFFFFF',
  solidDisabled: '#5C5C5C',
  muted: '#A3A3A3',
  fieldLabel: '#8F8F8F',
  fieldValue: '#F5F5F5',
  fieldIcon: '#8F8F8F',
  authorApplicationField: '#8F8F8F',
  // Provisional black availability colors — NEEDS-FIGMA.
  usernameAvailable: '#4CC26B',
  usernameTaken: '#FF7A5C',
  // Provisional black — NEEDS-FIGMA.
  report: '#FF7A5C',
  toolbarBorder: '#4A4A4A',
  fanShadow: '0 6px 20px rgba(0, 0, 0, 0.55)',
  photoGuide: '#FF6A4A',
  fieldHoverBorder: '#8A8A8A',
  ghostHover: '#232323',
  mutedFill: '#242424',
  mutedHover: '#2E2E2E',
  quietFill: '#202020',
  accountMeta: '#8F8F8F',
  settingsDivider: '#2C2C2C',
  quietBorderStart: '#161616',
  quietBorderEnd: '#8F8F8F',
  textSubtle: '#9A9A9A',
  fieldHoverFill: '#191919',
  saleLive: '#FF5A36',
  saleAnnounce: '#6FE93B',
  white: '#FFFFFF',
  // Provisional black values for the button roles — NEEDS-FIGMA.
  onAction: '#121212',
  mutedStroke: '#2E2E2E',
  solidBorderGradientStart: '#4A4A4A',
  solidBorderGradientEnd: '#6E6E6E',
  outlineBorderGradientStart: '#4A4A4A',
  outlineBorderGradientEnd: '#333333',
  searchChromeGradientStart: '#4A4A4A',
  searchChromeGradientEnd: '#333333',
  dialogBorder: 'rgba(255, 255, 255, 0.14)',
  overlayOnSolid: 'rgba(0, 0, 0, 0.18)',
  overlayOnLight: 'rgba(255, 255, 255, 0.08)',
  overlayOnMuted: 'rgba(255, 255, 255, 0.10)',
  floatingShadow: '0 10px 24px rgba(0, 0, 0, 0.5)',
  accountAvatarPlaceholder: '#2E2E2E',
  settingsSurface: '#1E1E1E',
};

export const appColorMaps: Record<AppThemeName, SemanticColorMap> = {
  light: lightColorMap,
  black: blackColorMap,
};
