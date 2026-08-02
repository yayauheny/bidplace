import { modernTokens } from '@bidplace/design-tokens';

export function getCatalogColumnCount(width: number): 2 | 3 | 4 {
  if (width >= modernTokens.breakpoint.catalogFourColumn) return 4;
  if (width >= modernTokens.breakpoint.catalogThreeColumn) return 3;
  return 2;
}
