import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { getApiAssetUrl } from '../../lib/environment';
import { coverFrostSpec, type CoverFrostPlacement } from './cover-frost-style';

export function CoverFrost({
  imageUrl,
  placement,
}: {
  imageUrl: string;
  placement: CoverFrostPlacement;
}) {
  const spec = coverFrostSpec(placement);
  return (
    <View
      aria-hidden
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      testID="figma-cover-frost"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        [spec.top ? 'top' : 'bottom']: 0,
        height: `${spec.heightPercent}%`,
        overflow: 'hidden',
      }}
    >
      <Image
        accessible={false}
        source={{ uri: getApiAssetUrl(imageUrl) }}
        blurRadius={spec.runtimeBlur}
        contentFit="cover"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          [spec.top ? 'top' : 'bottom']: 0,
          aspectRatio: spec.artworkAspectRatio,
        }}
      />
      <LinearGradient
        colors={
          spec.top
            ? [spec.gradientEnd, spec.gradientStart]
            : [spec.gradientStart, spec.gradientEnd]
        }
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
