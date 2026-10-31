import { ApiErrorCode } from '@bidplace/contracts';
import { describe, expect, it } from 'vitest';

import { AppException } from '../errors';
import {
  RetryableTransactionConflict,
  runReadCommittedTransaction,
} from './transaction';

function fakePrisma(run: (attempt: number) => Promise<unknown>): {
  calls: number;
  client: Parameters<typeof runReadCommittedTransaction>[0];
} {
  const state = { calls: 0 };
  return {
    get calls() {
      return state.calls;
    },
    client: {
      $transaction: async (
        callback: (tx: object) => Promise<unknown>,
        options?: { isolationLevel?: string },
      ) => {
        state.calls += 1;
        void callback;
        if (options?.isolationLevel !== 'ReadCommitted') {
          throw new Error(options?.isolationLevel ?? 'missing isolation');
        }
        return run(state.calls);
      },
    } as Parameters<typeof runReadCommittedTransaction>[0],
  };
}

describe('runTransaction', () => {
  it('retries RetryableTransactionConflict and returns the later result', async () => {
    const prisma = fakePrisma(async (attempt) => {
      if (attempt < 3) throw new RetryableTransactionConflict();
      return 'placed';
    });

    await expect(runReadCommittedTransaction(prisma.client, async () => 'unused')).resolves.toBe(
      'placed',
    );
    expect(prisma.calls).toBe(3);
  });

  it('rethrows conflict after the third attempt', async () => {
    const prisma = fakePrisma(async () => {
      throw new RetryableTransactionConflict();
    });

    await expect(
      runReadCommittedTransaction(prisma.client, async () => undefined),
    ).rejects.toMatchObject({
      apiCode: ApiErrorCode.CONFLICT,
      status: 409,
    });
    expect(prisma.calls).toBe(3);
  });

  it('does not retry other errors', async () => {
    const prisma = fakePrisma(async () => {
      throw new Error('void failed');
    });

    await expect(
      runReadCommittedTransaction(prisma.client, async () => undefined),
    ).rejects.toThrow('void failed');
    expect(prisma.calls).toBe(1);
  });

  it('retries when the conflict is on the error cause', async () => {
    const prisma = fakePrisma(async (attempt) => {
      if (attempt === 1) {
        throw new Error('wrapped', { cause: new RetryableTransactionConflict() });
      }
      return 'retried';
    });

    await expect(runReadCommittedTransaction(prisma.client, async () => 'unused')).resolves.toBe(
      'retried',
    );
    expect(prisma.calls).toBe(2);
  });

  it('does not walk a cause chain past the third link', async () => {
    const conflict = new RetryableTransactionConflict();
    const hidden = new Error('d4', {
      cause: new Error('d3', {
        cause: new Error('d2', { cause: new Error('d1', { cause: conflict }) }),
      }),
    });
    const prisma = fakePrisma(async () => {
      throw hidden;
    });

    await expect(
      runReadCommittedTransaction(prisma.client, async () => undefined),
    ).rejects.toBe(hidden);
    expect(prisma.calls).toBe(1);
  });

  it('maps an exhausted wrapped conflict to conflict', async () => {
    const prisma = fakePrisma(async () => {
      throw new Error('wrapped', { cause: new RetryableTransactionConflict() });
    });

    await expect(
      runReadCommittedTransaction(prisma.client, async () => undefined),
    ).rejects.toBeInstanceOf(AppException);
    expect(prisma.calls).toBe(3);
  });
});
