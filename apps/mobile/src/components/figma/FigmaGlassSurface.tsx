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

import { designTokens } from '@bidplace/design-tokens';

import { useAppTheme } from '../../providers/theme-provider';
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
  const palette = useAppTheme();
  const spec = figmaGlassSurfaceSpec(preset, palette);
  const nativeRole =
    accessibilityRole === 'navigation' ? undefined : accessibilityRole;

  if (preset === 'filterControl') {
    return (
      <View
        testID={testID}
        style={[
          { position: 'relative', borderRadius: spec.borderRadius },
          style,
        ]}
      >
        <BlurView
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          blurTarget={blurTarget}
          blurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          blurReductionFactor={designTokens.blur.dockAndroidReductionFactor}
          intensity={spec.nativeIntensity}
          tint="default"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: spec.borderRadius, overflow: 'hidden' },
          ]}
        >
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: spec.background },
            ]}
          />
        </BlurView>
        <View
          accessibilityRole={nativeRole}
          accessibilityLabel={accessibilityLabel}
          style={contentStyle}
        >
          {children}
        </View>
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: spec.borderRadius,
              borderWidth: spec.borderWidth,
              borderColor: spec.borderStart,
            },
          ]}
        />
      </View>
    );
  }

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
        blurReductionFactor={designTokens.blur.dockAndroidReductionFactor}
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
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: spec.background },
          ]}
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
