/**
 * Число колонок по измеренной ширине контейнера: карточка не уже
 * minCardWidth, потолок max. Заменяет прежние брейкпоинты 700/1000 —
 * визуал 390 не меняется, поведение между ними плавное.
 */
export function gridColumnsFromWidth(
  width: number,
  {
    minCardWidth,
    gap,
    max,
  }: { minCardWidth: number; gap: number; max: 1 | 2 | 3 },
): 1 | 2 | 3 {
  if (width <= 0) return 1;
  const columns = Math.floor((width + gap) / (minCardWidth + gap));
  return Math.min(max, Math.max(1, columns)) as 1 | 2 | 3;
}
