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
  icon,
  label,
  onPress,
  disabled = false,
  selected = false,
  iconSize = designTokens.size.icon,
  strokeWidthPx,
  surface = 'plain',
}: {
  icon: FigmaIconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
  iconSize?: number;
  strokeWidthPx?: number;
  surface?: 'plain' | 'muted';
}) {
  const palette = useAppTheme();
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      hitSlop={figmaIconButtonHitSlop}
      onPress={onPress}
      preset="icon"
      style={({ pressed }) => figmaIconButtonStyle(pressed, surface, palette)}
    >
      <FigmaIcon
        name={icon}
        size={iconSize}
        strokeWidthPx={strokeWidthPx}
        color={selected ? palette.solid : palette.ink}
      />
    </MotionPressable>
  );
}
