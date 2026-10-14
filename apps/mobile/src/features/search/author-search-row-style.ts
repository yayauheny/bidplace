import type { ViewStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

export function authorSearchRowStyle(): ViewStyle {
  return {
    display: 'flex',
    width: '100%',
    minHeight: designTokens.size.touch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.space.x3,
    paddingVertical: designTokens.space.x1,
    paddingHorizontal: designTokens.space.x2,
    marginHorizontal: -designTokens.space.x2,
    borderRadius: designTokens.radius.small,
  };
}
