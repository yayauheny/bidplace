import type { ElementRef, Ref } from 'react';
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
}) {
  const palette = useAppTheme();
  return (
    <MotionPressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected, expanded }}
      aria-expanded={expanded}
      disabled={disabled}
      hitSlop={
        size === 'compact'
          ? (designTokens.size.touch - designTokens.size.compactIconButton) / 2
          : size === 'settingsHeader'
            ? (designTokens.size.touch -
                designTokens.size.settingsHeaderGlyph) /
              2
            : figmaIconButtonHitSlop
      }
      onPress={onPress}
      preset="icon"
      style={({ pressed }) => [
        figmaIconButtonStyle(pressed, surface, palette),
        size === 'compact' && {
          width: designTokens.size.compactIconButton,
          height: designTokens.size.compactIconButton,
        },
        size === 'settingsHeader' && {
          width: designTokens.size.settingsHeaderGlyph,
          height: designTokens.size.settingsHeaderGlyph,
        },
      ]}
    >
      <FigmaIcon
        name={icon}
        size={iconSize}
        strokeWidthPx={strokeWidthPx}
        color={
          surface === 'destructive'
            ? palette.white
            : tone === 'danger'
              ? palette.destructiveFill
              : selected
                ? palette.solid
                : palette.ink
        }
      />
    </MotionPressable>
  );
}
