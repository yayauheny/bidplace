import { View, type ViewStyle } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

export function Skeleton({ style }: { style?: ViewStyle }) {
  return (
    <View
      accessible={false}
      style={[
        {
          backgroundColor: modernTokens.color.placeholder,
          borderRadius: modernTokens.radius.small,
        },
        style,
      ]}
    />
  );
}
