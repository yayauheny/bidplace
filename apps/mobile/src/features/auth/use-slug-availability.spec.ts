/**
 * @vitest-environment jsdom
 */
import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useSlugAvailability,
  visibleSlugAvailability,
} from './use-slug-availability';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const harness = vi.hoisted(() => ({
  slugAvailability: vi.fn<(slug: string) => Promise<{ available: boolean }>>(),
}));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({
    auth: { slugAvailability: harness.slugAvailability },
  }),
}));

function Probe({ slug }: { slug: string }) {
  const status = useSlugAvailability(slug);
  return createElement('span', null, status ?? 'none');
}

function Editor() {
  const [slug, setSlug] = useState('author');
  return createElement(
    'div',
    null,
    createElement('button', { type: 'button', onClick: () => setSlug('other') }, 'edit'),
    createElement(Probe, { slug }),
  );
}

describe('visibleSlugAvailability', () => {
  it('shows a result only for the checked value', () => {
    expect(visibleSlugAvailability('author', { slug: 'author', status: 'available' })).toBe(
      'available',
    );
    expect(visibleSlugAvailability('other', { slug: 'author', status: 'available' })).toBeNull();
    expect(visibleSlugAvailability('Author', { slug: 'author', status: 'taken' })).toBeNull();
    expect(visibleSlugAvailability('ab', { slug: 'ab', status: 'available' })).toBeNull();
  });
});

describe('useSlugAvailability', () => {
  let root: Root | null = null;

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    root = null;
    document.body.replaceChildren();
    harness.slugAvailability.mockReset();
  });

  it('ignores a late response and does not claim availability after an error', async () => {
    let resolveFirst: (value: { available: boolean }) => void = () => undefined;
    harness.slugAvailability.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
    );
    harness.slugAvailability.mockRejectedValueOnce(new Error('offline'));
    const container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => {
      root?.render(createElement(Editor));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 450));
    });
    await act(async () => {
      container.querySelector('button')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.querySelector('span')?.textContent).toBe('none');
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 450));
    });
    expect(container.querySelector('span')?.textContent).toBe('none');
    await act(async () => {
      resolveFirst({ available: true });
      await Promise.resolve();
    });
    expect(container.querySelector('span')?.textContent).toBe('none');
    expect(harness.slugAvailability).toHaveBeenNthCalledWith(1, 'author');
    expect(harness.slugAvailability).toHaveBeenNthCalledWith(2, 'other');
  });

  it.each(['ab', 'a'.repeat(21)])('does not request availability for invalid length %s', async (slug) => {
    vi.useFakeTimers();
    try {
      const container = document.createElement('div');
      document.body.append(container);
      root = createRoot(container);
      act(() => root?.render(createElement(Probe, { slug })));
      await act(async () => { await vi.advanceTimersByTimeAsync(500); });
      expect(harness.slugAvailability).not.toHaveBeenCalled();
      expect(container.textContent).toBe('none');
    } finally {
      vi.useRealTimers();
    }
  });
});
