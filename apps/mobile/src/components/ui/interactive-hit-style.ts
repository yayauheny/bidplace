import { Platform, type ViewStyle } from 'react-native';

import { type SemanticColorMap } from '@bidplace/design-tokens';

export function interactiveHitDataset() {
  return Platform.OS === 'web'
    ? ({ dataSet: { interactiveHit: true } } as object)
    : {};
}

export function coverHitDataset() {
  return Platform.OS === 'web'
    ? ({ dataSet: { coverHit: true } } as object)
    : {};
}

export function interactiveHitFallbackStyle({
  hovered,
  pressed,
  palette,
}: {
  hovered: boolean;
  pressed: boolean;
  palette: SemanticColorMap;
}): ViewStyle | null {
  if (Platform.OS === 'web') return null;
  return {
    backgroundColor: pressed
      ? palette.mutedHover
      : hovered
        ? palette.ghostHover
        : 'transparent',
  };
}
