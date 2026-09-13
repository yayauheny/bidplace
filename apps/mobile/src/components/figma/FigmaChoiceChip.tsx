import { Text } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { MotionPressable } from '../ui/MotionPressable';
import {
  figmaChoiceChipStyle,
  figmaChoiceChipTextColor,
  type FigmaChoiceChipInteraction,
} from './figma-choice-chip-style';

export function FigmaChoiceChip({
  label,
  selected,
  onPress,
  disabled = false,
  accessibilityRole = 'button',
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  accessibilityRole?: 'button' | 'tab';
}) {
  return (
    <MotionPressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      preset="button"
      style={({ hovered, pressed }) =>
        figmaChoiceChipStyle(
          selected,
          resolveInteraction({ disabled, hovered, pressed }),
        )
      }
    >
      <Text
        numberOfLines={1}
        style={[
          { color: figmaChoiceChipTextColor(selected) },
          figmaTokens.typography.choiceChip,
        ]}
      >
        {label}
      </Text>
    </MotionPressable>
  );
}

function resolveInteraction({
  disabled,
  hovered,
  pressed,
}: {
  disabled: boolean;
  hovered: boolean;
  pressed: boolean;
}): FigmaChoiceChipInteraction {
  if (disabled) return 'disabled';
  if (pressed) return 'pressed';
  if (hovered) return 'hover';
  return 'idle';
}
