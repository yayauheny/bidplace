import { designTokens } from '@bidplace/design-tokens';

export const ambientImageOverscanScale = 1.1;

export const ambientGradientColors = [
  'rgba(251, 251, 248, 0.04)',
  'rgba(251, 251, 248, 0.16)',
  'rgba(251, 251, 248, 0.52)',
  designTokens.color.surfaceWarm,
] as const;

export const ambientGradientLocations = [0.42, 0.62, 0.82, 1] as const;
