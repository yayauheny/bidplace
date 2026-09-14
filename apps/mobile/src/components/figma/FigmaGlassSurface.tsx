import type { ReactNode, RefObject } from 'react';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Platform,
  StyleSheet,
  View,
  type AccessibilityRole,
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
  accessibilityRole,
  accessibilityLabel,
}: {
  children: ReactNode;
  preset?: FigmaGlassSurfacePreset;
  blurTarget?: RefObject<View | null>;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  contentClassName?: string;
  testID?: string;
  accessibilityRole?: AccessibilityRole | 'navigation';
  accessibilityLabel?: string;
}) {
  const spec = figmaGlassSurfaceSpec(preset);
  const nativeRole =
    accessibilityRole === 'navigation' ? undefined : accessibilityRole;

  return (
    <LinearGradient
      testID={testID}
      colors={[spec.borderStart, spec.borderEnd]}
      style={[
        styles.border,
        { borderRadius: spec.borderRadius, padding: spec.borderWidth },
        style,
      ]}
    >
      <BlurView
        accessible={false}
        importantForAccessibility="no-hide-descendants"
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
      <View
        accessibilityRole={nativeRole}
        accessibilityLabel={accessibilityLabel}
        style={contentStyle}
      >
        {children}
      </View>
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
