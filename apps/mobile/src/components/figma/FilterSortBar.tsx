import { View } from 'react-native';

import { FilterTrigger, SortTrigger } from './FilterTrigger';
import { filterSortBarStyle } from './filter-sort-bar-style';

export function FilterSortBar({
  onFilterPress,
  onSortPress,
  filterActive = false,
  sortActive = false,
}: {
  onFilterPress: () => void;
  onSortPress: () => void;
  filterActive?: boolean;
  sortActive?: boolean;
}) {
  return (
    <View style={filterSortBarStyle()}>
      <FilterTrigger onPress={onFilterPress} active={filterActive} />
      <SortTrigger onPress={onSortPress} active={sortActive} />
    </View>
  );
}
