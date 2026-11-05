import type { Prisma } from '@bidplace/database';
import { ForbiddenException } from '@nestjs/common';

// Caller holds the actor's user row lock until the sensitive transaction commits.
export async function assertActiveAdmin(tx: Prisma.TransactionClient, adminId: string): Promise<void> {
  const admin = await tx.user.findUnique({
    where: { id: adminId },
    select: { role: true, status: true },
  });
  if (admin?.role !== 'admin' || admin.status !== 'active') {
    throw new ForbiddenException('Active admin required');
  }
}
