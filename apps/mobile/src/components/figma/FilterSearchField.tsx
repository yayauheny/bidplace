import { FigmaTextField } from './FigmaTextField';
import { type FigmaFieldVariant } from './figma-text-field-style';

export function FilterSearchField({
  value,
  onChangeText,
  placeholder = 'Поиск',
  autoFocus = false,
  variant = 'default',
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  variant?: FigmaFieldVariant;
}) {
  return (
    <FigmaTextField
      label={placeholder}
      placeholder={placeholder}
      icon="search-01"
      value={value}
      onChangeText={onChangeText}
      autoFocus={autoFocus}
      autoCorrect={false}
      variant={variant}
    />
  );
}
