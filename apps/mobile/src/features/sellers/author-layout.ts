import { designTokens } from '@bidplace/design-tokens';

export function getAuthorWorkColumnCount(width: number): 2 | 3 {
  return width >= designTokens.breakpoint.desktopShell ? 3 : 2;
}
