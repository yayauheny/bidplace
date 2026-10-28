/**
 * @vitest-environment jsdom
 */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient } from '@tanstack/react-query';
import type { ApiClient } from '@bidplace/api-client';
import type { StoryBlock } from '@bidplace/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useProductStoryEditor } from './use-product-story-editor';
import { clearAccountFormDrafts } from '../../lib/local-form-draft';
import {
  issueDraftWriteLease,
  retireDraftWriteLease,
} from '../../lib/query-cache';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const workId = '81111111-1111-4111-8111-111111111111';
const revisionId = '82222222-2222-4222-8222-222222222222';
const blockId = '83333333-3333-4333-8333-333333333333';
const assetId = '84444444-4444-4444-8444-444444444444';
const emptyStory: { storyToken: number; blocks: StoryBlock[] } = {
  storyToken: 0,
  blocks: [],
};
// Active story drafts are scoped per revision; the plain product key is the
// legacy surface that is migrated on read, foreign copies land in recovery.
const legacyStoryKey = `bidplace:draft:user-a:product-story:${workId}`;
const activeStoryKey = `${legacyStoryKey}@${revisionId}`;
const recoveryStoryKey = `${activeStoryKey}~recovery`;
const cases: Array<() => void> = [];

type StorySnapshot = { storyToken: number; blocks: StoryBlock[] };

function mount(
  accountId: string | null = null,
  story: StorySnapshot | null = emptyStory,
  initialStoryRevisionId: string | undefined = revisionId,
) {
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
  const queryClient = new QueryClient();
  const container = document.createElement('div');
  const root = createRoot(container);
  function Probe({
    authEpoch,
    revisionId: revision,
    liveStory,
    liveStoryRevisionId,
  }: {
    authEpoch: number;
    revisionId?: string;
    liveStory: StorySnapshot | null;
    liveStoryRevisionId?: string;
  }) {
    editor = useProductStoryEditor({
      api,
      productId: workId,
      revisionId: revision,
      storyRevisionId: liveStoryRevisionId,
      authEpoch,
      accountId,
      queryClient,
      story: liveStory ?? undefined,
    });
    return null;
  }
  const render = (
    authEpoch: number,
    nextRevisionId?: string,
    nextStory?: StorySnapshot | null,
    storyRevisionId?: string,
  ) => {
    // A passed snapshot belongs to the rendered revision unless the test says
    // otherwise; the default (mount) snapshot keeps its initial revision, like
    // an owner query that has not caught up with a revision change.
    const defaultStoryRevisionId =
      nextStory === undefined ? revisionId : nextRevisionId;
    act(() =>
      root.render(
        createElement(Probe, {
          authEpoch,
          revisionId: nextRevisionId,
          liveStory: nextStory === undefined ? story : nextStory,
          liveStoryRevisionId: storyRevisionId ?? defaultStoryRevisionId,
        }),
      ),
    );
  };
  render(1, revisionId, story, initialStoryRevisionId);
  cases.push(() => act(() => root.unmount()));
  return {
    queryClient,
    get editor() {
      return editor;
    },
    render,
    replaceCreation,
    addStoryImage,
    removeStoryImage,
  };
}

