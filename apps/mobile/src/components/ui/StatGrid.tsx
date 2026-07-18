import { Text, XStack, YStack } from 'tamagui';

import { mobileRadius, mobileSpacing } from '../../theme/tokens';

type StatItem = {
  label: string;
  value: string;
};

type StatGridProps = {
  items: readonly StatItem[];
};

export function StatGrid({ items }: StatGridProps) {
  return (
    <XStack style={{ gap: mobileSpacing[3], flexWrap: 'wrap' }}>
      {items.map((item) => (
        <YStack
          key={`${item.label}-${item.value}`}
          style={{
            minWidth: 160,
            flexGrow: 1,
            gap: mobileSpacing[1],
            padding: mobileSpacing[3],
            borderWidth: 1,
            borderColor: '#DFDDD7',
            borderRadius: mobileRadius.md,
            backgroundColor: '#FFFFFF',
          }}
        >
          <Text color="$textMuted" style={{ fontSize: 12, lineHeight: 16, letterSpacing: 0.9, textTransform: 'uppercase' }}>
            {item.label}
          </Text>
          <Text color="$text" style={{ fontSize: 20, lineHeight: 26, fontWeight: '600' }}>
            {item.value}
          </Text>
        </YStack>
      ))}
    </XStack>
  );
}
