import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { designTokens } from '@bidplace/design-tokens';

export function useDockInset() {
  const { bottom: safeBottom } = useSafeAreaInsets();
  const bottom = Math.max(safeBottom, designTokens.layout.gutter);
  const height = designTokens.size.control + 2 * designTokens.space.dockPad;
  return {
    bottom,
    reserve: height + bottom + designTokens.space.sectionGap,
  };
}
