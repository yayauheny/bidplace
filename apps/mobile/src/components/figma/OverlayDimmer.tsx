import { Pressable, View } from 'react-native';

import { useAppTheme } from '../../providers/theme-provider';
import { overlayDimmerStyle } from './overlay-dimmer';

const dimmerProps = {
  testID: 'overlay-dimmer',
  accessible: false,
  importantForAccessibility: 'no-hide-descendants' as const,
};

export function OverlayDimmer({ onPress }: { onPress?: () => void }) {
  const palette = useAppTheme();
  if (!onPress) {
    return <View {...dimmerProps} style={overlayDimmerStyle(palette)} />;
  }

  return (
    <Pressable
      {...dimmerProps}
      onPress={onPress}
      style={overlayDimmerStyle(palette)}
    />
  );
}
