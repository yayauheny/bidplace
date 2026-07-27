import { View, type ViewStyle } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

export function Separator({ style }: { style?: ViewStyle }) {
  return <View accessibilityElementsHidden style={[{ height: 1, backgroundColor: modernTokens.color.border }, style]} />;
}
