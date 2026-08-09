import { View, type ViewStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

export function Separator({ style }: { style?: ViewStyle }) {
  return <View accessibilityElementsHidden style={[{ height: 1, backgroundColor: designTokens.color.border }, style]} />;
}
