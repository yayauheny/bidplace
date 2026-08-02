import { View, type StyleProp, type ViewStyle } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { AppIcon } from './AppIcon';

export function ImagePlaceholder({
  ratio = modernTokens.ratio.productPortrait,
  label = 'Изображение недоступно',
  style,
}: {
  ratio?: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="image"
      style={[
        {
          aspectRatio: ratio,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: modernTokens.color.placeholder,
          borderRadius: modernTokens.radius.image,
        },
        style,
      ]}
    >
      <AppIcon
        name="imageOff"
        color={modernTokens.color.textSecondary}
      />
    </View>
  );
}
