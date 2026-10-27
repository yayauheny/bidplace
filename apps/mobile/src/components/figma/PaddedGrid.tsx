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
  activeItemId,
}: {
  activeItemId?: string;
  items: readonly T[];
  columns: 1 | 2 | 3 | 4;
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
            style={{
              flexDirection: 'row',
              gap,
              ...(activeItemId
                ? {
                    overflow: 'visible',
                    zIndex: row.some(
                      (item) => item && keyExtractor(item) === activeItemId,
                    )
                      ? 1
                      : 0,
                  }
                : {}),
            }}
          >
            {row.map((item, cellIndex) => (
              <View
                key={
                  item ? keyExtractor(item) : `spacer-${rowIndex}-${cellIndex}`
                }
                style={{
                  flex: 1,
                  minWidth: 0,
                  ...(activeItemId ? { overflow: 'visible' } : {}),
                }}
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
