import { Platform, Text } from 'react-native';

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
  stretch = false,
  accessibilityRole = 'button',
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  stretch?: boolean;
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
      {...(Platform.OS === 'web' && accessibilityRole === 'tab'
        ? ({ 'aria-selected': selected } as object)
        : {})}
      style={({ hovered, pressed }) => [
        stretch ? { width: '100%' } : null,
        figmaChoiceChipStyle(
          selected,
          resolveInteraction({ disabled, hovered, pressed }),
        ),
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          {
            color: figmaChoiceChipTextColor(selected),
            textAlign: stretch ? 'center' : 'left',
          },
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
