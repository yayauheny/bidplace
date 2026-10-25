import type { ElementRef, Ref } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { FigmaGlassSurface } from './FigmaGlassSurface';
import { designTokens } from '@bidplace/design-tokens';

import { useReducedMotion } from '../../lib/reduced-motion';
import { motionPressableFeedback } from '../ui/motion-pressable-feedback';
import { MotionPressable } from '../ui/MotionPressable';
import { useAppTheme } from '../../providers/theme-provider';
import { FigmaIcon } from './FigmaIcon';
import { type FigmaIconName } from './figma-icon-names';
import {
  figmaIconButtonHitSlop,
  figmaIconButtonStyle,
} from './figma-icon-button-style';

export function FigmaIconButton({
  ref,
  icon,
  label,
  onPress,
  disabled = false,
  selected = false,
  expanded,
  iconSize = designTokens.size.icon,
  strokeWidthPx = designTokens.stroke.iconHeavy,
  surface = 'plain',
  size = 'default',
  accessibilityHint,
}: {
  ref?: Ref<ElementRef<typeof MotionPressable>>;
  icon: FigmaIconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
  expanded?: boolean;
  iconSize?: number;
  strokeWidthPx?: number;
  surface?: 'plain' | 'muted' | 'outline' | 'destructive' | 'glass' | 'active';
  size?: 'default' | 'settingsHeader' | 'navigation';
  accessibilityHint?: string;
}) {
  const palette = useAppTheme();
  const reduced = useReducedMotion();
  const feedback = motionPressableFeedback('button', reduced);
  const navigation = size === 'navigation';
  return (
    <MotionPressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, selected, expanded }}
      aria-expanded={expanded}
      disabled={disabled}
      hitSlop={
        navigation
          ? 0
          : size === 'settingsHeader'
            ? (designTokens.size.touch -
                designTokens.size.settingsHeaderGlyph) /
              2
            : figmaIconButtonHitSlop
      }
      onPress={onPress}
      preset="icon"
      opacityFeedback={navigation ? 'component' : 'preset'}
      style={({ pressed }) => [
        figmaIconButtonStyle(pressed, surface, palette, size),
        navigation && {
          opacity: disabled
            ? designTokens.opacity.disabled
            : pressed
              ? feedback.pressedOpacity
              : 1,
        },
        size === 'settingsHeader' && {
          width: designTokens.size.settingsHeaderGlyph,
          height: designTokens.size.settingsHeaderGlyph,
        },
      ]}
    >
      {({ hovered, pressed }) => (
        <>
          {surface === 'glass' ? (
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <FigmaGlassSurface
                preset="controlGroup"
                style={{ width: '100%', height: '100%' }}
              >
                {null}
              </FigmaGlassSurface>
            </View>
          ) : null}
          {navigation ? (
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: designTokens.radius.pill,
                  backgroundColor: palette.overlayOnLight,
                  opacity: !disabled && (hovered || pressed) ? 1 : 0,
                },
                Platform.OS === 'web'
                  ? ({
                      transitionProperty: 'opacity',
                      transitionDuration: `${feedback.transitionDuration}ms`,
                      transitionTimingFunction: designTokens.motion.easing,
                    } as object)
                  : undefined,
              ]}
            />
          ) : null}
          <View
            pointerEvents="none"
            style={surface === 'glass' ? { zIndex: 1 } : undefined}
          >
            <FigmaIcon
              name={icon}
              size={iconSize}
              strokeWidthPx={strokeWidthPx}
              color={
                surface === 'destructive' || surface === 'active'
                  ? palette.white
                  : selected
                    ? palette.solid
                    : palette.ink
              }
            />
          </View>
        </>
      )}
    </MotionPressable>
  );
}
