import { View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { AppText } from '../ui/AppText';
import { MotionPressable } from '../ui/MotionPressable';
import { FigmaGlassSurface } from './FigmaGlassSurface';
import { FigmaIcon } from './FigmaIcon';
import {
  filterSortBarStyle,
  filterSortPillLabelStyle,
  filterSortPillStyle,
} from './filter-sort-bar-style';

export function FilterSortBar({
  filterLabel = 'Фильтры',
  sortLabel = 'Сортировка',
  filterActive = false,
  sortActive = false,
  onPressFilter,
  onPressSort,
  disabled,
}: {
  filterLabel?: string;
  sortLabel?: string;
  filterActive?: boolean;
  sortActive?: boolean;
  onPressFilter: () => void;
  onPressSort: () => void;
  disabled?: { filter?: boolean; sort?: boolean };
}) {
  return (
    <View style={filterSortBarStyle()}>
      <FilterSortBarTrigger
        icon="filter-horizontal"
        label={filterLabel}
        active={filterActive}
        disabled={disabled?.filter}
        onPress={onPressFilter}
      />
      <FilterSortBarTrigger
        icon="arrow-up-down"
        label={sortLabel}
        active={sortActive}
        disabled={disabled?.sort}
        onPress={onPressSort}
      />
    </View>
  );
}

function FilterSortBarTrigger({
  icon,
  label,
  active,
  disabled,
  onPress,
}: {
  icon: 'filter-horizontal' | 'arrow-up-down';
  label: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <FigmaGlassSurface
      preset="filterControl"
      style={disabled ? { opacity: 0.5 } : undefined}
    >
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: Boolean(disabled), selected: active }}
        disabled={disabled}
        onPress={onPress}
        preset="icon"
        style={filterSortPillStyle()}
      >
        <View
          style={{
            width: figmaTokens.size.buttonIconFrame,
            height: figmaTokens.size.buttonIconFrame,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FigmaIcon name={icon} size={figmaTokens.size.icon} />
        </View>
        <AppText role="nav" style={filterSortPillLabelStyle()}>
          {label}
        </AppText>
      </MotionPressable>
    </FigmaGlassSurface>
  );
}
