import { describe, expect, it, vi } from 'vitest';

import { AdminController } from './admin.controller';

describe('AdminController Product approval', () => {
  it('rejects approval when a Product is incomplete or has fewer than three images', async () => {
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          title: 'Product', story: 'Story', categoryId: 'category-id', condition: 'New', uniqueness: 'One', provenance: 'Direct', city: 'Minsk', deliveryInfo: 'Pickup',
          images: [{ id: 'one' }, { id: 'two' }],
        }),
        update: vi.fn(),
      },
    };
    const controller = new AdminController(prisma as never, {} as never);

    await expect(controller.updateProduct('product-id', { status: 'APPROVED' }))
      .rejects.toThrow('Product does not meet approval requirements');
    expect(prisma.product.update).not.toHaveBeenCalled();
  });
});
