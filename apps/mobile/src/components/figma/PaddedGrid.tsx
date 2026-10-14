import type { ReactNode } from 'react';
import { View } from 'react-native';

import { paddedGridRows } from './flex-grid-rows';

export { gridColumnsFromWidth } from './grid-columns';

/**
 * Построчная flex-сетка: последний неполный ряд добивается пустыми
 * ячейками, чтобы карточки не растягивались на всю ширину.
 */
export function PaddedGrid<T>({
  items,
  columns,
  gap,
  keyExtractor,
  renderItem,
}: {
  items: readonly T[];
  columns: 1 | 2 | 3;
  gap: number;
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}) {
  return (
    <>
      {paddedGridRows(items, columns).map((row, rowIndex) => {
        const first = row.find((item): item is T => item !== null);
        return (
          <View
            key={first ? keyExtractor(first) : `row-${rowIndex}`}
            style={{ flexDirection: 'row', gap }}
          >
            {row.map((item, cellIndex) => (
              <View
                key={
                  item ? keyExtractor(item) : `spacer-${rowIndex}-${cellIndex}`
                }
                style={{ flex: 1, minWidth: 0 }}
              >
                {item ? renderItem(item) : null}
              </View>
            ))}
          </View>
        );
      })}
    </>
  );
}
