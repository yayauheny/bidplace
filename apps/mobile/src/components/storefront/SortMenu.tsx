import { Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { mobileSpacing } from '../../theme/tokens';
import { AppSheet, AppButton } from '../ui';

export type CatalogSortValue = 'featured' | 'priceAsc' | 'priceDesc' | 'endingSoon';

type SortMenuProps = {
  mobile: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: CatalogSortValue;
  onChange: (value: CatalogSortValue) => void;
};

const sortOptions: Array<{ value: CatalogSortValue; label: string }> = [
  { value: 'featured', label: 'Избранное' },
  { value: 'endingSoon', label: 'Скоро завершатся' },
  { value: 'priceAsc', label: 'Цена по возрастанию' },
  { value: 'priceDesc', label: 'Цена по убыванию' },
];

export function SortMenu({
  mobile,
  open,
  onOpenChange,
  value,
  onChange,
}: SortMenuProps) {
  if (mobile) {
    return (
      <AppSheet open={open} onOpenChange={onOpenChange} title="Сортировка">
        <YStack gap={mobileSpacing[2]}>
          {sortOptions.map((option) => (
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
        </YStack>
      </AppSheet>
    );
  }

  return (
    <XStack style={{ alignItems: 'center', gap: mobileSpacing[2] }}>
      {sortOptions.map((option) => (
        <AppButton
          key={option.value}
          tone={value === option.value ? 'primary' : 'subtle'}
          onPress={() => onChange(option.value)}
          buttonSize="small"
        >
          {option.label}
        </AppButton>
      ))}
    </XStack>
  );
}
