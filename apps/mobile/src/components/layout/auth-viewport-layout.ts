import { designTokens } from '@bidplace/design-tokens';

export function isAuthDialog(width: number) {
  return width >= designTokens.auth.dialogMinWidth;
}
