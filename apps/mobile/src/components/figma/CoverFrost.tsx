import { BlurView } from 'expo-blur';
import type { RefObject } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppTheme } from '../../providers/theme-provider';
import { coverFrostSpec, type CoverFrostPlacement } from './cover-frost-style';

export function CoverFrost({
  blurTarget,
  placement,
}: {
  imageUrl: string;
  placement: CoverFrostPlacement;
  blurTarget?: RefObject<View | null>;
}) {
  const palette = useAppTheme();
  const spec = coverFrostSpec(placement, palette);
  return (
    <View
      aria-hidden
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      testID="figma-cover-frost"
      style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
    >
      {!spec.top ? (
        <BlurView
          pointerEvents="none"
          blurTarget={blurTarget}
          intensity={spec.runtimeBlur}
          tint="default"
          blurMethod={
            Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : undefined
          }
          style={StyleSheet.absoluteFill}
        />
      ) : null}
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
