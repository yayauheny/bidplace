import { FigmaTextField } from './FigmaTextField';

export function FilterSearchField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <FigmaTextField
      label="Поиск"
      icon="search-01"
      value={value}
      onChangeText={onChangeText}
      autoCorrect={false}
      autoCapitalize="none"
    />
  );
}
