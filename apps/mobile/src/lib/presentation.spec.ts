import { describe, expect, it } from 'vitest';

import {
  productStatusLabels,
  presentEnum,
  sellerStatusLabels,
  sellerTypeLabels,
} from './presentation';

describe('presentation adapters', () => {
  it('localizes known enum values without changing their API values', () => {
    expect(
      presentEnum('DRAFT', sellerStatusLabels, 'Неизвестный статус продавца'),
    ).toBe('Черновик');
    expect('DRAFT').toBe('DRAFT');
  });

  it('uses explicit copy for an unknown enum instead of leaking raw values', () => {
    expect(
      presentEnum(
        'FUTURE_STATUS',
        sellerStatusLabels,
        'Неизвестный статус продавца',
      ),
    ).toBe('Неизвестный статус продавца');
  });

  it.each([
    [sellerStatusLabels, 'Неизвестный статус продавца'],
    [productStatusLabels, 'Неизвестный статус предмета'],
    [sellerTypeLabels, 'Неизвестный тип продавца'],
  ] as const)('uses the explicit fallback for each presentation group', (labels, fallback) => {
    expect(presentEnum('FUTURE_VALUE', labels, fallback)).toBe(fallback);
  });
});
