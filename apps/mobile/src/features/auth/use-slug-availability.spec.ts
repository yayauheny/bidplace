/**
 * @vitest-environment jsdom
 */
import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  type SlugAvailabilityResult,
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

function Probe({
  initialSlug = 'author',
  onCheckResult,
}: {
  initialSlug?: string;
  onCheckResult?: (result: SlugAvailabilityResult | null) => void;
}) {
  const [slug, setSlug] = useState(initialSlug);
  const availability = useSlugAvailability();
  const result = visibleSlugAvailability(slug, availability.result);
  return createElement(
    'div',
    null,
    createElement('button', {
      type: 'button',
      onClick: () =>
        void availability.check(slug).then((next) => onCheckResult?.(next)),
    }, 'check'),
    createElement('button', {
      type: 'button',
      onClick: () => {
        availability.invalidate();
        setSlug('other');
      },
    }, 'edit'),
    createElement('span', null, result?.status ?? 'none'),
  );
}

describe('visibleSlugAvailability', () => {
  it('shows a result only for the checked value', () => {
    expect(
      visibleSlugAvailability('author', { slug: 'author', status: 'available' }),
    ).toEqual({ slug: 'author', status: 'available' });
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

  it('does not request on mount or edit and ignores the late checked value', async () => {
    let resolveFirst: (value: { available: boolean }) => void = () => undefined;
    harness.slugAvailability.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => {
      root?.render(createElement(Probe));
    });
    expect(harness.slugAvailability).not.toHaveBeenCalled();
    await act(async () => {
      container.querySelectorAll('button')[0]?.click();
    });
    expect(container.querySelector('span')?.textContent).toBe('checking');
    expect(harness.slugAvailability).toHaveBeenCalledTimes(1);
    act(() => {
      container.querySelectorAll('button')[1]?.click();
    });
    expect(harness.slugAvailability).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveFirst({ available: true });
      await Promise.resolve();
    });
    expect(container.querySelector('span')?.textContent).toBe('none');
    expect(harness.slugAvailability).toHaveBeenNthCalledWith(1, 'author');
  });

  it('reports a retryable error without an availability claim', async () => {
    harness.slugAvailability.mockRejectedValueOnce(new Error('offline'));
    const container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => root?.render(createElement(Probe)));
    await act(async () => {
      container.querySelectorAll('button')[0]?.click();
      await Promise.resolve();
    });
    expect(container.querySelector('span')?.textContent).toBe('error');
  });

  it('blocks duplicate checks synchronously', async () => {
    let resolve: (value: { available: boolean }) => void = () => undefined;
    harness.slugAvailability.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => root?.render(createElement(Probe)));
    act(() => {
      container.querySelectorAll('button')[0]?.click();
      container.querySelectorAll('button')[0]?.click();
    });
    expect(harness.slugAvailability).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolve({ available: true });
      await Promise.resolve();
    });
    expect(container.querySelector('span')?.textContent).toBe('available');
  });

  it('does not let an older completion release or replace a newer check', async () => {
    let resolveFirst: (value: { available: boolean }) => void = () => undefined;
    let resolveSecond: (value: { available: boolean }) => void = () => undefined;
    harness.slugAvailability
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          }),
      );
    const container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => root?.render(createElement(Probe)));
    act(() => {
      container.querySelectorAll('button')[0]?.click();
    });
    act(() => {
      container.querySelectorAll('button')[1]?.click();
    });
    act(() => {
      container.querySelectorAll('button')[0]?.click();
    });
    expect(harness.slugAvailability).toHaveBeenCalledTimes(2);
    expect(container.querySelector('span')?.textContent).toBe('checking');

    await act(async () => {
      resolveFirst({ available: true });
      await Promise.resolve();
    });
    expect(container.querySelector('span')?.textContent).toBe('checking');

    await act(async () => {
      resolveSecond({ available: false });
      await Promise.resolve();
    });
    expect(container.querySelector('span')?.textContent).toBe('taken');
    expect(harness.slugAvailability).toHaveBeenNthCalledWith(2, 'other');
  });

  it('returns no result when the checked component unmounts', async () => {
    let resolve: (value: { available: boolean }) => void = () => undefined;
    const result = vi.fn();
    harness.slugAvailability.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() =>
      root?.render(createElement(Probe, { onCheckResult: result })),
    );
    act(() => {
      container.querySelectorAll('button')[0]?.click();
      root?.unmount();
    });
    root = null;
    await act(async () => {
      resolve({ available: true });
      await Promise.resolve();
    });
    expect(result).toHaveBeenCalledWith(null);
  });

  it.each(['ab', 'a'.repeat(21)])('does not request availability for invalid length %s', (slug) => {
    const container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => root?.render(createElement(Probe, { initialSlug: slug })));
    act(() => {
      container.querySelectorAll('button')[0]?.click();
    });
    expect(harness.slugAvailability).not.toHaveBeenCalled();
    expect(container.querySelector('span')?.textContent).toBe('none');
  });
});
