import { modernTokens } from '@bidplace/design-tokens';

export function getAuthorWorkColumnCount(width: number): 2 | 3 {
  return width >= modernTokens.breakpoint.desktopShell ? 3 : 2;
}
