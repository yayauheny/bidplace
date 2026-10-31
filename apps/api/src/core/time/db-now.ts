import { Prisma } from '@bidplace/database';

/**
 * Deal time inside the caller transaction. `clock_timestamp()` is read when
 * this query runs, after a lock wait. `now()` stays at transaction start.
 */
export async function dbNow(
  tx: Pick<Prisma.TransactionClient, '$queryRaw'>,
): Promise<Date> {
  const [row] = await tx.$queryRaw<Array<{ now: Date | null }>>(
    Prisma.sql`SELECT clock_timestamp() AS now`,
  );
  const now = row?.now;
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new Error('Database clock is unavailable');
  }
  return now;
}
