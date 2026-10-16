import { useEffect, useRef, useState } from 'react';
import type { StoryBlock, StoryWriteRequest } from '@bidplace/contracts';
import { STORY_LIMITS, storyWriteRequestSchema } from '@bidplace/contracts';
import { z } from 'zod';

import type { ApiClient } from '@bidplace/api-client';

import {
  clearFormDraft,
  createDraftWriter,
  formDraftKey,
  readFormDraft,
  writeFormDraft,
} from '../../lib/local-form-draft';

export type EditableStoryBlock = StoryWriteRequest['blocks'][number] & { key: string };

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
  v: z.literal(2).optional(),
  token: z.number(),
  blocks: z.array(storyStoredBlockSchema),
});

export type StoryLocalDraft = z.infer<typeof storyLocalDraftSchema>;

function storyDraftKey(accountId: string | null, productId: string | undefined) {
  if (!accountId) return null;
  return formDraftKey(accountId, 'product-story', productId ?? 'new');
}

function storedBlocksOf(blocks: readonly EditableStoryBlock[]) {
  return blocks.map((block) => {
    // Server ids survive a remount; client keys identify not-yet-saved blocks.
    const key = block.id ?? block.key;
    if (block.type === 'IMAGE') {
      return { key, type: 'IMAGE' as const, mediaAssetId: block.mediaAssetId, altText: block.altText ?? null };
    }
    return { key, type: block.type as 'HEADING' | 'PARAGRAPH', text: block.text };
  });
}

type StorySnapshot = { storyToken: number; blocks: StoryBlock[] };
type DraftState = {
  identity: string;
  token: number;
  blocks: EditableStoryBlock[];
  dirty: boolean;
  pending: boolean;
  error: string | null;
  /** True once this state incorporates a real server story snapshot. */
  serverHydrated: boolean;
};

function editableBlock(block: StoryBlock, key: string = block.id): EditableStoryBlock {
  switch (block.type) {
    case 'HEADING':
      return { id: block.id, key, type: block.type, text: block.text };
    case 'PARAGRAPH':
      return { id: block.id, key, type: block.type, text: block.text };
    case 'IMAGE':
      return {
        id: block.id,
        key,
        type: 'IMAGE',
        mediaAssetId: block.mediaAssetId,
        altText: block.altText ?? null,
      };
  }
}

function fromServer(identity: string, story?: StorySnapshot): DraftState {
  return {
    identity,
    token: story?.storyToken ?? 0,
    blocks: (story?.blocks ?? []).map((block) => editableBlock(block)),
    dirty: false,
    pending: false,
    error: null,
    serverHydrated: story !== undefined,
  };
}

function writeBlocks(blocks: readonly EditableStoryBlock[]): StoryWriteRequest['blocks'] {
  return blocks.map((block) => {
    if (block.type === 'IMAGE') {
      return {
        id: block.id,
        type: 'IMAGE',
        mediaAssetId: block.mediaAssetId,
        altText: block.altText ?? null,
      };
    }
    return {
      id: block.id,
      type: block.type,
      text: block.text,
    };
  });
}

