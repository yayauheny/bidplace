import { Pressable } from 'react-native';
import { Text, YStack } from 'tamagui';

import { mobileSpacing } from '../../theme/tokens';
import { AppButton, AppSheet } from '../ui';

export type CatalogFilterValue = 'all' | 'active' | 'scheduled' | 'sold';

type FilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: CatalogFilterValue;
  onChange: (value: CatalogFilterValue) => void;
};

const filterOptions: Array<{ value: CatalogFilterValue; label: string }> = [
  { value: 'all', label: 'Все лоты' },
  { value: 'active', label: 'Активные торги' },
  { value: 'scheduled', label: 'Скоро старт' },
  { value: 'sold', label: 'Завершённые' },
];

export function FilterSheet({
  open,
  onOpenChange,
  value,
  onChange,
}: FilterSheetProps) {
  return (
    <AppSheet open={open} onOpenChange={onOpenChange} title="Фильтры">
      <YStack gap={mobileSpacing[2]}>
        {filterOptions.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => {
              onChange(option.value);
              onOpenChange(false);
            }}
          >
            <Text color={value === option.value ? '$text' : '$textMuted'} fontSize={16} lineHeight={24}>
              {option.label}
            </Text>
          </Pressable>
        ))}
        <AppButton tone="secondary" onPress={() => onOpenChange(false)}>
          Закрыть
        </AppButton>
      </YStack>
    </AppSheet>
  );
}
