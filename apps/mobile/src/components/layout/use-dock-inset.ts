import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { designTokens } from '@bidplace/design-tokens';

import { useDesktopNavigation } from './public-navigation';

export function dockInset(safeBottom: number) {
  const bottom = Math.max(safeBottom, designTokens.layout.gutter);
  const height = designTokens.size.control + 2 * designTokens.space.dockPad;
  return {
    bottom,
    reserve: height + bottom + designTokens.space.sectionGap,
  };
}

export function useDockInset() {
  const { bottom: safeBottom } = useSafeAreaInsets();
  const desktop = useDesktopNavigation();
  return desktop ? { bottom: 0, reserve: 0 } : dockInset(safeBottom);
}
