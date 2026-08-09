import { designTokens } from '@bidplace/design-tokens';

export type AuthLayoutMode = 'stacked' | 'split';

export function getAuthLayoutMode(width: number): AuthLayoutMode {
  return width >= designTokens.breakpoint.productDetailWide
    ? 'split'
    : 'stacked';
}

export function getAuthLayoutGutter(width: number): number {
  if (width >= designTokens.breakpoint.desktopShell) {
    return designTokens.layout.desktopGutter;
  }
  if (width >= designTokens.breakpoint.compactHeader) {
    return designTokens.layout.tabletGutter;
  }
  return designTokens.layout.mobileGutter;
}
