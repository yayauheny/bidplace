import { FilterOptionRow } from './FilterOptionRow';
import { FilterSheet } from './FilterSheet';

export function FilterSortSheet({
  open,
  value,
  options,
  onSelect,
  onClose,
  title = 'Сортировка',
}: {
  open: boolean;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onSelect: (value: string) => void;
  onClose: () => void;
  title?: string;
}) {
  return (
    <FilterSheet
      open={open}
      onClose={onClose}
      title={title}
      primaryAction={{
        label: 'Применить',
        onPress: onClose,
      }}
    >
      {options.map((option) => (
        <FilterOptionRow
          key={option.value}
          label={option.label}
          mode="radio"
          selected={option.value === value}
          onPress={() => onSelect(option.value)}
        />
      ))}
    </FilterSheet>
  );
}
