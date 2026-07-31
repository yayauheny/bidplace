import type { ViewStyle } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

export type ButtonWidth = 'content' | 'compact' | 'block';

export function buttonLayoutStyle(width: ButtonWidth = 'content'): ViewStyle {
  return {
    alignSelf: width === 'block' ? 'stretch' : 'flex-start',
    paddingHorizontal:
      width === 'compact' ? modernTokens.space.x3 : modernTokens.space.x5,
    ...(width === 'block' ? { width: '100%' } : {}),
  };
}
