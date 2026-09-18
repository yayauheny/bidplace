import type { ViewStyle } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

export function authorSearchRowStyle(): ViewStyle {
  return {
    display: 'flex',
    width: '100%',
    minHeight: figmaTokens.size.touch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaTokens.space.x3,
    paddingVertical: figmaTokens.space.x1,
    paddingHorizontal: figmaTokens.space.x2,
    marginHorizontal: -figmaTokens.space.x2,
    borderRadius: figmaTokens.radius.small,
  };
}
