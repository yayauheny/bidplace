import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@bidplace/database';

export async function lockSellerProfileRevisionRowForUpdate(
  tx: Pick<Prisma.TransactionClient, '$queryRaw'>,
  revisionId: string,
): Promise<void> {
  const rows = await tx.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`SELECT id FROM "seller_profile_revisions" WHERE id = ${revisionId}::uuid FOR UPDATE`,
  );
  if (rows.length === 0) {
    throw new NotFoundException('Seller profile revision not found');
  }
}
