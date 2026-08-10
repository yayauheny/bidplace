import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from './AppText';
import { SecondaryButton } from './Button';

export type SelectableOption = { value: string; label: string };

export function SelectableRow({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  options: readonly SelectableOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <View style={{ gap: designTokens.space.x2 }}>
      <AppText role="label">{label}</AppText>
      <View style={{ gap: designTokens.space.x2 }}>
        {options.map((option) => (
          <SecondaryButton
            key={option.value}
            label={`${value === option.value ? '✓ ' : ''}${option.label}`}
            compact
            disabled={disabled}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </View>
  );
}
