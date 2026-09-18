export function paddedGridRows<T>(
  items: readonly T[],
  columns: 1 | 2 | 3,
): Array<Array<T | null>> {
  const rows: Array<Array<T | null>> = [];
  for (let index = 0; index < items.length; index += columns) {
    const row: Array<T | null> = items.slice(index, index + columns);
    while (row.length < columns) {
      row.push(null);
    }
    rows.push(row);
  }
  return rows;
}
