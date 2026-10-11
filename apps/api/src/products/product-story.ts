import { STORY_LIMITS, storyResponseSchema, type StoryWriteRequest } from '@bidplace/contracts';
import { ConflictException, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@bidplace/database';

type StoryRow = {
  id: string;
  position: number;
  type: 'HEADING' | 'PARAGRAPH' | 'IMAGE';
  text: string | null;
  altText: string | null;
  mediaAssetId: string | null;
};

function sameStory(current: readonly StoryRow[], input: StoryWriteRequest): boolean {
  if (current.length !== input.blocks.length) return false;
  return input.blocks.every((block, index) => {
    const row = current[index];
    if (!row || row.type !== block.type) return false;
    if (block.id && block.id !== row.id) return false;
    if (block.type === 'IMAGE') {
      return row.mediaAssetId === block.mediaAssetId && (row.altText ?? null) === (block.altText ?? null);
    }
    return row.text === block.text;
  });
}

export function storyFromRows(revision: {
  storyToken?: number | null;
  storyBlocks?: ReadonlyArray<{
    id: string;
    position: number;
    type: 'HEADING' | 'PARAGRAPH' | 'IMAGE';
    text: string | null;
    altText: string | null;
    mediaAssetId: string | null;
  }> | null;
} | null) {
  return storyResponseSchema.parse({
    storyToken: revision?.storyToken ?? 0,
    blocks: (revision?.storyBlocks ?? []).map((block) => ({
      id: block.id,
      position: block.position,
      type: block.type,
      ...(block.type === 'IMAGE'
        ? { mediaAssetId: block.mediaAssetId, altText: block.altText }
        : { text: block.text }),
    })),
  });
}

export async function readStory(
  tx: Pick<Prisma.TransactionClient, 'productRevision'>,
  revisionId: string,
) {
  const revision = await tx.productRevision.findUniqueOrThrow({
    where: { id: revisionId },
    select: {
      storyToken: true,
      storyBlocks: { orderBy: { position: 'asc' } },
    },
  });
  return storyResponseSchema.parse({
    storyToken: revision.storyToken,
    blocks: revision.storyBlocks.map((block) => ({
      id: block.id,
      position: block.position,
      type: block.type,
      ...(block.type === 'IMAGE'
        ? { mediaAssetId: block.mediaAssetId, altText: block.altText }
        : { text: block.text }),
    })),
  });
}

export async function replaceProductStory(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    productId: string;
    revisionId: string;
    request: StoryWriteRequest;
  },
) {
  const revision = await tx.productRevision.findUniqueOrThrow({
    where: { id: input.revisionId },
    select: {
      storyToken: true,
      storyIdempotencyKey: true,
      storyBlocks: { orderBy: { position: 'asc' } },
    },
  });
  if (
    input.request.idempotencyKey &&
    input.request.idempotencyKey === revision.storyIdempotencyKey
  ) {
    return readStory(tx, input.revisionId);
  }
  if (
    input.request.storyToken !== revision.storyToken &&
    sameStory(revision.storyBlocks, input.request)
  ) {
    return readStory(tx, input.revisionId);
  }
  if (input.request.storyToken !== revision.storyToken) {
    throw new ConflictException('Story snapshot is stale');
  }

  const imageIds = input.request.blocks.flatMap((block) =>
    block.type === 'IMAGE' ? [block.mediaAssetId] : [],
  );
  await assertStoryImages(tx, input.userId, input.productId, input.revisionId, imageIds);

  const knownIds = new Set(revision.storyBlocks.map((block) => block.id));
  for (const block of input.request.blocks) {
    if (block.id && !knownIds.has(block.id)) {
      throw new NotFoundException('Story block not found');
    }
  }
  const keptIds = input.request.blocks.flatMap((block) => (block.id ? [block.id] : []));
  await tx.productRevisionStoryBlock.deleteMany({
    where: { revisionId: input.revisionId, id: { notIn: keptIds } },
  });
  await tx.productRevisionStoryBlock.updateMany({
    where: { revisionId: input.revisionId },
    data: { position: { increment: 1000 } },
  });
  for (const [position, block] of input.request.blocks.entries()) {
    const data = {
      position,
      type: block.type,
      text: block.type === 'IMAGE' ? null : block.text,
      altText: block.type === 'IMAGE' ? block.altText ?? null : null,
      mediaAssetId: block.type === 'IMAGE' ? block.mediaAssetId : null,
    };
    if (block.id) {
      await tx.productRevisionStoryBlock.update({ where: { id: block.id }, data });
    } else {
      await tx.productRevisionStoryBlock.create({
        data: { revisionId: input.revisionId, ...data },
      });
    }
  }
  await tx.productRevision.update({
    where: { id: input.revisionId },
    data: {
      storyToken: { increment: 1 },
      storyIdempotencyKey: input.request.idempotencyKey ?? null,
    },
  });
  return readStory(tx, input.revisionId);
}