afterEach(() => {
  cases.splice(0).forEach((cleanup) => cleanup());
  window.localStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('revision-backed Work Story editor', () => {
  it('keeps text edits during upload and saves whitespace alt as null without client hold release', async () => {
    const view = mount();
    let finish!: (value: { mediaAssetId: string }) => void;
    view.addStoryImage.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    let key = '';
    act(() => { key = view.editor.addText('PARAGRAPH', 'Before')!; });
    let upload!: Promise<boolean>;
    act(() => { upload = view.editor.addImage(new Blob(['png'], { type: 'image/png' })); });
    act(() => view.editor.editText(key, 'Typed during upload'));
    expect(view.editor.blocks[0]).toMatchObject({ text: 'Typed during upload' });
    await act(async () => { finish({ mediaAssetId: assetId }); await upload; });
    const image = view.editor.blocks.find((block) => block.type === 'IMAGE')!;
    act(() => view.editor.editAlt(image.key, '   '));
    view.replaceCreation.mockResolvedValueOnce({ storyToken: 1, blocks: [
      { id: blockId, position: 0, type: 'PARAGRAPH', text: 'Typed during upload' },
      { id: '85555555-5555-4555-8555-555555555555', position: 1, type: 'IMAGE', mediaAssetId: assetId, altText: null },
    ] });
    await act(async () => { expect(await view.editor.save()).toBe(true); });
    expect(view.replaceCreation.mock.calls[0]?.[1].blocks[1]).toMatchObject({ altText: null });
    act(() => view.editor.remove(image.key));
    view.replaceCreation.mockResolvedValueOnce({ storyToken: 2, blocks: [{ id: blockId, position: 0, type: 'PARAGRAPH', text: 'Typed during upload' }] });
    await act(async () => { expect(await view.editor.save()).toBe(true); });
    expect(view.removeStoryImage).not.toHaveBeenCalled();
  });

  it('adopts the empty input key and keeps it while editing and clearing its contents', async () => {
    const view = mount();
    const inputKey = 'empty-input';
    act(() => {
      expect(view.editor.addText('PARAGRAPH', 'А', inputKey)).toBe(inputKey);
    });
    act(() => view.editor.editText(inputKey, 'АБВ'));
    expect(view.editor.blocks).toMatchObject([{ key: inputKey, text: 'АБВ' }]);
    act(() => view.editor.editText(inputKey, '   '));
    expect(view.editor.blocks).toMatchObject([{ key: inputKey, text: '   ' }]);
    view.replaceCreation.mockResolvedValueOnce({ storyToken: 1, blocks: [] });
    await act(() => view.editor.save());
    expect(view.replaceCreation.mock.calls[0]?.[1].blocks).toEqual([]);
  });

  it('omits blank text from saving without changing the identity of meaningful blocks', async () => {
    const view = mount();
    view.replaceCreation.mockResolvedValue({
      storyToken: 1,
      blocks: [{ id: blockId, position: 0, type: 'PARAGRAPH', text: 'Текст' }],
    });
    let meaningful = '';
    act(() => {
      view.editor.addText('HEADING', '   ');
      meaningful = view.editor.addText('PARAGRAPH', 'Текст')!;
      view.editor.addText('PARAGRAPH');
    });
    await act(() => view.editor.save());
    expect(view.replaceCreation.mock.calls[0]?.[1].blocks).toEqual([
      { id: undefined, type: 'PARAGRAPH', text: 'Текст' },
    ]);
    expect(view.editor.blocks[0]?.key).toBe(meaningful);
  });

  it('surfaces a storage error when the draft write fails', () => {
    vi.useFakeTimers();
    const view = mount('user-a');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError');
    });
    act(() => view.editor.addText('PARAGRAPH'));
    act(() => view.editor.editText(view.editor.blocks[0]!.key, 'Текст'));
    act(() => vi.advanceTimersByTime(500));
    expect(view.editor.storageError).toContain('устройстве');
  });

  it('drops a pending story write when the session lease retires mid-logout', () => {
    vi.useFakeTimers();
    const view = mount('user-a');
    const draftKey = activeStoryKey;
    act(() => view.editor.addText('PARAGRAPH'));
    act(() => view.editor.editText(view.editor.blocks[0]!.key, 'Текст'));
    // Logout clears the account drafts and retires the session lease while
    // the debounced write is pending.
    clearAccountFormDrafts('user-a');
    retireDraftWriteLease(view.queryClient);
    act(() => vi.advanceTimersByTime(500));
    expect(window.localStorage.getItem(draftKey)).toBeNull();
  });

  it('does not re-arm story writes until a new session lease is issued', () => {
    vi.useFakeTimers();
    const view = mount('user-a');
    const draftKey = activeStoryKey;
    clearAccountFormDrafts('user-a');
    retireDraftWriteLease(view.queryClient);
    act(() => view.editor.addText('PARAGRAPH'));
    act(() => vi.advanceTimersByTime(500));
    expect(window.localStorage.getItem(draftKey)).toBeNull();
    issueDraftWriteLease(view.queryClient);
    act(() => view.editor.editText(view.editor.blocks[0]!.key, 'Новый текст'));
    act(() => vi.advanceTimersByTime(500));
    expect(window.localStorage.getItem(draftKey)).not.toBeNull();
  });

  it('does not resurrect a cleared story draft after logout', () => {
    vi.useFakeTimers();
    const view = mount('user-a');
    const draftKey = activeStoryKey;
    act(() => view.editor.addText('PARAGRAPH'));
    act(() => view.editor.editText(view.editor.blocks[0]!.key, 'Текст'));
    // Logout clears the account drafts and retires the session lease while
    // the debounced write is pending.
    clearAccountFormDrafts('user-a');
    retireDraftWriteLease(view.queryClient);
    act(() => vi.advanceTimersByTime(500));
    expect(window.localStorage.getItem(draftKey)).toBeNull();
  });

  it('clears the local draft after the server holds the saved blocks', async () => {
    // A stale draft with the same content must not survive the save.
    window.localStorage.setItem(
      activeStoryKey,
      JSON.stringify({
        v: 2,
        revisionId,
        token: 0,
        blocks: [{ key: 'stale-key', type: 'PARAGRAPH', text: 'Текст' }],
      }),
    );
    const view = mount('user-a');
    // The restored legacy block is edited and saved: the local copy must not
    // survive once the server holds the blocks.
    act(() => view.editor.editText(view.editor.blocks[0]!.key, 'Текст'));
    await act(async () => {
      expect(await view.editor.save()).toBe(true);
    });
    // The mount migrates the legacy copy to the active key; the confirmed
    // save then clears it. No stale copy of this content may survive.
    expect(window.localStorage.getItem(activeStoryKey)).toBeNull();
    expect(window.localStorage.getItem(legacyStoryKey)).toBeNull();
  });

  it('keeps saved blocks when the story moves to a new revision', async () => {
    const view = mount('user-a');
    act(() => view.editor.addText('PARAGRAPH'));
    act(() => view.editor.editText(view.editor.blocks[0]!.key, 'Текст'));
    await act(async () => {
      expect(await view.editor.save()).toBe(true);
    });
    // The product detail refetch lands as a new editingRevision id while the
    // story prop still carries the pre-save snapshot.
    view.render(1, '92222222-2222-4222-8222-222222222222');
    const texts = view.editor.blocks.map((block) =>
      block.type === 'IMAGE' ? '' : block.text,
    );
    expect(texts).toEqual(['Текст']);
    expect(view.editor.dirty).toBe(false);
  });

  it('hydrates a new server revision instead of keeping the old revision text', () => {
    const storyR1 = {
      storyToken: 4,
      blocks: [
        {
          id: blockId,
          position: 0,
          type: 'PARAGRAPH' as const,
          text: 'Old',
        },
      ],
    };
    const view = mount('user-a', storyR1);
    const storyR2 = {
      storyToken: 0,
      blocks: [
        {
          id: '89999999-9999-4999-8999-999999999999',
          position: 0,
          type: 'PARAGRAPH' as const,
          text: 'New revision',
        },
      ],
    };
    // The product moved to a new editing revision (created outside this
    // editor). No own save is in flight, so the server baseline wins.
    view.render(1, '92222222-2222-4222-8222-222222222222', storyR2);
    const texts = view.editor.blocks.map((block) =>
      block.type === 'IMAGE' ? '' : block.text,
    );
    expect(texts).toEqual(['New revision']);
    expect(view.editor.dirty).toBe(false);
  });

  it('refuses edits and saves after an own save while the owner still serves the old snapshot', async () => {
    const view = mount('user-a');
    const next = '92222222-2222-4222-8222-222222222222';
    act(() => view.editor.addText('PARAGRAPH'));
    act(() => view.editor.editText(view.editor.blocks[0]!.key, 'Текст'));
    await act(async () => {
      expect(await view.editor.save()).toBe(true);
    });
    view.replaceCreation.mockClear();
    // The refetch names a new editing revision while the snapshot still
    // belongs to the previous one: the confirmed blocks stay visible, but
    // they are another revision's attribution until the owner catches up.
    view.render(1, next, { storyToken: 1, blocks: [] }, revisionId);
    act(() => view.editor.editText(view.editor.blocks[0]!.key, 'Изменено'));
    expect(
      view.editor.blocks.map((block) =>
        block.type === 'IMAGE' ? '' : block.text,
      ),
    ).toEqual(['Текст']);
    await act(async () => {
      expect(await view.editor.save()).toBe(false);
    });
    expect(view.replaceCreation).not.toHaveBeenCalled();
    // The matching snapshot at the same token unblocks editing.
    view.render(1, next, {
      storyToken: 1,
      blocks: [
        { id: blockId, position: 0, type: 'PARAGRAPH' as const, text: 'Текст' },
      ],
    });
    act(() => view.editor.addText('PARAGRAPH'));
    expect(view.editor.blocks).toHaveLength(2);
  });

  it('hydrates an external new revision even after an own save was confirmed', async () => {
    const view = mount('user-a');
    act(() => view.editor.addText('PARAGRAPH'));
    act(() => view.editor.editText(view.editor.blocks[0]!.key, 'Текст'));
    await act(async () => {
      expect(await view.editor.save()).toBe(true);
    });
    // The same-revision refetch carries the confirmed save (token 1).
    view.render(1, revisionId, {
      storyToken: 1,
      blocks: [
        { id: blockId, position: 0, type: 'PARAGRAPH' as const, text: 'Текст' },
      ],
    });
    // The product then moves to a new editing revision created outside this
    // editor. Revision identity decides the baseline — the saved token of the
    // old revision must not be compared against the new revision's token.
    view.render(1, '92222222-2222-4222-8222-222222222222', {
      storyToken: 0,
      blocks: [
        {
          id: '89999999-9999-4999-8999-999999999999',
          position: 0,
          type: 'PARAGRAPH' as const,
          text: 'External revision',
        },
      ],
    });
    const texts = view.editor.blocks.map((block) =>
      block.type === 'IMAGE' ? '' : block.text,
    );
    expect(texts).toEqual(['External revision']);
    expect(view.editor.dirty).toBe(false);
  });

  it('does not apply repeated snapshots from another revision', () => {
    const view = mount('user-a');
    const next = '92222222-2222-4222-8222-222222222222';
    // The refetch pipeline momentarily returns the previous revision's
    // snapshot; a later update of that same foreign snapshot must not hydrate.
    view.render(1, next, { storyToken: 0, blocks: [] }, revisionId);
    view.render(
      1,
      next,
      {
        storyToken: 1,
        blocks: [
          {
            id: blockId,
            position: 0,
            type: 'PARAGRAPH' as const,
            text: 'WRONG REVISION',
          },
        ],
      },
      revisionId,
    );
    expect(view.editor.blocks).toEqual([]);
    expect(view.editor.dirty).toBe(false);
  });

  it('does not present a foreign snapshot on a cold mount', () => {
    const view = mount(
      'user-a',
      {
        storyToken: 0,
        blocks: [
          {
            id: blockId,
            position: 0,
            type: 'PARAGRAPH' as const,
            text: 'FOREIGN',
          },
        ],
      },
      'another-revision',
    );
    expect(view.editor.blocks).toEqual([]);
    expect(view.editor.dirty).toBe(false);
  });

  it('ignores edits while waiting for the owner snapshot', () => {
    const view = mount('user-a');
    const next = '92222222-2222-4222-8222-222222222222';
    view.render(1, next, { storyToken: 0, blocks: [] }, revisionId);
    act(() => view.editor.addText('PARAGRAPH'));
    act(() => view.editor.editText('missing', 'ignored'));
    expect(view.editor.blocks).toEqual([]);
    expect(view.editor.dirty).toBe(false);
  });

  it('does not call the save or upload API while waiting for the owner snapshot', async () => {
    const view = mount('user-a');
    act(() => view.editor.addText('PARAGRAPH'));
    act(() => view.editor.editText(view.editor.blocks[0]!.key, 'Черновик'));
    // The revision moves; the owner still serves the previous revision's
    // snapshot. The dirty draft must not reach the API from waiting state.
    view.render(
      1,
      '92222222-2222-4222-8222-222222222222',
      { storyToken: 0, blocks: [] },
      revisionId,
    );
    await act(async () => {
      expect(await view.editor.save()).toBe(false);
    });
    expect(view.replaceCreation).not.toHaveBeenCalled();
    await act(async () => {
      expect(await view.editor.addImage(new Blob(['x']))).toBe(false);
    });
    expect(view.addStoryImage).not.toHaveBeenCalled();
  });

  it('unblocks editing when the matching snapshot arrives at the same token', () => {
    const view = mount('user-a');
    const next = '92222222-2222-4222-8222-222222222222';
    view.render(1, next, { storyToken: 0, blocks: [] }, revisionId);
    act(() => view.editor.addText('PARAGRAPH'));
    expect(view.editor.blocks).toEqual([]);
    view.render(1, next, {
      storyToken: 0,
      blocks: [
        {
          id: '89999999-9999-4999-8999-999999999999',
          position: 0,
          type: 'PARAGRAPH' as const,
          text: 'New revision',
        },
      ],
    });
    expect(
      view.editor.blocks.map((block) =>
        block.type === 'IMAGE' ? '' : block.text,
      ),
    ).toEqual(['New revision']);
    act(() => view.editor.addText('PARAGRAPH'));
    expect(view.editor.blocks).toHaveLength(2);
  });

  it('accepts input for a new work before its first server save', () => {
    // No server snapshot exists yet (creation flow): the absent baseline is
    // not a waiting state, input and local draft restore stay open.
    const view = mount('user-a', null);
    act(() => view.editor.addText('PARAGRAPH'));
    act(() => view.editor.editText(view.editor.blocks[0]!.key, 'Новая работа'));
    expect(
      view.editor.blocks.map((block) =>
        block.type === 'IMAGE' ? '' : block.text,
      ),
    ).toEqual(['Новая работа']);
    expect(view.editor.dirty).toBe(true);
  });

  it('keeps a recovered other-revision copy across editing and a confirmed save', async () => {
    vi.useFakeTimers();
    const legacyKey = activeStoryKey;
    window.localStorage.setItem(
      legacyKey,
      JSON.stringify({
        v: 2,
        revisionId: '92222222-2222-4222-8222-222222222222',
        token: 2,
        blocks: [
          { key: 'recovery-key', type: 'PARAGRAPH', text: 'RECOVERY TEXT' },
        ],
      }),
    );
    const view = mount('user-a');
    expect(view.editor.storageError).toContain('другой редакции');
    act(() => view.editor.addText('PARAGRAPH'));
    act(() => view.editor.editText(view.editor.blocks[0]!.key, 'Новый текст'));
    act(() => vi.advanceTimersByTime(500));
    const recoveryStillStored = () => {
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        const value = key && window.localStorage.getItem(key);
        if (value?.includes('RECOVERY TEXT')) return true;
      }
      return false;
    };
    // Typing persists the current revision's draft but must not destroy the
    // recovered copy of the other revision.
    expect(recoveryStillStored()).toBe(true);
    vi.useRealTimers();
    await act(async () => {
      expect(await view.editor.save()).toBe(true);
    });
    // A confirmed save clears only this revision's active draft.
    expect(recoveryStillStored()).toBe(true);
  });

  it('does not warn when the runtime has no Web Storage', () => {
    vi.useFakeTimers();
    vi.stubGlobal('localStorage', undefined);
    try {
      const view = mount('user-a');
      act(() => view.editor.addText('PARAGRAPH'));
      act(() => view.editor.editText(view.editor.blocks[0]!.key, 'Текст'));
      act(() => vi.advanceTimersByTime(500));
      // Without Web Storage there are no browser drafts to promise; only a
      // failing storage API deserves the warning.
      expect(view.editor.storageError).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('does not apply a stored draft that belongs to a different revision', () => {
    const storyR2 = {
      storyToken: 0,
      blocks: [
        {
          id: '89999999-9999-4999-8999-999999999999',
          position: 0,
          type: 'PARAGRAPH' as const,
          text: 'New revision',
        },
      ],
    };
    const stored = JSON.stringify({
      v: 2,
      revisionId: '92222222-2222-4222-8222-222222222222',
      token: 4,
      blocks: [{ key: 'old-key', type: 'PARAGRAPH', text: 'Old local draft' }],
    });
    window.localStorage.setItem(activeStoryKey, stored);
    const view = mount('user-a', storyR2);
    const texts = view.editor.blocks.map((block) =>
      block.type === 'IMAGE' ? '' : block.text,
    );
    expect(texts).toEqual(['New revision']);
    expect(view.editor.dirty).toBe(false);
    // The incompatible record is not applied; it moves to the recovery
    // namespace (copy → confirm → delete source), so later writes cannot
    // destroy the only copy…
    expect(window.localStorage.getItem(legacyStoryKey)).toBeNull();
    expect(window.localStorage.getItem(recoveryStoryKey)).toContain(
      'Old local draft',
    );
    // …the author sees why the local copy was not applied and can copy the
    // preserved text out without DevTools.
    expect(view.editor.storageError).toContain('другой редакции');
    expect(view.editor.recoveryText).toContain('Old local draft');
  });



  it('offers the recovery source even when its migration cannot write', () => {
    window.localStorage.setItem(
      activeStoryKey,
      JSON.stringify({
        v: 2,
        revisionId: 'old',
        token: 0,
        blocks: [{ key: 'local', type: 'PARAGRAPH', text: 'RECOVERY TEXT' }],
      }),
    );
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    const view = mount('user-a');
    // The source copy survives the failed write; the notice offers its text.
    expect(window.localStorage.getItem(activeStoryKey)).toContain(
      'RECOVERY TEXT',
    );
    expect(view.editor.recoveryText).toBe('RECOVERY TEXT');
    expect(view.editor.storageError).toBeTruthy();
  });


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

  it('restores unfinished text blocks on a plain mount', () => {
    const draftKey = activeStoryKey;
    window.localStorage.setItem(
      draftKey,
      JSON.stringify({
        v: 2,
        revisionId,
        token: 0,
        blocks: [
          { key: 'local-1', type: 'PARAGRAPH', text: 'Незавершённый абзац' },
        ],
      }),
    );
    const view = mount('user-a');
    expect(
      view.editor.blocks.map((block) =>
        block.type === 'IMAGE' ? '' : block.text,
      ),
    ).toEqual(['Незавершённый абзац']);
    expect(view.editor.dirty).toBe(true);
  });

  it('hydrates the saved story when the server read lands after mount', () => {
    const view = mount('user-a', null);
    expect(view.editor.blocks).toEqual([]);
    view.render(1, '92222222-2222-4222-8222-222222222222', {
      storyToken: 3,
      blocks: [
        {
          id: blockId,
          position: 0,
          type: 'PARAGRAPH',
          text: 'Сохранённая история',
        },
      ],
    });
    expect(
      view.editor.blocks.map((block) =>
        block.type === 'IMAGE' ? '' : block.text,
      ),
    ).toEqual(['Сохранённая история']);
    expect(view.editor.dirty).toBe(false);
  });

  it('restores an edited persisted block in place instead of duplicating it', () => {
    const serverStory = {
      storyToken: 1,
      blocks: [
        {
          id: blockId,
          position: 0,
          type: 'PARAGRAPH' as const,
          text: 'Original',
        },
      ],
    };
    const draftKey = activeStoryKey;
    window.localStorage.setItem(
      draftKey,
      JSON.stringify({
        v: 2,
        revisionId,
        token: 1,
        blocks: [{ key: blockId, type: 'PARAGRAPH', text: 'Edited' }],
      }),
    );
    const view = mount('user-a', serverStory);
    view.render(2, revisionId);
    expect(view.editor.blocks).toHaveLength(1);
    expect(view.editor.blocks[0]).toMatchObject({
      id: blockId,
      text: 'Edited',
    });
    expect(view.editor.dirty).toBe(true);
  });

  it('restores text deletions and reordering by block identity', () => {
    const secondBlockId = '85555555-5555-4555-8555-555555555555';
    const serverStory = {
      storyToken: 1,
      blocks: [
        {
          id: blockId,
          position: 0,
          type: 'PARAGRAPH' as const,
          text: 'Первый',
        },
        {
          id: secondBlockId,
          position: 1,
          type: 'PARAGRAPH' as const,
          text: 'Второй',
        },
      ],
    };
    const draftKey = activeStoryKey;
    window.localStorage.setItem(
      draftKey,
      JSON.stringify({
        v: 2,
        revisionId,
        token: 1,
        // Второй переставлен наверх; третий (локальный) удалён; первый переименован.
        blocks: [
          { key: secondBlockId, type: 'PARAGRAPH', text: 'Второй' },
          { key: blockId, type: 'PARAGRAPH', text: 'Первый изменённый' },
        ],
      }),
    );
    const view = mount('user-a', serverStory);
    view.render(2, revisionId);
    expect(
      view.editor.blocks.map((block) =>
        block.type === 'IMAGE' ? '' : block.text,
      ),
    ).toEqual(['Второй', 'Первый изменённый']);
    expect(view.editor.dirty).toBe(true);
  });

  it('keeps identical paragraphs in distinct blocks', () => {
    const secondBlockId = '85555555-5555-4555-8555-555555555555';
    const serverStory = {
      storyToken: 1,
      blocks: [
        {
          id: blockId,
          position: 0,
          type: 'PARAGRAPH' as const,
          text: 'Одинаковый',
        },
        {
          id: secondBlockId,
          position: 1,
          type: 'PARAGRAPH' as const,
          text: 'Одинаковый',
        },
      ],
    };
    const draftKey = activeStoryKey;
    window.localStorage.setItem(
      draftKey,
      JSON.stringify({
        v: 2,
        revisionId,
        token: 1,
        blocks: [
          { key: blockId, type: 'PARAGRAPH', text: 'Одинаковый' },
          { key: secondBlockId, type: 'PARAGRAPH', text: 'Одинаковый' },
          { key: 'local-1', type: 'PARAGRAPH', text: 'Одинаковый' },
        ],
      }),
    );
    const view = mount('user-a', serverStory);
    view.render(2, revisionId);
    expect(view.editor.blocks).toHaveLength(3);
    expect(
      view.editor.blocks.map((block) =>
        block.type === 'IMAGE' ? '' : block.text,
      ),
    ).toEqual(['Одинаковый', 'Одинаковый', 'Одинаковый']);
  });

  it('restores the deletion of every text block', () => {
    const serverStory = {
      storyToken: 1,
      blocks: [
        {
          id: blockId,
          position: 0,
          type: 'PARAGRAPH' as const,
          text: 'Единственный',
        },
      ],
    };
    const draftKey = activeStoryKey;
    window.localStorage.setItem(
      draftKey,
      JSON.stringify({ v: 2, revisionId, token: 1, blocks: [] }),
    );
    const view = mount('user-a', serverStory);
    view.render(2, revisionId);
    expect(view.editor.blocks).toEqual([]);
    expect(view.editor.dirty).toBe(true);
  });

  it('restores text edits next to a server image block', () => {
    const imageBlockId = '86666666-6666-4666-8666-666666666666';
    const serverStory = {
      storyToken: 1,
      blocks: [
        { id: blockId, position: 0, type: 'PARAGRAPH' as const, text: 'До' },
        {
          id: imageBlockId,
          position: 1,
          type: 'IMAGE' as const,
          mediaAssetId: assetId,
          altText: null,
        },
        {
          id: '87777777-7777-4777-8777-777777777777',
          position: 2,
          type: 'PARAGRAPH' as const,
          text: 'После',
        },
      ],
    };
    const draftKey = activeStoryKey;
    window.localStorage.setItem(
      draftKey,
      JSON.stringify({
        v: 2,
        revisionId,
        token: 1,
        blocks: [
          { key: blockId, type: 'PARAGRAPH', text: 'До изменено' },
          {
            key: imageBlockId,
            type: 'IMAGE',
            mediaAssetId: assetId,
            altText: 'Подпись',
          },
        ],
      }),
    );
    const view = mount('user-a', serverStory);
    view.render(2, revisionId);
    expect(view.editor.blocks).toMatchObject([
      { id: blockId, type: 'PARAGRAPH', text: 'До изменено' },
      {
        id: imageBlockId,
        type: 'IMAGE',
        mediaAssetId: assetId,
        altText: 'Подпись',
      },
    ]);
    expect(view.editor.blocks).toHaveLength(2);
    expect(view.editor.dirty).toBe(true);
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
    act(() =>
      view.editor.editText(view.editor.blocks[0]!.key, 'Сохранить локально'),
    );
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
      blocks: request.blocks.map(
        (block: Record<string, unknown>, index: number) => ({
          ...block,
          id: index === 0 ? blockId : secondId,
          position: index,
        }),
      ),
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

  it('restores a referenced media asset without duplicating its upload', async () => {
    window.localStorage.setItem(
      activeStoryKey,
      JSON.stringify({
        v: 2,
        revisionId,
        token: 0,
        blocks: [
          {
            key: 'existing-media',
            type: 'IMAGE',
            mediaAssetId: assetId,
            altText: null,
          },
        ],
      }),
    );
    const view = mount('user-a');
    view.replaceCreation.mockResolvedValueOnce({
      storyToken: 1,
      blocks: [
        {
          id: blockId,
          position: 0,
          type: 'IMAGE',
          mediaAssetId: assetId,
          altText: null,
        },
      ],
    });
    await act(async () => {
      expect(await view.editor.save()).toBe(true);
    });
    expect(view.addStoryImage).not.toHaveBeenCalled();
    expect(view.replaceCreation.mock.calls[0]?.[1].blocks).toEqual([
      { type: 'IMAGE', mediaAssetId: assetId, altText: null },
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
    expect(view.addStoryImage.mock.calls[0]?.[2]).toBe(
      view.addStoryImage.mock.calls[1]?.[2],
    );
    expect(view.editor.blocks).toMatchObject([
      { type: 'IMAGE', mediaAssetId: assetId },
    ]);
  });

  it('does not add a completed upload from a previous authentication epoch', async () => {
    const view = mount();
    let deliver!: (response: { mediaAssetId: string }) => void;
    view.addStoryImage.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          deliver = resolve;
        }),
    );
    let uploaded!: Promise<boolean>;
    act(() => {
      uploaded = view.editor.addImage(
        new Blob(['image'], { type: 'image/png' }),
      );
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
