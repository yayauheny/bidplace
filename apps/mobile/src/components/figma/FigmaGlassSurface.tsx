import type { ReactNode, RefObject } from 'react';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  figmaGlassSurfaceSpec,
  type FigmaGlassSurfacePreset,
} from './figma-glass-surface-style';

export function FigmaGlassSurface({
  children,
  preset = 'controlGroup',
  blurTarget,
  style,
  contentStyle,
  testID,
}: {
  children: ReactNode;
  preset?: FigmaGlassSurfacePreset;
  blurTarget?: RefObject<View | null>;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const spec = figmaGlassSurfaceSpec(preset);

  return (
    <LinearGradient
      colors={[spec.borderStart, spec.borderEnd]}
      style={[
        styles.border,
        { borderRadius: spec.borderRadius, padding: spec.borderWidth },
        style,
      ]}
    >
      <BlurView
        testID={testID}
        accessible={false}
        blurTarget={blurTarget}
        blurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        blurReductionFactor={figmaTokens.blur.dockAndroidReductionFactor}
        intensity={spec.nativeIntensity}
        tint="default"
        style={[
          styles.blur,
          {
            top: spec.borderWidth,
            right: spec.borderWidth,
            bottom: spec.borderWidth,
            left: spec.borderWidth,
            borderRadius: spec.borderRadius - spec.borderWidth,
          },
        ]}
      >
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: spec.background }]}
        />
      </BlurView>
      <View style={contentStyle}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  border: {
    position: 'relative',
    overflow: 'hidden',
  },
  blur: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
