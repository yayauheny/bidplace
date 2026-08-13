import { designTokens } from '@bidplace/design-tokens';

export const ambientImageOverscanScale = 1.1;

export const ambientGradientColors = [
  'rgba(251, 251, 248, 0.26)',
  'rgba(251, 251, 248, 0.42)',
  'rgba(251, 251, 248, 0.76)',
  designTokens.color.surfaceWarm,
] as const;

export const ambientGradientLocations = [0.3, 0.5, 0.72, 0.92] as const;
