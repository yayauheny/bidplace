import { designTokens } from '@bidplace/design-tokens';

export type AmbientBackgroundVariant = 'product' | 'creator';

export const productAmbientLayers = {
  cool: [
    'rgba(217, 228, 232, 0.52)',
    'rgba(230, 237, 238, 0.22)',
    'rgba(251, 251, 248, 0)',
  ],
  warm: [
    'rgba(242, 234, 224, 0.28)',
    'rgba(247, 242, 235, 0.12)',
    'rgba(251, 251, 248, 0)',
  ],
  veil: [
    'rgba(251, 251, 248, 0.18)',
    'rgba(251, 251, 248, 0.48)',
    designTokens.color.surfaceWarm,
  ],
} as const;

export const creatorAmbientLayers = {
  atmosphere: [
    'rgba(229, 232, 233, 0.62)',
    'rgba(241, 242, 242, 0.38)',
    'rgba(255, 255, 255, 0)',
  ],
  veil: [
    'rgba(255, 255, 255, 0.08)',
    'rgba(255, 255, 255, 0.72)',
    designTokens.color.canvas,
  ],
} as const;
