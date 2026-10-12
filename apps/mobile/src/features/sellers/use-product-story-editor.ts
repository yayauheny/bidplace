import { useEffect, useRef, useState } from 'react';
import type { StoryBlock, StoryWriteRequest } from '@bidplace/contracts';
import { STORY_LIMITS, storyWriteRequestSchema } from '@bidplace/contracts';

import type { ApiClient } from '@bidplace/api-client';

export type EditableStoryBlock = StoryWriteRequest['blocks'][number] & { key: string };

type StorySnapshot = { storyToken: number; blocks: StoryBlock[] };
type DraftState = {
  identity: string;
  token: number;
  blocks: EditableStoryBlock[];
  dirty: boolean;
  pending: boolean;
  error: string | null;
};

function fromServer(identity: string, story?: StorySnapshot): DraftState {
  return {
    identity,
    token: story?.storyToken ?? 0,
    blocks: (story?.blocks ?? []).map(({ position: _position, ...block }) => ({
      ...block,
      key: block.id,
    })),
    dirty: false,
    pending: false,
    error: null,
  };
}

function writeBlocks(blocks: readonly EditableStoryBlock[]): StoryWriteRequest['blocks'] {
  return blocks.map(({ key: _key, ...block }) => block);
}

export function useProductStoryEditor({
  api,
  productId,
  revisionId,
  authEpoch,
  story,
}: {
  api: ApiClient;
  productId?: string;
  revisionId?: string;
  authEpoch: number;
  story?: StorySnapshot;
}) {
  const identity = `${authEpoch}:${productId ?? ''}:${revisionId ?? ''}`;
  const [state, setState] = useState<DraftState>(() => fromServer(identity, story));
  const current = useRef(state);
  const outstanding = useRef<Promise<boolean> | null>(null);
  const retry = useRef<{ snapshot: string; key: string } | null>(null);
  const pendingImage = useRef<{ image: Blob; key: string } | null>(null);
  const uploaded = useRef<Set<string>>(new Set());
  const persistedAssets = useRef<Set<string>>(new Set(
    (story?.blocks ?? []).flatMap((block) => block.type === 'IMAGE' ? [block.mediaAssetId] : []),
  ));

  const replace = (next: DraftState) => {
    current.current = next;
    setState(next);
  };

  useEffect(() => {
    const previous = current.current;
    if (previous.identity !== identity) {
      uploaded.current = new Set();
      persistedAssets.current = new Set(
        (story?.blocks ?? []).flatMap((block) => block.type === 'IMAGE' ? [block.mediaAssetId] : []),
      );
      outstanding.current = null;
      pendingImage.current = null;
      retry.current = null;
      replace(fromServer(identity, story));
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
    if (previous.identity !== identity || previous.pending) return;
    replace({ ...previous, blocks: update(previous.blocks), dirty: true, error: null });
    retry.current = null;
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
    if (!productId || current.current.pending || current.current.identity !== identity) return false;
    if (current.current.blocks.filter((block) => block.type === 'IMAGE').length >= STORY_LIMITS.maxImages) {
      replace({ ...current.current, error: 'Достигнут лимит изображений истории.' });
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
    const snapshot = JSON.stringify(parsed.data);
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
        const saved = result.blocks.map(({ position: _position, ...block }, index) => ({
          ...block,
          key: before.blocks[index]?.key ?? block.id,
        }));
        const removedAssets = [...new Set([
          ...persistedAssets.current,
          ...uploaded.current,
        ])].filter((id) => !result.blocks.some((block) => block.type === 'IMAGE' && block.mediaAssetId === id));
        persistedAssets.current = new Set(
          result.blocks.flatMap((block) => block.type === 'IMAGE' ? [block.mediaAssetId] : []),
        );
        replace({ ...current.current, token: result.storyToken, blocks: saved, dirty: false, pending: false });
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
      } finally {
        if (outstanding.current === task) outstanding.current = null;
      }
    })();
    outstanding.current = task;
    return task;
  };

  return {
    blocks: state.blocks,
    dirty: state.dirty,
    pending: state.pending,
    error: state.error,
    retryUpload: pendingImage.current !== null,
    addText,
    addGalleryImage,
    editText,
    editAlt,
    remove,
    move,
    addImage,
    save,
  };
}