export function useProductStoryEditor({
  api,
  productId,
  revisionId,
  authEpoch,
  accountId,
  story,
  onSaved,
  canChange,
}: {
  api: ApiClient;
  productId?: string;
  revisionId?: string;
  authEpoch: number;
  accountId: string | null;
  story?: StorySnapshot;
  onSaved?: (story: StorySnapshot) => void;
  canChange?: () => boolean;
}) {
  const identity = `${authEpoch}:${productId ?? ''}:${revisionId ?? ''}`;
  const [state, setState] = useState<DraftState>(() => fromServer(identity, story));
  const current = useRef(state);
  const outstanding = useRef<Promise<boolean> | null>(null);
  const retry = useRef<{ snapshot: string; key: string } | null>(null);
  const pendingImage = useRef<{ image: Blob; key: string } | null>(null);
  const uploaded = useRef<Set<string>>(new Set());
  const writer = useRef(createDraftWriter());
  const accountRef = useRef(accountId);
  const productRef = useRef(productId);
  accountRef.current = accountId;
  productRef.current = productId;
  const persistedAssets = useRef<Set<string>>(new Set(
    (story?.blocks ?? []).flatMap((block) => block.type === 'IMAGE' ? [block.mediaAssetId] : []),
  ));

  const replace = (next: DraftState) => {
    current.current = next;
    setState(next);
  };

  const persistDraft = () => {
    const key = storyDraftKey(accountRef.current, productRef.current);
    if (!key) return;
    writer.current.schedule(() => {
      const draft: StoryLocalDraft = {
        v: 2,
        token: current.current.token,
        blocks: storedBlocksOf(current.current.blocks),
      };
      writeFormDraft(key, draft);
    });
  };

  const restoreDraft = (identityNow: string, storySnapshot?: StorySnapshot): DraftState => {
    const key = storyDraftKey(accountRef.current, productRef.current);
    const base = fromServer(identityNow, storySnapshot);
    if (!key) return base;
    const stored = readFormDraft(key, storyLocalDraftSchema);
    if (!stored) return base;
    const serverToken = storySnapshot?.storyToken ?? 0;
    if (stored.token < serverToken) {
      // A newer server story exists; the last server save wins.
      clearFormDraft(key);
      return base;
    }
    if (stored.v === 2) return restoreV2(base, stored);
    return restoreLegacy(base, stored);
  };

  // v2: blocks match server blocks by stable key, so identity, edits,
  // deletions and reordering restore exactly; server media keeps its id.
  const restoreV2 = (base: DraftState, stored: StoryLocalDraft): DraftState => {
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
      JSON.stringify(writeBlocks(blocks)) === JSON.stringify(writeBlocks(base.blocks));
    if (same) return base;
    return { ...base, blocks, dirty: true };
  };

  // Legacy text-only payloads cannot record deletions/reordering/images, so
  // they keep the old content-merge semantics; the ambiguity is documented
  // in the wave report rather than guessed.
  const restoreLegacy = (base: DraftState, stored: StoryLocalDraft): DraftState => {
    const storedTexts = stored.blocks.filter(
      (block): block is z.infer<typeof storyTextBlockSchema> => block.type !== 'IMAGE',
    );
    if (storedTexts.length === 0) return base;
    const serverCounts = new Map<string, number>();
    for (const block of base.blocks) {
      if (block.type === 'IMAGE') continue;
      const contentKey = `${block.type}:${block.text}`;
      serverCounts.set(contentKey, (serverCounts.get(contentKey) ?? 0) + 1);
    }
    const fresh = storedTexts.filter((block) => {
      const contentKey = `${block.type}:${block.text}`;
      const count = serverCounts.get(contentKey) ?? 0;
      if (count > 0) {
        serverCounts.set(contentKey, count - 1);
        return false;
      }
      return true;
    });
    if (fresh.length === 0) return base;
    return {
      ...base,
      blocks: [
        ...base.blocks,
        ...fresh.map((block) => ({ key: block.key, type: block.type, text: block.text })),
      ],
      dirty: true,
    };
  };

  const clearLocalDraft = () => {
    writer.current.cancel();
    const key = storyDraftKey(accountRef.current, productRef.current);
    if (key) clearFormDraft(key);
  };

  useEffect(() => {
    return () => {
      // Persist the last text edits on unmount. A closed session already had
      // its pending write cancelled by the identity change above.
      writer.current.flush();
    };
  }, []);

  // One restore attempt per identity, including a plain mount with stable
  // identity (cached server data): otherwise a stored draft is never read.
  const restoredFor = useRef<string | null>(null);

  useEffect(() => {
    const previous = current.current;
    if (previous.identity !== identity) {
      writer.current.cancel();
      uploaded.current = new Set();
      outstanding.current = null;
      pendingImage.current = null;
      retry.current = null;
      // Own save moved the story to a new revision: the same product stays,
      // so keep the saved blocks instead of restoring a stale snapshot. Only
      // a state that already holds a server snapshot may be retagged — a
      // pre-hydration empty state must hydrate normally (cold server read).
      const sameProduct =
        previous.identity.split(':').slice(0, 2).join(':') ===
        identity.split(':').slice(0, 2).join(':');
      if (
        sameProduct &&
        !previous.dirty &&
        !previous.pending &&
        previous.serverHydrated
      ) {
        persistedAssets.current = new Set(
          previous.blocks.flatMap((block) => block.type === 'IMAGE' ? [block.mediaAssetId] : []),
        );
        restoredFor.current = identity;
        replace({ ...previous, identity });
        return;
      }
      persistedAssets.current = new Set(
        (story?.blocks ?? []).flatMap((block) => block.type === 'IMAGE' ? [block.mediaAssetId] : []),
      );
      restoredFor.current = identity;
      replace(restoreDraft(identity, story));
    } else if (restoredFor.current !== identity) {
      restoredFor.current = identity;
      replace(restoreDraft(identity, story));
    } else if (
      story &&
      !previous.dirty &&
      !previous.pending &&
      story.storyToken > previous.token
    ) {
      persistedAssets.current = new Set(
        story.blocks.flatMap((block) => block.type === 'IMAGE' ? [block.mediaAssetId] : []),
      );
      replace(fromServer(identity, story));
    }
  }, [identity, story?.storyToken]);

  const change = (update: (blocks: EditableStoryBlock[]) => EditableStoryBlock[]) => {
    const previous = current.current;
    if (previous.identity !== identity || previous.pending || canChange?.() === false) return;
    replace({ ...previous, blocks: update(previous.blocks), dirty: true, error: null });
    retry.current = null;
    persistDraft();
  };

  const addText = (type: 'HEADING' | 'PARAGRAPH') => {
    const count = current.current.blocks.filter((block) => block.type !== 'IMAGE').length;
    if (count >= STORY_LIMITS.maxTextBlocks) return;
    change((blocks) => [...blocks, { key: crypto.randomUUID(), type, text: '' }]);
  };

  const addGalleryImage = (mediaAssetId: string) => {
    const count = current.current.blocks.filter((block) => block.type === 'IMAGE').length;
    if (count >= STORY_LIMITS.maxImages) return;
    change((blocks) => [...blocks, {
      key: crypto.randomUUID(),
      type: 'IMAGE',
      mediaAssetId,
      altText: null,
    }]);
  };

  const editText = (key: string, text: string) =>
    change((blocks) => blocks.map((block) =>
      block.key === key && block.type !== 'IMAGE' ? { ...block, text } : block,
    ));

  const editAlt = (key: string, altText: string) =>
    change((blocks) => blocks.map((block) =>
      block.key === key && block.type === 'IMAGE' ? { ...block, altText: altText || null } : block,
    ));

  const remove = (key: string) => change((blocks) => blocks.filter((block) => block.key !== key));

  const move = (key: string, direction: -1 | 1) => change((blocks) => {
    const index = blocks.findIndex((block) => block.key === key);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= blocks.length) return blocks;
    const next = [...blocks];
    [next[index], next[target]] = [next[target]!, next[index]!];
    return next;
  });

  const addImage = async (image?: Blob): Promise<boolean> => {
    if (!productId || current.current.pending || current.current.identity !== identity || canChange?.() === false) return false;
    if (current.current.blocks.filter((block) => block.type === 'IMAGE').length >= STORY_LIMITS.maxImages) {
      replace({ ...current.current, error: 'Достигнут лимит изображений истории.' });
      return false;
    }
    if (image && image.size > STORY_LIMITS.maxFileBytes) {
      replace({ ...current.current, error: 'Фото истории должно быть не больше 5 МиБ.' });
      return false;
    }
    if (image && pendingImage.current) {
      replace({ ...current.current, error: 'Сначала повторите предыдущую загрузку.' });
      return false;
    }
    const pending = pendingImage.current ?? (image
      ? { image, key: crypto.randomUUID() }
      : null);
    if (!pending) return false;
    pendingImage.current = pending;
    const previous = current.current;
    replace({ ...previous, pending: true, error: null });
    try {
      const result = await api.images.addStoryImage(productId, pending.image, pending.key);
      if (current.current.identity !== identity) return false;
      pendingImage.current = null;
      uploaded.current.add(result.mediaAssetId);
      replace({
        ...current.current,
        pending: false,
        dirty: true,
        blocks: [...current.current.blocks, {
          key: crypto.randomUUID(),
          type: 'IMAGE',
          mediaAssetId: result.mediaAssetId,
          altText: null,
        }],
      });
      persistDraft();
      return true;
    } catch {
      if (current.current.identity === identity) {
        replace({
          ...current.current,
          pending: false,
          error: 'Не удалось загрузить фото. Повторите загрузку без повторного выбора файла.',
        });
      }
      return false;
    }
  };

  const save = async (): Promise<boolean> => {
    const before = current.current;
    if (before.identity !== identity || before.pending || !productId) return false;
    if (!before.dirty) return true;
    if (outstanding.current) return false;
    const blocks = writeBlocks(before.blocks);
    const parsed = storyWriteRequestSchema.safeParse({
      storyToken: before.token,
      blocks,
    });
    if (!parsed.success) {
      replace({
        ...before,
        error: 'Проверьте текст и ограничения блоков истории перед сохранением.',
      });
      return false;
    }
    const snapshot = JSON.stringify(parsed.data.blocks);
    if (!retry.current || retry.current.snapshot !== snapshot) {
      retry.current = { snapshot, key: crypto.randomUUID() };
    }
    const request = { ...parsed.data, idempotencyKey: retry.current.key };
    replace({ ...before, pending: true, error: null });
    const task = (async () => {
      try {
        const result = await api.products.replaceCreation(productId, request);
        if (current.current.identity !== identity) return false;
        retry.current = null;
        const saved = result.blocks.map((block, index) =>
          editableBlock(block, before.blocks[index]?.key ?? block.id),
        );
        const removedAssets = [...new Set([
          ...persistedAssets.current,
          ...uploaded.current,
        ])].filter((id) => !result.blocks.some((block) => block.type === 'IMAGE' && block.mediaAssetId === id));
        persistedAssets.current = new Set(
          result.blocks.flatMap((block) => block.type === 'IMAGE' ? [block.mediaAssetId] : []),
        );
        replace({ ...current.current, token: result.storyToken, blocks: saved, dirty: false, pending: false });
        // change() blocks input while pending, so the confirmed response is
        // the whole local operation — drop the stored copy for this identity.
        clearLocalDraft();
        onSaved?.(result);
        for (const assetId of removedAssets) {
          try {
            await api.images.removeStoryImage(productId, assetId);
            uploaded.current.delete(assetId);
          } catch {
            // A failed hold release cannot undo a successfully saved story.
          }
        }
        return true;
      } catch {
        if (current.current.identity === identity) {
          replace({
            ...current.current,
            pending: false,
            error: 'История не сохранена. При конфликте с другой вкладкой сохраните текст и обновите страницу.',
          });
        }
        return false;
      }
    })();
    outstanding.current = task;
    void task.finally(() => {
      if (outstanding.current === task) outstanding.current = null;
    });
    return task;
  };

  const reportError = (message: string) => {
    if (current.current.identity !== identity) return;
    replace({ ...current.current, error: message });
  };

  return {
    blocks: state.blocks,
    dirty: state.dirty,
    pending: state.pending,
    error: state.error,
    retryUpload: pendingImage.current !== null,
    // Synchronous read for guard effects: rendered dirty/pending can lag one
    // commit behind when a save response lands before the effect phase.
    isEffectivelyClean: () => !current.current.dirty && !current.current.pending,
    addText,
    addGalleryImage,
    editText,
    editAlt,
    remove,
    move,
    addImage,
    reportError,
    save,
  };
}

export type ProductStoryEditor = ReturnType<typeof useProductStoryEditor>;
