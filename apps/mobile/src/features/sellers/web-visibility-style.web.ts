import type { ViewStyle } from 'react-native';

type WebVisibility = 'visible' | 'hidden';
type WebVisibilityStyle = ViewStyle & { visibility: WebVisibility };

export function webVisibilityStyle(
  visibility: WebVisibility,
): WebVisibilityStyle {
  return { visibility };
}
