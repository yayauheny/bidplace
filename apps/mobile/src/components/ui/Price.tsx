import { Text } from 'tamagui';

import { formatDisplayPrice } from '../../lib/formatters';
import { useAppThemePalette } from '../../theme/palette';

type PriceProps = {
  value: number;
  currency?: string;
  locale?: string;
  tone?: 'default' | 'accent' | 'muted';
};

export function Price({
  value,
  currency = 'BYN',
  locale = 'ru-BY',
  tone = 'default',
}: PriceProps) {
  const palette = useAppThemePalette();
  const formatted = formatDisplayPrice(value, currency, locale);

  const color = tone === 'accent' ? palette.primary : tone === 'muted' ? palette.textMuted : palette.text;

  return (
    <Text
      style={{
        color,
        fontSize: 24,
        lineHeight: 30,
        fontWeight: '700',
      }}
    >
      {formatted}
    </Text>
  );
}
