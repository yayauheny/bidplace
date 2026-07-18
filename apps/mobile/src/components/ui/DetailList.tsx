import { Text, YStack } from 'tamagui';

import { mobileSpacing } from '../../theme/tokens';

type DetailItem = {
  label: string;
  value: string;
  accent?: boolean;
};

type DetailListProps = {
  items: readonly DetailItem[];
};

export function DetailList({ items }: DetailListProps) {
  return (
    <YStack style={{ gap: mobileSpacing[2] }}>
      {items.map((item) => (
        <YStack key={`${item.label}-${item.value}`} style={{ gap: 2 }}>
          <Text color="$textMuted" style={{ fontSize: 12, lineHeight: 16, letterSpacing: 0.9, textTransform: 'uppercase' }}>
            {item.label}
          </Text>
          <Text
            color={item.accent ? '$text' : '$text'}
            style={{ fontSize: 15, lineHeight: 22 }}
          >
            {item.value}
          </Text>
        </YStack>
      ))}
    </YStack>
  );
}
