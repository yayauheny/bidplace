import { View } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { AppIcon } from './AppIcon';

export function ImagePlaceholder({ ratio = 4 / 5, label = 'Изображение недоступно' }: { ratio?: number; label?: string }) {
  return (
    <View accessibilityLabel={label} style={{ aspectRatio: ratio, alignItems: 'center', justifyContent: 'center', backgroundColor: modernTokens.color.placeholder, borderRadius: modernTokens.radius.image }}>
      <AppIcon name="imageOff" color={modernTokens.color.textSecondary} label={label} />
    </View>
  );
}