async function assertStoryImages(
  tx: Prisma.TransactionClient,
  userId: string,
  productId: string,
  revisionId: string,
  assetIds: readonly string[],
) {
  if (assetIds.length > STORY_LIMITS.maxImages) {
    throw new ConflictException('Story has too many images');
  }
  if (new Set(assetIds).size !== assetIds.length) {
    throw new ConflictException('Story images must be unique');
  }
  if (assetIds.length === 0) return;
  const assets = await tx.mediaAsset.findMany({
    where: { id: { in: [...assetIds] } },
    select: {
      id: true,
      ownerUserId: true,
      purpose: true,
      state: true,
      objects: { where: { variant: 'SOURCE' }, select: { byteLength: true } },
      storyAssets: { where: { revisionId }, select: { revisionId: true } },
      images: {
        where: { productId },
        select: { revisions: { where: { revisionId }, select: { revisionId: true } } },
      },
    },
  });
  if (assets.length !== assetIds.length) {
    throw new NotFoundException('Story image not found');
  }
  let bytes = 0;
  for (const asset of assets) {
    if (asset.ownerUserId !== userId || asset.state !== 'READY') {
      throw new ConflictException('Story image is not ready');
    }
    const gallery = asset.images.some((image) => image.revisions.length > 0);
    const held = asset.storyAssets.length > 0;
    const allowed =
      (asset.purpose === 'WORK_IMAGE' && gallery) ||
      (asset.purpose === 'STORY_IMAGE' && held);
    if (!allowed) throw new ConflictException('Story image is not attached to this draft');
    bytes += asset.objects[0]?.byteLength ?? 0;
  }
  if (bytes > STORY_LIMITS.maxStoryImageBytes) {
    throw new ConflictException('Story images exceed the byte budget');
  }
}

export async function copyRevisionStory(
  tx: Prisma.TransactionClient,
  fromRevisionId: string,
  toRevisionId: string,
) {
  const [blocks, assets] = await Promise.all([
    tx.productRevisionStoryBlock.findMany({
      where: { revisionId: fromRevisionId },
      orderBy: { position: 'asc' },
    }),
    tx.productRevisionStoryAsset.findMany({ where: { revisionId: fromRevisionId } }),
  ]);
  if (assets.length > 0) {
    await tx.productRevisionStoryAsset.createMany({
      data: assets.map((asset) => ({
        revisionId: toRevisionId,
        mediaAssetId: asset.mediaAssetId,
      })),
    });
  }
  for (const block of blocks) {
    await tx.productRevisionStoryBlock.create({
      data: {
        revisionId: toRevisionId,
        position: block.position,
        type: block.type,
        text: block.text,
        altText: block.altText,
        mediaAssetId: block.mediaAssetId,
      },
    });
  }
  const terms = await tx.productRevisionTerm.findMany({
    where: { revisionId: fromRevisionId },
  });
  if (terms.length > 0) {
    await tx.productRevisionTerm.createMany({
      data: terms.map((term) => ({ revisionId: toRevisionId, termId: term.termId })),
    });
  }
}
