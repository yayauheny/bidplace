import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';

import { lockSellerProfileRevisionRowForUpdate } from './seller-profile-revision-lock';

describe('seller profile revision lock', () => {
  it('locks the revision row with SELECT FOR UPDATE', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'revision-id' }]),
    };

    await lockSellerProfileRevisionRowForUpdate(tx, 'revision-id');

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(
      String(tx.$queryRaw.mock.calls[0]?.[0]?.strings?.join(' ') ?? ''),
    ).toContain('FOR UPDATE');
  });

  it('throws when the revision no longer exists', async () => {
    await expect(
      lockSellerProfileRevisionRowForUpdate(
        { $queryRaw: vi.fn().mockResolvedValue([]) },
        'missing',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
