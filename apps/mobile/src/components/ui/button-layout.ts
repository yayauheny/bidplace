import type { ViewStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

export type ButtonWidth = 'content' | 'compact' | 'block';

export function buttonContentLayoutStyle(hasIcon: boolean): ViewStyle {
  return {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hasIcon ? designTokens.space.x2 : 0,
  };
}

export function buttonLoadingOverlayStyle(): ViewStyle {
  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -designTokens.size.icon / 2 }, { translateY: -designTokens.size.icon / 2 }],
  };
}

export function buttonLayoutStyle(
  width: ButtonWidth = 'content',
  alignSelf: ViewStyle['alignSelf'] = 'flex-start',
): ViewStyle {
  return {
    alignSelf: width === 'block' ? 'stretch' : alignSelf,
    paddingHorizontal:
      width === 'compact' ? designTokens.space.x3 : designTokens.space.x5,
    ...(width === 'block' ? { width: '100%' } : {}),
  };
}
