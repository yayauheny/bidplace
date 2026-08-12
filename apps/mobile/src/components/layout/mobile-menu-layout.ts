import { designTokens } from '@bidplace/design-tokens';

export function getMobileMenuWidth(viewportWidth: number): number {
  return Math.min(
    designTokens.layout.mobileMenuWidth,
    Math.max(0, viewportWidth - designTokens.space.x8),
  );
}
