import type { ViewStyle } from 'react-native';

export type WebVisibility = 'visible' | 'hidden';

export function webVisibilityStyle(
  _visibility: WebVisibility,
): ViewStyle | undefined {
  return undefined;
}
