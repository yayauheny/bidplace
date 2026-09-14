import type { ViewStyle } from 'react-native';

export type WebVisibility = 'visible' | 'hidden';

export function webVisibilityStyle(
  visibility: WebVisibility,
): ViewStyle | undefined {
  void visibility;
  return undefined;
}
