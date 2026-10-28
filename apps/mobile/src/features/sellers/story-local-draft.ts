import { z } from 'zod';
import type { StoryWriteRequest } from '@bidplace/contracts';
import {
  formDraftKey,
  readFormDraft,
  writeFormDraft,
  clearFormDraft,
} from '../../lib/local-form-draft';

export type EditableStoryBlock = StoryWriteRequest['blocks'][number] & {
  key: string;
};

/**
 * Local restore covers unfinished story state; uploaded images stay
 * server-side — the draft keeps only their ids and order, never bytes.
 * v2 blocks carry stable keys (server block id when persisted, client key
 * otherwise) so restore matches by identity and order, not by content.
 */
const storyTextBlockSchema = z.object({
  key: z.string(),
  type: z.enum(['HEADING', 'PARAGRAPH']),
  text: z.string(),
});

const storyImageBlockSchema = z.object({
  key: z.string(),
  type: z.literal('IMAGE'),
  mediaAssetId: z.string(),
  altText: z.string().nullable(),
});

const storyStoredBlockSchema = z.discriminatedUnion('type', [
  storyTextBlockSchema,
  storyImageBlockSchema,
]);

export const storyLocalDraftSchema = z.object({
  v: z.literal(2),
  // The server revision this draft belongs to. A draft without a revision id
  // is ambiguous (written before revision tracking) and must never be applied
  // to a concrete revision.
  revisionId: z.string().optional(),
  token: z.number(),
  blocks: z.array(storyStoredBlockSchema),
});

export type StoryLocalDraft = z.infer<typeof storyLocalDraftSchema>;

function storyDraftEntityId(
  productId: string | undefined,
  revisionId: string | undefined,
): string {
  // The creation flow has no product/revision yet: it keeps the single
  // revision-less 'new' surface that migrateStoryDraft moves after create.
  if (!productId) return 'new';
  return revisionId ? `${productId}@${revisionId}` : productId;
}

export function storyDraftKey(
  accountId: string | null,
  productId: string | undefined,
  revisionId: string | undefined,
) {
  if (!accountId) return null;
  return formDraftKey(
    accountId,
    'product-story',
    storyDraftEntityId(productId, revisionId),
  );
}

/**
 * A draft that must never be applied automatically (another revision's copy,
 * or one written before revision tracking) is kept here, one per revision
 * scope, so live writes and confirmed saves cannot destroy the only copy.
 * Logout clears it with the account prefix; the notice offers the text.
 */
export function storyDraftRecoveryKey(
  accountId: string,
  productId: string | undefined,
  revisionId: string | undefined,
): string {
  return `${storyDraftKey(accountId, productId, revisionId)}~recovery`;
}

export function storedBlocksOf(blocks: readonly EditableStoryBlock[]) {
  return blocks.map((block) => {
    // Server ids survive a remount; client keys identify not-yet-saved blocks.
    const key = block.id ?? block.key;
    if (block.type === 'IMAGE') {
      return {
        key,
        type: 'IMAGE' as const,
        mediaAssetId: block.mediaAssetId,
        altText: block.altText ?? null,
      };
    }
    return {
      key,
      type: block.type as 'HEADING' | 'PARAGRAPH',
      text: block.text,
    };
  });
}

export function draftTextOf(stored: StoryLocalDraft): string | null {
  const text = stored.blocks
    .map((block) => (block.type === 'IMAGE' ? '' : block.text))
    .filter(Boolean)
    .join('\n\n');
  return text || null;
}

export function writeBlocks(
  blocks: readonly EditableStoryBlock[],
): StoryWriteRequest['blocks'] {
  return blocks
    .filter((block) => block.type === 'IMAGE' || Boolean(block.text.trim()))
    .map((block) => {
      if (block.type === 'IMAGE') {
        return {
          id: block.id,
          type: 'IMAGE',
          mediaAssetId: block.mediaAssetId,
          altText: block.altText?.trim() || null,
        };
      }
      return {
        id: block.id,
        type: block.type,
        text: block.text,
      };
    });
}

export function moveStoredDraft(
  fromKey: string,
  toKey: string,
): 'moved' | 'kept-source' | 'nothing' {
  const stored = readFormDraft(fromKey, storyLocalDraftSchema);
  if (!stored) return 'nothing'; // nothing parseable there; leave it as is
  const existing = readFormDraft(toKey, storyLocalDraftSchema);
  if (existing) {
    if (JSON.stringify(existing) === JSON.stringify(stored)) {
      // Identical copies collapse into the destination; no write needed.
      clearFormDraft(fromKey);
      return 'moved';
    }
    return 'kept-source'; // occupied by a different copy; never overwrite
  }
  if (writeFormDraft(toKey, stored) === 'ok') {
    clearFormDraft(fromKey);
    return 'moved';
  }
  return 'kept-source';
}

export function restoreV2<
  T extends { blocks: EditableStoryBlock[]; dirty: boolean },
>(base: T, stored: StoryLocalDraft): T {
  const serverByKey = new Map(base.blocks.map((block) => [block.key, block]));
  const blocks: EditableStoryBlock[] = [];
  for (const block of stored.blocks) {
    const match = serverByKey.get(block.key);
    if (block.type === 'IMAGE') {
      blocks.push(
        match?.type === 'IMAGE'
          ? { ...match, altText: block.altText ?? null }
          : {
              key: block.key,
              type: 'IMAGE',
              mediaAssetId: block.mediaAssetId,
              altText: block.altText ?? null,
            },
      );
      continue;
    }
    if (match && match.type !== 'IMAGE') {
      blocks.push({ ...match, text: block.text });
      continue;
    }
    blocks.push({ key: block.key, type: block.type, text: block.text });
  }
  const same =
    JSON.stringify(writeBlocks(blocks)) ===
    JSON.stringify(writeBlocks(base.blocks));
  if (same) return base;
  return { ...base, blocks, dirty: true };
}
