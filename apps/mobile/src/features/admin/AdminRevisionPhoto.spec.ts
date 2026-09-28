/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const harness = vi.hoisted(() => {
  const getSellerRevisionPhoto = vi.fn();
  const getProductImage = vi.fn();
  return {
    getSellerRevisionPhoto,
    getProductImage,
    api: { admin: { getSellerRevisionPhoto, getProductImage } },
  };
});

vi.mock('expo-image', () => ({
  Image: ({
    source,
    onError,
    accessibilityLabel,
  }: {
    source?: { uri?: string };
    onError?: () => void;
    accessibilityLabel?: string;
  }) =>
    createElement(
      'span',
      null,
      createElement('img', {
        alt: accessibilityLabel,
        src: source?.uri,
      }),
      createElement(
        'button',
        { type: 'button', onClick: () => onError?.() },
        'decode-error',
      ),
    ),
}));

vi.mock('../../components/ui', () => ({
  AppText: ({ children }: { children?: ReactNode }) =>
    createElement('span', null, children),
}));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => harness.api,
}));

import { AdminReviewImage, AdminRevisionPhoto } from './AdminRevisionPhoto';

const profileId = '00000000-0000-4000-8000-000000000001';
const revisionId = '00000000-0000-4000-8000-000000000005';
const imageId = '00000000-0000-4000-8000-000000000008';
const seenAt = '2026-09-26T12:00:00.000Z';
const freshAt = '2026-09-26T13:00:00.000Z';
const seenChecksum = 'a'.repeat(64);
const freshChecksum = 'b'.repeat(64);

const created: string[] = [];
const revoked: string[] = [];

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function photo(updatedAt: string, checksum: string) {
  return {
    profileId,
    revisionId,
    updatedAt,
    checksum,
    label: 'Фото ревизии: Pending author',
  };
}

function mount(node: ReactNode) {
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  const render = (next: ReactNode) => {
    act(() => {
      root.render(next);
    });
  };
  render(node);
  return {
    container,
    render,
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function shownSrc(container: ParentNode) {
  return container.querySelector('img')?.getAttribute('src') ?? null;
}

beforeEach(() => {
  created.length = 0;
  revoked.length = 0;
  let next = 0;
  URL.createObjectURL = vi.fn(() => {
    const url = `blob:photo-${next}`;
    next += 1;
    created.push(url);
    return url;
  });
  URL.revokeObjectURL = vi.fn((url: string) => {
    revoked.push(url);
  });
});

afterEach(() => {
  document.body.replaceChildren();
  harness.getSellerRevisionPhoto.mockReset();
  harness.getProductImage.mockReset();
});

describe('AdminRevisionPhoto', () => {
  it('reloads when the review target identity changes and ignores a late previous response', async () => {
    const first = deferred<Blob>();
    const second = deferred<Blob>();
    harness.getSellerRevisionPhoto
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const view = mount(createElement(AdminRevisionPhoto, photo(seenAt, seenChecksum)));
    await flush();
    expect(harness.getSellerRevisionPhoto).toHaveBeenCalledTimes(1);
    expect(harness.getSellerRevisionPhoto).toHaveBeenCalledWith(profileId, revisionId);

    first.resolve(new Blob(['published-bytes']));
    await flush();
    expect(shownSrc(view.container)).toBe('blob:photo-0');

    view.render(createElement(AdminRevisionPhoto, photo(freshAt, freshChecksum)));
    await flush();
    expect(harness.getSellerRevisionPhoto).toHaveBeenCalledTimes(2);
    expect(shownSrc(view.container)).toBeNull();
    expect(view.container.textContent).toContain('Загрузка фото ревизии');
    expect(revoked).toContain('blob:photo-0');

    second.resolve(new Blob(['pending-bytes']));
    await flush();
    expect(shownSrc(view.container)).toBe('blob:photo-1');

    first.resolve(new Blob(['late-bytes']));
    await flush();
    expect(shownSrc(view.container)).toBe('blob:photo-1');
    expect(created).toEqual(['blob:photo-0', 'blob:photo-1']);

    view.unmount();
    expect(revoked).toContain('blob:photo-1');
  });

  it('does not let an older response replace a newer photo that already loaded', async () => {
    const first = deferred<Blob>();
    const second = deferred<Blob>();
    harness.getSellerRevisionPhoto
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const view = mount(createElement(AdminRevisionPhoto, photo(seenAt, seenChecksum)));
    await flush();
    view.render(createElement(AdminRevisionPhoto, photo(freshAt, freshChecksum)));
    await flush();
    expect(harness.getSellerRevisionPhoto).toHaveBeenCalledTimes(2);
    second.resolve(new Blob(['pending-bytes']));
    await flush();
    first.resolve(new Blob(['published-bytes']));
    await flush();
    expect(shownSrc(view.container)).toBe('blob:photo-0');
    expect(created).toEqual(['blob:photo-0']);
    view.unmount();
  });

  it('shows a visible state when the photo request fails', async () => {
    harness.getSellerRevisionPhoto.mockRejectedValue(new Error('missing'));
    const view = mount(createElement(AdminRevisionPhoto, photo(seenAt, seenChecksum)));
    await flush();
    expect(view.container.textContent).toContain('Фото ревизии недоступно');
    expect(view.container.querySelector('img')).toBeNull();
    view.unmount();
  });

  it('shows a visible state when the downloaded photo cannot be decoded', async () => {
    harness.getSellerRevisionPhoto.mockResolvedValue(new Blob(['not-an-image']));
    const view = mount(createElement(AdminRevisionPhoto, photo(seenAt, seenChecksum)));
    await flush();
    const button = [...view.container.querySelectorAll('button')].find(
      (item) => item.textContent === 'decode-error',
    );
    if (!button) throw new Error('Image did not render');
    act(() => {
      button.click();
    });
    expect(view.container.textContent).toContain('Фото ревизии недоступно');
    expect(view.container.querySelector('img')).toBeNull();
    view.unmount();
    expect(revoked).toContain('blob:photo-0');
  });
});

describe('AdminReviewImage', () => {
  it('reloads a product image when its checksum changes and drops the previous object URL', async () => {
    const first = deferred<Blob>();
    const second = deferred<Blob>();
    harness.getProductImage
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const view = mount(
      createElement(AdminReviewImage, {
        imageId,
        checksum: seenChecksum,
        label: 'Предмет: Pending work',
        fallbackLabel: 'Изображение недоступно: Pending work',
      }),
    );
    await flush();
    first.resolve(new Blob(['first']));
    await flush();
    expect(shownSrc(view.container)).toBe('blob:photo-0');
    view.render(
      createElement(AdminReviewImage, {
        imageId,
        checksum: freshChecksum,
        label: 'Предмет: Pending work',
        fallbackLabel: 'Изображение недоступно: Pending work',
      }),
    );
    await flush();
    expect(harness.getProductImage).toHaveBeenCalledTimes(2);
    expect(shownSrc(view.container)).toBeNull();
    expect(revoked).toContain('blob:photo-0');
    second.resolve(new Blob(['second']));
    await flush();
    expect(shownSrc(view.container)).toBe('blob:photo-1');
    view.unmount();
  });
});

