import { useEffect, useState } from 'react';

import { FilterOptionRow } from './FilterOptionRow';
import { FilterSheet } from './FilterSheet';

export function FilterSortSheet({
  open,
  value,
  options,
  onSelect,
  onClose,
  title = 'Сортировка',
  compact = false,
  clearValue,
}: {
  open: boolean;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onSelect: (value: string) => void;
  onClose: () => void;
  title?: string;
  compact?: boolean;
  clearValue?: string;
}) {
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    if (open) setDraftValue(value);
  }, [open, value]);

  return (
    <FilterSheet
      open={open}
      compact={compact}
      onClose={onClose}
      title={title}
      onClear={
        compact && clearValue !== undefined
          ? () => setDraftValue(clearValue)
          : undefined
      }
      clearLabel="Очистить"
      primaryAction={{
        label: 'Применить',
        onPress: () => {
          onSelect(draftValue);
          onClose();
        },
      }}
    >
      {options.map((option) => (
        <FilterOptionRow
          key={option.value}
          label={option.label}
          mode="radio"
          variant={compact ? 'catalog-sort' : 'default'}
          selected={option.value === draftValue}
          onPress={() => setDraftValue(option.value)}
        />
      ))}
    </FilterSheet>
  );
}
