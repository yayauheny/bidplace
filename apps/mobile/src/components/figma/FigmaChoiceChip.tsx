import { Platform, Text } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { MotionPressable } from '../ui/MotionPressable';
import { useAppTheme } from '../../providers/theme-provider';
import { FigmaIcon } from './FigmaIcon';
import {
  figmaChoiceChipStyle,
  figmaChoiceChipTextColor,
  type FigmaChoiceChipInteraction,
} from './figma-choice-chip-style';

export function FigmaChoiceChip({
  label,
  selected,
  onPress,
  onRemove,
  removable = false,
  disabled = false,
  stretch = false,
  accessibilityRole = 'button',
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  onRemove?: () => void;
  removable?: boolean;
  disabled?: boolean;
  stretch?: boolean;
  accessibilityRole?: 'button' | 'tab';
}) {
  const showRemove = removable && selected && onRemove !== undefined;
  const palette = useAppTheme();
  const typography = showRemove
    ? designTokens.typography.choiceChipSelectedRemovable
    : designTokens.typography.choiceChip;

  return (
    <MotionPressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={showRemove ? `Удалить ${label}` : label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={showRemove ? onRemove : onPress}
      preset="button"
      {...(Platform.OS === 'web' && accessibilityRole === 'tab'
        ? ({ 'aria-selected': selected } as object)
        : {})}
      style={({ hovered, pressed }) => [
        stretch ? { width: '100%' } : null,
        figmaChoiceChipStyle(
          selected,
          resolveInteraction({ disabled, hovered, pressed }),
          showRemove,
          palette,
        ),
        showRemove
          ? {
              flexDirection: 'row',
              alignItems: 'center',
              gap: designTokens.space.authorIdentityGap,
              paddingRight: designTokens.space.choiceChipRemovableX,
            }
          : null,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          {
            flex: showRemove ? 1 : undefined,
            minWidth: showRemove ? 0 : undefined,
            color: figmaChoiceChipTextColor(selected, palette),
            textAlign: stretch ? 'center' : 'left',
          },
          typography,
        ]}
      >
        {label}
      </Text>
      {showRemove ? (
        <FigmaIcon
          name="x"
          size={designTokens.size.choiceChipRemoveIcon}
          color={palette.white}
        />
      ) : null}
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
