import { designTokens } from '@bidplace/design-tokens';

export function isFormPageCompact(width: number): boolean {
  return width < designTokens.breakpoint.productDetailWide;
}

export function getFormPageGutter(width: number): number {
  if (width >= designTokens.breakpoint.desktopShell) {
    return designTokens.layout.desktopGutter;
  }
  if (width >= designTokens.breakpoint.compactHeader) {
    return designTokens.layout.tabletGutter;
  }
  return designTokens.layout.mobileGutter;
}
