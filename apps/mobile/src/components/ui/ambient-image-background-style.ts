import { designTokens } from '@bidplace/design-tokens';

export const ambientImageOverscanScale = 1.1;

export const ambientGradientColors = [
  'rgba(251, 251, 248, 0.02)',
  'rgba(251, 251, 248, 0.1)',
  'rgba(251, 251, 248, 0.38)',
  designTokens.color.surfaceWarm,
] as const;

export const ambientGradientLocations = [0.36, 0.58, 0.8, 1] as const;
