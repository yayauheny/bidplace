import 'reflect-metadata';

import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RateLimitGuard } from '../core/rate-limit/rate-limit.guard';
import { RateLimitService } from '../core/rate-limit/rate-limit.service';
import * as imagePolicy from '../images/image-policy';
import { SellersController } from './sellers.controller';

vi.mock('../images/image-policy', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../images/image-policy')>();
  return {
    ...actual,
    validateProductImageUploads: vi.fn(),
  };
});

const validateProductImageUploads = vi.mocked(
  imagePolicy.validateProductImageUploads,
);

const profileBody = {
  slug: 'author',
  fullName: 'Author',
  country: 'Belarus',
  city: 'Minsk',
};
const file = { buffer: Buffer.from([1]), mimetype: 'image/png' };

describe('profile photo upload rate limit', () => {
  const sellers = {
    create: vi.fn().mockResolvedValue({ ok: true }),
    update: vi.fn().mockResolvedValue({ ok: true }),
  };
  const guard = new RateLimitGuard(
    new Reflector(),
    new RateLimitService({ maxBuckets: 10, cleanupIntervalMs: 1_000 }),
  );
  const controller = new SellersController(sellers as never);

  beforeEach(() => {
    validateProductImageUploads.mockReset();
    validateProductImageUploads.mockResolvedValue([
      {
        buffer: Buffer.from('normalized'),
        mimeType: 'image/png',
        width: 1,
        height: 1,
      },
    ]);
    sellers.create.mockClear();
    sellers.update.mockClear();
  });

  function context(method: 'create' | 'update', userId = 'user-1') {
    return {
      getHandler: () => SellersController.prototype[method],
      getClass: () => SellersController,
      switchToHttp: () => ({
        getRequest: () => ({
          auth: { sub: userId },
          params: {},
        }),
      }),
    } satisfies Parameters<RateLimitGuard['canActivate']>[0];
  }

  async function submit(method: 'create' | 'update', userId = 'user-1') {
    guard.canActivate(context(method, userId));
    if (method === 'create') {
      return controller.create({ sub: userId }, profileBody, [file]);
    }
    return controller.update({ sub: userId }, {}, [file]);
  }

  it('does not normalize a profile photo after the shared upload limit', async () => {
    for (let index = 0; index < 10; index += 1) {
      await submit(index % 2 === 0 ? 'create' : 'update');
    }
    expect(validateProductImageUploads).toHaveBeenCalledTimes(10);

    await expect(submit('update')).rejects.toThrow('Too many requests');
    expect(validateProductImageUploads).toHaveBeenCalledTimes(10);
    expect(sellers.update).toHaveBeenCalledTimes(5);
    expect(guard.canActivate(context('create', 'user-2'))).toBe(true);
  });
});
