import { describe, expect, it } from 'vitest';

import { missingProductApprovalFields } from './product-requirements';

const completeProduct = {
  title: 'Предмет',
  story: 'Описание',
  categoryId: 'category-id',
  condition: 'Новое',
  uniqueness: 'Единственный экземпляр',
  provenance: 'Создан автором',
  city: 'Минск',
  packaging: 'Защитная коробка',
  deliveryInfo: 'Самовывоз',
  images: [{ id: 'image-id' }],
};

describe('product approval requirements', () => {
  it('accepts a complete physical work', () => {
    expect(missingProductApprovalFields(completeProduct)).toEqual([]);
  });

  it('reports every missing field instead of accepting a partial work', () => {
    expect(
      missingProductApprovalFields({
        ...completeProduct,
        condition: null,
        packaging: null,
        deliveryInfo: null,
        images: [],
      }),
    ).toEqual(['condition', 'packaging', 'deliveryInfo', 'images']);
  });
});
