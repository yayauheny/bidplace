/**
 * @vitest-environment jsdom
 */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';

import type { ProductDraftSaveSession } from './product-draft-save';
import { useProductDraftBrowserHistoryGuard } from './product-draft-browser-guard';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const cases: Array<() => void> = [];

function mount(flags: {
  isDirty: boolean;
  uploadPending?: boolean;
  storyDirty: boolean;
  storyPending: boolean;
}) {
  const session = {
    snapshotOperation: () => 0,
    isCurrentOperation: () => true,
    persistForTransitionRef: { current: async () => true },
    endLockedTransition: () => undefined,
    transitionLock: { current: false },
  } as unknown as ProductDraftSaveSession;
  let current = flags;
  const root = createRoot(document.createElement('div'));
  function Harness() {
    useProductDraftBrowserHistoryGuard({
      isDirty: current.isDirty,
      uploadPending: current.uploadPending,
      storyDirty: current.storyDirty,
      storyPending: current.storyPending,
      productId: 'work-1',
      session,
    });
    return null;
  }
  act(() => root.render(createElement(Harness)));
  cases.push(() => act(() => root.unmount()));
  return {
    rerender(next: typeof flags) {
      current = next;
      act(() => root.render(createElement(Harness)));
    },
  };
}

function guardArmed() {
  return Boolean(
    (window.history.state as Record<string, unknown> | null)
      ?.__bidplaceProductDraftGuard,
  );
}

afterEach(() => {
  cases.splice(0).forEach((cleanup) => cleanup());
  window.history.replaceState({}, '', '/');
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it('keeps a single sentinel through the story dirty → pending → clean chain', () => {
  vi.useFakeTimers();
  const view = mount({ isDirty: false, storyDirty: true, storyPending: false });
  expect(guardArmed()).toBe(true);
  const armedLength = window.history.length;
  // Saving the story toggles dirty → pending → clean without an all-clean
  // moment: the same sentinel must survive instead of stacking entries.
  view.rerender({ isDirty: false, storyDirty: true, storyPending: true });
  view.rerender({ isDirty: false, storyDirty: false, storyPending: true });
  expect(window.history.length).toBe(armedLength);
  expect(guardArmed()).toBe(true);
  view.rerender({ isDirty: false, storyDirty: false, storyPending: false });
  // Retirement rewrites the entry; jsdom cannot traverse, so back() is stubbed.
  vi.spyOn(window.history, 'back').mockImplementation(() => {
    window.history.replaceState({}, '', '/');
  });
  act(() => {
    vi.advanceTimersByTime(10);
  });
  expect(guardArmed()).toBe(false);
});

it('arms one sentinel per dirty episode and retires it when clean', () => {
  vi.useFakeTimers();
  const view = mount({ isDirty: true, storyDirty: false, storyPending: false });
  expect(guardArmed()).toBe(true);
  const armedLength = window.history.length;
  // Ordinary save: dirty → clean; a new edit arms a fresh episode.
  view.rerender({ isDirty: false, storyDirty: false, storyPending: false });
  view.rerender({ isDirty: true, storyDirty: false, storyPending: false });
  expect(window.history.length).toBe(armedLength + 1);
  expect(guardArmed()).toBe(true);
});

it('keeps browser Back on the screen during an upload and warns before unloading', () => {
  const go = vi.spyOn(window.history, 'go').mockImplementation(() => undefined);
  const view = mount({ isDirty: false, storyDirty: false, storyPending: false, uploadPending: true });
  const sentinel = window.history.state;
  expect(guardArmed()).toBe(true);
  const unload = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(unload);
  expect(unload.defaultPrevented).toBe(true);
  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    window.dispatchEvent(new PopStateEvent('popstate', { state: sentinel }));
  });
  expect(go.mock.calls).toEqual([[1]]);
  view.rerender({ isDirty: false, storyDirty: false, storyPending: false, uploadPending: false });
});
