import { figmaTokens } from '@bidplace/design-tokens';

import { MotionPressable } from '../ui/MotionPressable';
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
  iconSize = figmaTokens.size.icon,
  surface = 'plain',
}: {
  icon: FigmaIconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
  iconSize?: number;
  surface?: 'plain' | 'muted';
}) {
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      hitSlop={figmaIconButtonHitSlop}
      onPress={onPress}
      preset="icon"
      style={({ pressed }) => figmaIconButtonStyle(pressed, surface)}
    >
      <FigmaIcon
        name={icon}
        size={iconSize}
        color={selected ? figmaTokens.color.solid : figmaTokens.color.ink}
      />
    </MotionPressable>
  );
}
