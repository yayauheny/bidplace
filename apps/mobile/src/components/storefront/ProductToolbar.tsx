import { useState } from 'react';
import { Text, XStack, YStack, useMedia } from 'tamagui';

import { mobileSpacing } from '../../theme/tokens';
import { AppButton } from '../ui';
import { FilterSheet, type CatalogFilterValue } from './FilterSheet';
import { SortMenu, type CatalogSortValue } from './SortMenu';

type ProductToolbarProps = {
  title: string;
  count: number;
  filterValue: CatalogFilterValue;
  sortValue: CatalogSortValue;
  onFilterChange: (value: CatalogFilterValue) => void;
  onSortChange: (value: CatalogSortValue) => void;
};

export function ProductToolbar({
  title,
  count,
  filterValue,
  sortValue,
  onFilterChange,
  onSortChange,
}: ProductToolbarProps) {
  const media = useMedia();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const mobile = Boolean(media.mobile);

  return (
    <YStack gap={mobileSpacing[3]}>
      <XStack
        style={{
          justifyContent: 'space-between',
          alignItems: mobile ? 'flex-start' : 'center',
          flexWrap: 'wrap',
          gap: mobileSpacing[3],
        }}
      >
        <Text color="$text" fontFamily="$heading" fontSize={34} lineHeight={38}>
          {title}
        </Text>
        <Text color="$textMuted" fontSize={13} lineHeight={18}>
          Найдено {count} позиций
        </Text>
      </XStack>
      <XStack
        style={{
          justifyContent: 'space-between',
          alignItems: mobile ? 'stretch' : 'center',
          flexDirection: mobile ? 'column' : 'row',
          gap: mobileSpacing[2],
        }}
      >
        <XStack gap={mobileSpacing[2]}>
          <AppButton tone="secondary" onPress={() => setFiltersOpen(true)} buttonSize="small">
            Фильтры
          </AppButton>
          {mobile ? (
            <AppButton tone="secondary" onPress={() => setSortOpen(true)} buttonSize="small">
              Сортировка
            </AppButton>
          ) : null}
        </XStack>
        <SortMenu
          mobile={mobile}
          open={sortOpen}
          onOpenChange={setSortOpen}
          value={sortValue}
          onChange={onSortChange}
        />
      </XStack>
      <FilterSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={filterValue}
        onChange={onFilterChange}
      />
    </YStack>
  );
}
