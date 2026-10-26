import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from '../ui/AppText';
import { MotionPressable } from '../ui/MotionPressable';
import { useAppTheme } from '../../providers/theme-provider';
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
  filterPresentation = 'label',
}: {
  filterLabel?: string;
  filterPresentation?: 'label' | 'icon';
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
        iconOnly={filterPresentation === 'icon'}
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
  iconOnly,
  active,
  disabled,
  onPress,
}: {
  icon: 'filter-horizontal' | 'arrow-up-down';
  iconOnly?: boolean;
  label: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const palette = useAppTheme();
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
        hitSlop={
          iconOnly
            ? (designTokens.size.touch - designTokens.size.filterSortPill) / 2
            : undefined
        }
        style={[
          filterSortPillStyle(),
          { borderRadius: designTokens.radius.filterSort },
          iconOnly
            ? {
                width: designTokens.size.filterSortPill,
                height: designTokens.size.filterSortPill,
                paddingVertical: 0,
                paddingHorizontal: 0,
                gap: 0,
                justifyContent: 'center',
              }
            : null,
        ]}
      >
        <View
          style={{
            width: designTokens.size.buttonIconFrame,
            height: designTokens.size.buttonIconFrame,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FigmaIcon
            name={icon}
            size={designTokens.size.icon}
            strokeWidthPx={
              iconOnly
                ? designTokens.stroke.iconHeavy
                : designTokens.stroke.icon
            }
          />
        </View>
        {!iconOnly ? (
          <AppText role="authButton" style={filterSortPillLabelStyle(palette)}>
            {label}
          </AppText>
        ) : null}
      </MotionPressable>
    </FigmaGlassSurface>
  );
}
