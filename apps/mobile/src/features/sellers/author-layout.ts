import { designTokens } from '@bidplace/design-tokens';

export function getAuthorWorkColumnCount(width: number): 1 | 2 | 3 | 4 {
  if (width >= designTokens.breakpoint.catalogFourColumn) return 4;
  if (width >= designTokens.breakpoint.catalogThreeColumn) return 3;
  if (width >= designTokens.breakpoint.catalogTwoColumn) return 2;
  return 1;
}
