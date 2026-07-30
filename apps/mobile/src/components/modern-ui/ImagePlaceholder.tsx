import { View, type StyleProp, type ViewStyle } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { AppIcon } from './AppIcon';

export function ImagePlaceholder({
  ratio = 4 / 5,
  label = 'Изображение недоступно',
  style,
}: {
  ratio?: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View accessibilityLabel={label} style={[{ aspectRatio: ratio, alignItems: 'center', justifyContent: 'center', backgroundColor: modernTokens.color.placeholder, borderRadius: modernTokens.radius.image }, style]}>
      <AppIcon name="imageOff" color={modernTokens.color.textSecondary} label={label} />
    </View>
  );
}
