/**
 * @vitest-environment jsdom
 */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { ApiClient } from '@bidplace/api-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useProductStoryEditor } from './use-product-story-editor';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const workId = '81111111-1111-4111-8111-111111111111';
const revisionId = '82222222-2222-4222-8222-222222222222';
const blockId = '83333333-3333-4333-8333-333333333333';
const assetId = '84444444-4444-4444-8444-444444444444';
const emptyStory = { storyToken: 0, blocks: [] };
const cases: Array<() => void> = [];

function mount() {
  const replaceCreation = vi.fn().mockResolvedValue({
    storyToken: 1,
    blocks: [{ id: blockId, position: 0, type: 'PARAGRAPH', text: 'Текст' }],
  });
  const addStoryImage = vi.fn().mockResolvedValue({ mediaAssetId: assetId });
  const removeStoryImage = vi.fn().mockResolvedValue({ ok: true });
  const api = {
    products: { replaceCreation },
    images: { addStoryImage, removeStoryImage },
  } as unknown as ApiClient;

  let editor!: ReturnType<typeof useProductStoryEditor>;
  const container = document.createElement('div');
  const root = createRoot(container);
  const render = (authEpoch: number) => {
    act(() => {
      root.render(createElement(() => {
        editor = useProductStoryEditor({
          api,
          productId: workId,
          revisionId,
          authEpoch,
          story: emptyStory,
        });
        return null;
      }));
    });
  };
  render(1);
  cases.push(() => act(() => root.unmount()));
  return { get editor() { return editor; }, render, replaceCreation, addStoryImage };
}

afterEach(() => {
  cases.splice(0).forEach((cleanup) => cleanup());
});

describe('revision-backed Work Story editor', () => {
  it('saves blocks with a token and retains the server block identity', async () => {
    const view = mount();
    act(() => view.editor.addText('PARAGRAPH'));
    const key = view.editor.blocks[0]!.key;
    act(() => view.editor.editText(key, 'Текст'));
    await act(async () => {
      expect(await view.editor.save()).toBe(true);
    });
    expect(view.replaceCreation).toHaveBeenCalledWith(workId, {
      storyToken: 0,
      idempotencyKey: expect.any(String),
      blocks: [{ type: 'PARAGRAPH', text: 'Текст' }],
    });
    expect(view.editor.blocks[0]).toMatchObject({ id: blockId, key });
    expect(view.editor.dirty).toBe(false);
  });

  it('preserves local text and reuses the same key after a lost save response', async () => {
    const view = mount();
    view.replaceCreation.mockRejectedValueOnce(new Error('response lost'));
    act(() => view.editor.addText('PARAGRAPH'));
    act(() => view.editor.editText(view.editor.blocks[0]!.key, 'Текст'));
    await act(async () => {
      expect(await view.editor.save()).toBe(false);
    });
    expect(view.editor.dirty).toBe(true);
    expect(view.editor.blocks[0]?.text).toBe('Текст');
    await act(async () => {
      expect(await view.editor.save()).toBe(true);
    });
    expect(view.replaceCreation.mock.calls[0]?.[1].idempotencyKey).toBe(
      view.replaceCreation.mock.calls[1]?.[1].idempotencyKey,
    );
  });

  it('does not add a completed upload from a previous authentication epoch', async () => {
    const view = mount();
    let deliver!: (response: { mediaAssetId: string }) => void;
    view.addStoryImage.mockImplementationOnce(() => new Promise((resolve) => {
      deliver = resolve;
    }));
    let uploaded!: Promise<boolean>;
    act(() => {
      uploaded = view.editor.addImage(new Blob(['image'], { type: 'image/png' }));
    });
    view.render(2);
    await act(async () => {
      deliver({ mediaAssetId: assetId });
      expect(await uploaded).toBe(false);
    });
    expect(view.editor.blocks).toEqual([]);
    expect(view.editor.dirty).toBe(false);
  });
});
