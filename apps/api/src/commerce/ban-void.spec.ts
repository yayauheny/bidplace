import { ApiErrorCode } from '@bidplace/contracts';
import { describe, expect, it } from 'vitest';

import { type AntifraudService, type BanHook } from '../antifraud';
import {
  RetryableTransactionConflict,
  runReadCommittedTransaction,
} from '../core/database';
import { BidsService } from './bids.service';

function registeredHook(): BanHook {
  let hook: BanHook | undefined;
  const antifraud = {
    onBan(next: BanHook) {
      hook = next;
    },
  };
  new BidsService(
    {} as never,
    {} as never,
    antifraud as unknown as AntifraudService,
  ).onModuleInit();
  if (!hook) throw new Error('Ban hook was not registered');
  return hook;
}

function tx(productIds: readonly string[]) {
  return {
    user: {
      findUnique: async () => ({ status: 'banned' }),
    },
    bid: {
      findMany: async () =>
        productIds.map((productId) => ({ listing: { productId } })),
    },
  };
}

describe('ban void hook', () => {
  it('throws when phase 2 finds a product phase 1 did not lock, and the transaction retries', async () => {
    const hook = registeredHook();
    const client = tx(['product-1']);

    await expect(
      hook.voidBids(client as never, 'user-1', new Set()),
    ).rejects.toBeInstanceOf(RetryableTransactionConflict);

    let calls = 0;
    const prisma = {
      $transaction: async (callback: (tx: unknown) => Promise<void>) => {
        calls += 1;
        let reads = 0;
        await callback({
          user: { findUnique: async () => ({ status: 'banned' }) },
          bid: {
            findMany: async () => {
              reads += 1;
              const ids = reads === 1 ? [] : ['product-1'];
              return ids.map((productId) => ({ listing: { productId } }));
            },
          },
        });
      },
    };

    await expect(
      runReadCommittedTransaction(prisma, async (transaction) => {
        const locked = await hook.lockProducts(transaction, 'user-1');
        await hook.voidBids(transaction, 'user-1', new Set(locked));
      }),
    ).rejects.toMatchObject({
      apiCode: ApiErrorCode.CONFLICT,
      status: 409,
    });
    expect(calls).toBe(3);
  });
});
