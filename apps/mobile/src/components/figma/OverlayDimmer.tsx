import { Pressable, View } from 'react-native';

import { overlayDimmerStyle } from './overlay-dimmer';

export function OverlayDimmer({ onPress }: { onPress?: () => void }) {
  if (!onPress) {
    return (
      <View
        pointerEvents="none"
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={overlayDimmerStyle()}
      />
    );
  }

  return (
    <Pressable
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      onPress={onPress}
      style={overlayDimmerStyle()}
    />
  );
}
