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
  function Probe({ authEpoch }: { authEpoch: number }) {
    editor = useProductStoryEditor({
      api,
      productId: workId,
      revisionId,
      authEpoch,
      story: emptyStory,
    });
    return null;
  }
  const render = (authEpoch: number) => {
    act(() => root.render(createElement(Probe, { authEpoch })));
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
    expect(view.editor.blocks[0]).toMatchObject({ text: 'Текст' });
    await act(async () => {
      expect(await view.editor.save()).toBe(true);
    });
    expect(view.replaceCreation.mock.calls[0]?.[1].idempotencyKey).toBe(
      view.replaceCreation.mock.calls[1]?.[1].idempotencyKey,
    );
  });

  it('keeps an unsaved block and its revision token after a server conflict', async () => {
    const view = mount();
    view.replaceCreation.mockRejectedValueOnce(new Error('conflict'));
    act(() => view.editor.addText('PARAGRAPH'));
    act(() => view.editor.editText(view.editor.blocks[0]!.key, 'Сохранить локально'));
    await act(async () => {
      expect(await view.editor.save()).toBe(false);
    });
    expect(view.editor.dirty).toBe(true);
    expect(view.editor.blocks[0]).toMatchObject({ text: 'Сохранить локально' });
    expect(view.editor.error).toContain('История не сохранена');
    expect(view.replaceCreation.mock.calls[0]?.[1].storyToken).toBe(0);
  });

  it('preserves block order after editing and moving before save', async () => {
    const view = mount();
    const secondId = '85555555-5555-4555-8555-555555555555';
    view.replaceCreation.mockImplementationOnce(async (_id, request) => ({
      storyToken: 1,
      blocks: request.blocks.map((block: Record<string, unknown>, index: number) => ({
        ...block,
        id: index === 0 ? blockId : secondId,
        position: index,
      })),
    }));
    act(() => {
      view.editor.addText('PARAGRAPH');
      view.editor.addText('HEADING');
    });
    const [paragraph, heading] = view.editor.blocks;
    act(() => {
      view.editor.editText(paragraph!.key, 'Абзац');
      view.editor.editText(heading!.key, 'Заголовок');
      view.editor.move(heading!.key, -1);
    });
    await act(async () => {
      expect(await view.editor.save()).toBe(true);
    });
    const payload = view.replaceCreation.mock.calls[0]?.[1];
    expect(payload.blocks).toEqual([
      { type: 'HEADING', text: 'Заголовок' },
      { type: 'PARAGRAPH', text: 'Абзац' },
    ]);
    expect(view.editor.blocks.map((block) => block.key)).toEqual([
      heading!.key,
      paragraph!.key,
    ]);
  });

  it('retries an uncertain image upload with the same idempotency key', async () => {
    const view = mount();
    view.addStoryImage.mockRejectedValueOnce(new Error('connection dropped'));
    const image = new Blob(['image'], { type: 'image/png' });
    await act(async () => {
      expect(await view.editor.addImage(image)).toBe(false);
    });
    expect(view.editor.retryUpload).toBe(true);
    await act(async () => {
      expect(await view.editor.addImage()).toBe(true);
    });
    expect(view.addStoryImage.mock.calls[0]?.[2]).toBe(view.addStoryImage.mock.calls[1]?.[2]);
    expect(view.editor.blocks).toMatchObject([{ type: 'IMAGE', mediaAssetId: assetId }]);
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
