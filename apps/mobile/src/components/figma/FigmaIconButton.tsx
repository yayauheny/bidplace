import type { ElementRef, Ref } from 'react';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

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
  tone = 'default',
  frame,
  slop,
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
  surface?: 'plain' | 'muted' | 'outline' | 'destructive';
  size?: 'default' | 'settingsHeader' | 'compact';
  tone?: 'default' | 'danger';
  /**
   * Real square hit box. The surface glyph stays its own size and is centered.
   * RN Web ignores hit slop, and Android does not deliver touches outside the
   * parent, so this box is the target on both.
   */
  frame?: number;
  slop?: { top: number; bottom: number; left: number; right: number };
}) {
  const palette = useAppTheme();
  const glyph = (
    <FigmaIcon
      name={icon}
      size={iconSize}
      strokeWidthPx={strokeWidthPx}
      color={
        surface === 'destructive'
          ? palette.white
          : tone === 'danger'
            ? palette.destructiveInk
            : selected
              ? palette.solid
              : palette.ink
      }
    />
  );
  const visual = (pressed: boolean) => [
    figmaIconButtonStyle(pressed, surface, palette),
    size === 'compact' && {
      width: designTokens.size.compactIconButton,
      height: designTokens.size.compactIconButton,
    },
    size === 'settingsHeader' && {
      width: designTokens.size.settingsHeaderGlyph,
      height: designTokens.size.settingsHeaderGlyph,
    },
  ];
  return (
    <MotionPressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected, expanded }}
      aria-expanded={expanded}
      disabled={disabled}
      hitSlop={
        frame != null
          ? slop
          : (slop ??
            (size === 'compact'
              ? (designTokens.size.touch -
                  designTokens.size.compactIconButton) /
                2
              : size === 'settingsHeader'
                ? (designTokens.size.touch -
                    designTokens.size.settingsHeaderGlyph) /
                  2
                : figmaIconButtonHitSlop))
      }
      onPress={onPress}
      preset="icon"
      style={
        frame != null
          ? {
              width: frame,
              height: frame,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'visible',
              backgroundColor: 'transparent',
            }
          : ({ pressed }) => visual(pressed)
      }
    >
      {frame != null
        ? (state) => (
            <View pointerEvents="none" style={visual(state.pressed)}>
              {glyph}
            </View>
          )
        : glyph}
    </MotionPressable>
  );
}
