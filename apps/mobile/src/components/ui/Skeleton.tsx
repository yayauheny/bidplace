import { View, type ViewStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

export function Skeleton({ style }: { style?: ViewStyle }) {
  return (
    <View
      accessible={false}
      style={[
        {
          backgroundColor: designTokens.color.placeholder,
          borderRadius: designTokens.radius.small,
        },
        style,
      ]}
    />
  );
}
