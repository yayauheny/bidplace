import { Prisma } from '@bidplace/database';
import { describe, expect, it, vi } from 'vitest';

import { dbNow } from './db-now';

describe('dbNow', () => {
  it('reads clock_timestamp from the caller transaction', async () => {
    const now = new Date('2020-01-01T00:00:00.000Z');
    const query = vi.fn().mockResolvedValue([{ now }]);

    await expect(
      dbNow({ $queryRaw: query } as unknown as Prisma.TransactionClient),
    ).resolves.toBe(now);

    const sql = query.mock.calls[0]?.[0] as { strings: string[] };
    expect(sql.strings.join(' ')).toContain('clock_timestamp()');
    expect(sql.strings.join(' ')).not.toContain('transaction_timestamp()');
  });

  it('rejects a missing database clock', async () => {
    const query = vi.fn().mockResolvedValue([{ now: null }]);

    await expect(
      dbNow({ $queryRaw: query } as unknown as Prisma.TransactionClient),
    ).rejects.toThrow('Database clock is unavailable');
  });
});
