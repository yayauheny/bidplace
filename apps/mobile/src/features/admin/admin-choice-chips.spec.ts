import { describe, expect, it } from 'vitest';

import {
  adminAnalyticsPeriodChips,
  adminModerationQueueTabs,
  adminModerationStatusFilters,
} from './admin-choice-chips';

describe('admin choice chip labels', () => {
  it('keeps period labels free of a selected-state prefix', () => {
    expect(adminAnalyticsPeriodChips.map((chip) => chip.label)).toEqual([
      'Сегодня',
      '7 дней',
      '30 дней',
      '90 дней',
    ]);
    for (const chip of adminAnalyticsPeriodChips) {
      expect(chip.label.includes('✓')).toBe(false);
    }
  });

  it('keeps queue tab labels free of a selected-state prefix', () => {
    expect(adminModerationQueueTabs.map((chip) => chip.label)).toEqual([
      'Авторы',
      'Работы',
      'Заказы',
      'Пользователи',
      'Восстановление',
    ]);
    for (const chip of adminModerationQueueTabs) {
      expect(chip.label.includes('✓')).toBe(false);
    }
  });

  it('keeps status filter labels free of a selected-state prefix', () => {
    expect(adminModerationStatusFilters.map((chip) => chip.label)).toEqual([
      'Ожидают проверки',
      'Одобрены',
      'Нужны правки',
      'Все статусы',
    ]);
    for (const chip of adminModerationStatusFilters) {
      expect(chip.label.includes('✓')).toBe(false);
    }
  });
});
