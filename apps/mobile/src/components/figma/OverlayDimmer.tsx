import { Pressable, View } from 'react-native';

import { overlayDimmerStyle } from './overlay-dimmer';

const dimmerProps = {
  testID: 'overlay-dimmer',
  accessible: false,
  importantForAccessibility: 'no-hide-descendants' as const,
};

export function OverlayDimmer({ onPress }: { onPress?: () => void }) {
  if (!onPress) {
    return <View {...dimmerProps} style={overlayDimmerStyle()} />;
  }

  return (
    <Pressable {...dimmerProps} onPress={onPress} style={overlayDimmerStyle()} />
  );
}
