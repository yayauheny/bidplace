import { View, type StyleProp, type ViewStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppIcon } from './AppIcon';

export function ImagePlaceholder({
  ratio = designTokens.ratio.productPortrait,
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
          backgroundColor: designTokens.color.placeholder,
          borderRadius: designTokens.radius.image,
        },
        style,
      ]}
    >
      <AppIcon
        name="imageOff"
        color={designTokens.color.textSecondary}
      />
    </View>
  );
}
