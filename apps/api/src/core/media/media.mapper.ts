import type { Prisma } from '@bidplace/database';
export const publicMediaAssetSelect = {
  objects: {
    where: {
      tier: 'PUBLIC' as const,
      state: 'READY' as const,
      variant: { not: 'SOURCE' as const },
    },
    select: {
      variant: true,
      publicUrl: true,
      mimeType: true,
      byteLength: true,
      sha256: true,
      width: true,
      height: true,
    },
  },
} satisfies Prisma.MediaAssetSelect;
export type PublicMediaAsset = Prisma.MediaAssetGetPayload<{
  select: typeof publicMediaAssetSelect;
}>;
export function publicVariant(
  asset: PublicMediaAsset | null | undefined,
  variant: 'PREVIEW' | 'FULL',
) {
  const object = asset?.objects.find((item) => item.variant === variant);
  if (!object?.publicUrl) return null;
  return {
    url: object.publicUrl,
    mimeType: object.mimeType,
    byteLength: object.byteLength,
    checksum: object.sha256,
    width: object.width,
    height: object.height,
  };
}

export const mediaDeliverySelect = {
  where: { kind: 'PUBLISH' as const },
  orderBy: { createdAt: 'desc' as const },
  take: 1,
  select: { id: true, kind: true, state: true, attemptCount: true },
} satisfies Prisma.MediaOperationFindManyArgs;
