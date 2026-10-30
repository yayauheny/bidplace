import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import 'reflect-metadata';

import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RateLimitGuard } from '../antifraud';

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
  fullName: 'Author',
  country: 'BY',
  city: 'Minsk',
};
const file = { buffer: Buffer.from([1]), mimetype: 'image/png' };
const jsonRequest = { headers: { 'content-type': 'application/json' } };

describe('profile photo upload rate limit', () => {
  const sellers = {
    create: vi.fn().mockResolvedValue({ ok: true }),
    update: vi.fn().mockResolvedValue({ ok: true }),
  };
  const counts = new Map<string, number>();
  const guard = new RateLimitGuard(
    new Reflector(),
    { consumeRateLimit: async (key, limit) => { const count = (counts.get(key) ?? 0) + 1; counts.set(key, count); return count <= limit; } },
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
    return new ExecutionContextHost(
      [{ auth: { sub: userId }, params: {} }],
      SellersController,
      SellersController.prototype[method],
    );

  }

  async function submit(method: 'create' | 'update', userId = 'user-1') {
    await guard.canActivate(context(method, userId));
    if (method === 'create') {
      return controller.create({ sub: userId }, jsonRequest, profileBody, [
        file,
      ]);
    }
    return controller.update({ sub: userId }, jsonRequest, {}, [file]);
  }

  it('does not normalize a profile photo after the shared upload limit', async () => {
    for (let index = 0; index < 10; index += 1) {
      await submit(index % 2 === 0 ? 'create' : 'update');
    }
    expect(validateProductImageUploads).toHaveBeenCalledTimes(10);

    await expect(submit('update')).rejects.toThrow('Too many requests');
    expect(validateProductImageUploads).toHaveBeenCalledTimes(10);
    expect(sellers.update).toHaveBeenCalledTimes(5);
    expect(await guard.canActivate(context('create', 'user-2'))).toBe(true);
  });
});
