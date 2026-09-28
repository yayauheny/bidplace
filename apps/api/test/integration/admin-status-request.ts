import type { PrismaClient } from '@bidplace/database';

const revisionReviewStatuses = new Set([
  'APPROVED',
  'CHANGES_REQUESTED',
  'REJECTED',
]);

export async function sellerModerationRequest(
  prisma: PrismaClient,
  profileId: string,
  status: string,
  reason?: string,
) {
  const profile = await prisma.sellerProfile.findUniqueOrThrow({
    where: { id: profileId },
    select: {
      status: true,
      updatedAt: true,
      editingRevision: {
        select: { id: true, status: true, updatedAt: true },
      },
    },
  });
  return moderationRequest(profile, status, reason);
}

export async function productModerationRequest(
  prisma: PrismaClient,
  productId: string,
  status: string,
  reason?: string,
) {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    select: {
      status: true,
      updatedAt: true,
      editingRevision: {
        select: { id: true, status: true, updatedAt: true },
      },
    },
  });
  return moderationRequest(product, status, reason);
}

function moderationRequest(
  record: {
    status: string;
    updatedAt: Date;
    editingRevision: { id: string; status: string; updatedAt: Date } | null;
  },
  status: string,
  reason?: string,
) {
  const revision = record.editingRevision;
  const target =
    revision &&
    revision.status === 'PENDING_REVIEW' &&
    revisionReviewStatuses.has(status)
      ? {
          kind: 'revision' as const,
          id: revision.id,
          updatedAt: revision.updatedAt.toISOString(),
        }
      : {
          kind: 'parent' as const,
          status: record.status,
          updatedAt: record.updatedAt.toISOString(),
        };
  return {
    status,
    ...(reason === undefined ? {} : { reason }),
    target,
  };
}
