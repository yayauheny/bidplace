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
 * Local restore covers unfinished text blocks only; uploaded images stay
 * server-side and are re-added from the gallery after a reload.
 */
const storyTextBlockSchema = z.object({
  key: z.string(),
  type: z.enum(['HEADING', 'PARAGRAPH']),
  text: z.string(),
});

export const storyLocalDraftSchema = z.object({
  token: z.number(),
  blocks: z.array(storyTextBlockSchema),
});

export type StoryLocalDraft = z.infer<typeof storyLocalDraftSchema>;

function storyDraftKey(accountId: string | null, productId: string | undefined) {
  if (!accountId) return null;
  return formDraftKey(accountId, 'product-story', productId ?? 'new');
}

function textBlocksOf(blocks: readonly EditableStoryBlock[]) {
  return blocks
    .filter((block) => block.type !== 'IMAGE')
    .map((block) => ({
      key: block.key,
      type: block.type as 'HEADING' | 'PARAGRAPH',
      text: block.text,
    }));
}

type StorySnapshot = { storyToken: number; blocks: StoryBlock[] };
type DraftState = {
  identity: string;
  token: number;
  blocks: EditableStoryBlock[];
  dirty: boolean;
  pending: boolean;
  error: string | null;
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
        token: current.current.token,
        blocks: textBlocksOf(current.current.blocks),
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
    if (stored.blocks.length === 0) return base;
    // Stored keys are client-side; after a remount the server blocks carry
    // server ids, so dedup by content with occurrence counting.
    const serverCounts = new Map<string, number>();
    for (const block of base.blocks) {
      if (block.type === 'IMAGE') continue;
      const contentKey = `${block.type}:${block.text}`;
      serverCounts.set(contentKey, (serverCounts.get(contentKey) ?? 0) + 1);
    }
    const fresh = stored.blocks.filter((block) => {
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
      blocks: [...base.blocks, ...fresh],
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

  useEffect(() => {
    const previous = current.current;
    if (previous.identity !== identity) {
      writer.current.cancel();
      uploaded.current = new Set();
      outstanding.current = null;
      pendingImage.current = null;
      retry.current = null;
      // Own save moved the story to a new revision: the same product stays,
      // so keep the saved blocks instead of restoring a stale snapshot.
      const sameProduct =
        previous.identity.split(':').slice(0, 2).join(':') ===
        identity.split(':').slice(0, 2).join(':');
      if (sameProduct && !previous.dirty && !previous.pending) {
        persistedAssets.current = new Set(
          previous.blocks.flatMap((block) => block.type === 'IMAGE' ? [block.mediaAssetId] : []),
        );
        replace({ ...previous, identity });
        return;
      }
      persistedAssets.current = new Set(
        (story?.blocks ?? []).flatMap((block) => block.type === 'IMAGE' ? [block.mediaAssetId] : []),
      );
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
        // The server holds the saved blocks; drop the local copy unless the
        // user typed further edits while the request was in flight. Server
        // responses add block ids, so compare content without them.
        const savedBlocks = writeBlocks(current.current.blocks);
        const sameBlocks =
          savedBlocks.length === parsed.data.blocks.length &&
          savedBlocks.every((block, index) => {
            const stripId = (value: Record<string, unknown>) => {
              const rest = { ...value };
              delete rest.id;
              return JSON.stringify(rest);
            };
            return stripId(block as Record<string, unknown>) ===
              stripId(parsed.data.blocks[index] as Record<string, unknown>);
          });
        if (sameBlocks) {
          clearLocalDraft();
        } else {
          writer.current.flush();
        }
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
