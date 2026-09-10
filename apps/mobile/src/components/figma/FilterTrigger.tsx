import { Text } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { MotionPressable } from '../ui/MotionPressable';
import { FigmaIcon } from './FigmaIcon';
import { type FigmaIconName } from './figma-icon-names';
import { FILTER_TRIGGER_BLUR, filterTriggerStyle } from './filter-sort-bar-style';
import { webBackdropBlur } from './web-backdrop';

export function FilterBarTrigger({
  icon,
  label,
  onPress,
  active = false,
}: {
  icon: FigmaIconName;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      preset="button"
      style={[filterTriggerStyle(active), webBackdropBlur(FILTER_TRIGGER_BLUR)]}
    >
      <FigmaIcon name={icon} color={figmaTokens.color.ink} />
      <Text
        style={[
          { color: figmaTokens.color.ink },
          figmaTokens.typography.label,
        ]}
      >
        {label}
      </Text>
    </MotionPressable>
  );
}

export function FilterTrigger({
  onPress,
  active = false,
}: {
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <FilterBarTrigger
      icon="filter-horizontal"
      label="Фильтры"
      onPress={onPress}
      active={active}
    />
  );
}

export function SortTrigger({
  onPress,
  active = false,
}: {
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <FilterBarTrigger
      icon="arrow-up-down"
      label="Сортировка"
      onPress={onPress}
      active={active}
    />
  );
}
