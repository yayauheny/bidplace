import { describe, expect, it, vi } from 'vitest';

import { AdminController } from './admin.controller';

describe('AdminController Product approval', () => {
  it('propagates moderation failures from the moderation service', async () => {
    const prisma = {
      product: { findUniqueOrThrow: vi.fn(), },
    };
    const moderation = {
      updateProductStatus: vi.fn().mockRejectedValue(new Error('Product does not meet approval requirements')),
    };
    const controller = new AdminController(prisma as never, {} as never, moderation as never);

    await expect(controller.updateProduct({ sub: 'admin-id' }, 'product-id', { status: 'APPROVED' }))
      .rejects.toThrow('Product does not meet approval requirements');
    expect(moderation.updateProductStatus).toHaveBeenCalledWith('admin-id', 'product-id', { status: 'APPROVED' });
  });
});
