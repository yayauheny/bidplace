import type { ReactNode, RefObject } from 'react';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

export function FloatingDockFrame({
  bottom,
  blurTarget,
  children,
}: {
  bottom: number;
  blurTarget: RefObject<View | null>;
  children: ReactNode;
}) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom,
        alignItems: 'center',
        zIndex: figmaTokens.layer.popover,
      }}
    >
      <LinearGradient
        colors={[
          figmaTokens.color.glassBorder,
          figmaTokens.color.glassBorderEnd,
        ]}
        style={{
          borderRadius: figmaTokens.radius.dock,
          padding: 0.5,
        }}
      >
        <BlurView
          testID="figma-floating-dock"
          accessibilityRole="tablist"
          accessibilityLabel="Основная навигация"
          blurTarget={blurTarget}
          blurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          blurReductionFactor={figmaTokens.blur.dockAndroidReductionFactor}
          intensity={figmaTokens.blur.dockNativeIntensity}
          tint="default"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: figmaTokens.space.dockGap,
            padding: figmaTokens.space.dockPad - 0.5,
            borderRadius: figmaTokens.radius.dock - 0.5,
            overflow: 'hidden',
          }}
        >
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: figmaTokens.color.glass },
            ]}
          />
          {children}
        </BlurView>
      </LinearGradient>
    </View>
  );
}
