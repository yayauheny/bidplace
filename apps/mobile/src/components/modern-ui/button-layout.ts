import type { ViewStyle } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

export type ButtonWidth = 'content' | 'compact' | 'block';

export function buttonContentLayoutStyle(hasIcon: boolean): ViewStyle {
  return {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hasIcon ? modernTokens.space.x2 : 0,
  };
}

export function buttonLoadingOverlayStyle(): ViewStyle {
  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -modernTokens.size.icon / 2 }, { translateY: -modernTokens.size.icon / 2 }],
  };
}

export function buttonLayoutStyle(width: ButtonWidth = 'content'): ViewStyle {
  return {
    alignSelf: width === 'block' ? 'stretch' : 'flex-start',
    paddingHorizontal:
      width === 'compact' ? modernTokens.space.x3 : modernTokens.space.x5,
    ...(width === 'block' ? { width: '100%' } : {}),
  };
}
