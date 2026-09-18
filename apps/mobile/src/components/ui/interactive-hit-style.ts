import { Platform, type ViewStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

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
}: {
  hovered: boolean;
  pressed: boolean;
}): ViewStyle | null {
  if (Platform.OS === 'web') return null;
  return {
    backgroundColor: pressed
      ? designTokens.color.mutedHover
      : hovered
        ? designTokens.color.ghostHover
        : 'transparent',
  };
}
