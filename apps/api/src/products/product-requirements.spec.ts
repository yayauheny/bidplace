import { describe, expect, it } from 'vitest';

import { missingProductApprovalFields } from './product-requirements';

const completeProduct = {
  title: 'Предмет',
  categoryId: 'category-id',
  images: [{ id: 'image-id' }],
};

describe('product approval requirements', () => {
  it('accepts a complete portfolio work without commerce data', () => {
    expect(missingProductApprovalFields(completeProduct)).toEqual([]);
  });

  it('reports every missing field instead of accepting a partial work', () => {
    expect(
      missingProductApprovalFields({
        ...completeProduct,
        categoryId: null,
        images: [],
      }),
    ).toEqual(['categoryId', 'images']);
  });
});
