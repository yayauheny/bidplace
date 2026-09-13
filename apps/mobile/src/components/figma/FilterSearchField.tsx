import { FigmaTextField } from './FigmaTextField';

export function FilterSearchField({
  value,
  onChangeText,
  placeholder = 'Поиск',
  autoFocus = false,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
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
    />
  );
}
