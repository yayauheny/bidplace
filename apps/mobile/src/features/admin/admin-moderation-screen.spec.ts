/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ADMIN_MODERATION_MAX_SEARCH,
  adminModerationListQuerySchema,
} from '@bidplace/contracts';
import { ApiClientError } from '@bidplace/api-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const harness = vi.hoisted(() => ({
  listSellerProfiles: vi.fn(),
  listProducts: vi.fn(),
  updateSellerStatus: vi.fn(),
  updateProductStatus: vi.fn(),
  push: vi.fn(),
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  View: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
  Image: () => null,
  ScrollView: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: harness.push, replace: vi.fn() }),
  Link: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
}));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({
    admin: {
      listSellerProfiles: harness.listSellerProfiles,
      listProducts: harness.listProducts,
      updateSellerStatus: harness.updateSellerStatus,
      updateProductStatus: harness.updateProductStatus,
      getSellerRevisionPhoto: vi.fn(),
    },
  }),
}));

vi.mock('../../components/layout', () => ({
  AppShell: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
  FormPageShell: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
}));

vi.mock('../../components/shared/InfrastructurePageStatus', () => ({
  InfrastructurePageStatus: ({ status }: { status: string }) =>
    createElement('div', null, status),
}));

vi.mock('../auth/AccountLogoutButton', () => ({
  AccountLogoutButton: () => null,
}));

vi.mock('./AdminUsersPanel', () => ({
  AdminUsersPanel: () => null,
}));

vi.mock('./AdminRevisionPhoto', () => ({
  AdminRevisionPhoto: ({
    profileId,
    revisionId,
    updatedAt,
    checksum,
  }: {
    profileId?: string;
    revisionId?: string;
    updatedAt?: string;
    checksum?: string;
  }) =>
    createElement(
      'div',
      null,
      `photo:${profileId ?? ''}:${revisionId ?? ''}:${updatedAt ?? ''}:${checksum ?? ''}`,
    ),
  AdminReviewImage: () => null,
}));

vi.mock('../../components/ui', () => {
  function PressButton({
    label,
    onPress,
    disabled,
  }: {
    label: string;
    onPress?: () => void;
    disabled?: boolean;
  }) {
    return createElement(
      'button',
      {
        type: 'button',
        disabled: Boolean(disabled),
        onClick: () => {
          if (!disabled) onPress?.();
        },
      },
      label,
    );
  }

  return {
    AppDialog: ({
      open,
      title,
      children,
    }: {
      open: boolean;
      title?: string;
      children?: ReactNode;
    }) =>
      open ? createElement('div', { role: 'dialog' }, title, children) : null,
    AppText: ({ children }: { children?: ReactNode }) =>
      createElement('span', null, children),
    DestructiveButton: PressButton,
    FormSection: ({
      title,
      children,
    }: {
      title?: string;
      children?: ReactNode;
    }) => createElement('section', null, title, children),
    PageHeader: ({ title }: { title: string }) =>
      createElement('h1', null, title),
    PrimaryButton: PressButton,
    ResilientRemoteImage: ({
      uri,
      accessibilityLabel,
    }: {
      uri?: string;
      accessibilityLabel?: string;
    }) =>
      createElement('img', {
        alt: accessibilityLabel ?? '',
        src: uri ?? '',
      }),
    SecondaryButton: PressButton,
    TextButton: PressButton,
    TextField: ({
      label,
      value,
      onChangeText,
    }: {
      label: string;
      value?: string;
      onChangeText?: (value: string) => void;
    }) =>
      createElement('input', {
        'aria-label': label,
        value: value ?? '',
        onChange: (event: { target: { value: string } }) =>
          onChangeText?.(event.target.value),
      }),
  };
});

import { getApiAssetUrl } from '../../lib/environment';
import { formatAchievementDate } from '../sellers/achievement-date';
import { AdminModerationScreen } from './admin-moderation-screen';
import { advanceAuthEpoch } from '../../lib/query-cache';
import { moderationListQueryKey } from './admin-moderation-state';

const sellerId = '00000000-0000-4000-8000-000000000001';
const legacyId = '00000000-0000-4000-8000-000000000002';
const quietId = '00000000-0000-4000-8000-000000000003';
const userId = '00000000-0000-4000-8000-000000000004';
const revisionId = '00000000-0000-4000-8000-000000000005';
const productId = '00000000-0000-4000-8000-000000000006';
const productRevisionId = '00000000-0000-4000-8000-000000000007';
const seenAt = '2026-09-26T12:00:00.000Z';
const freshAt = '2026-09-26T13:00:00.000Z';

function sellerContent(fullName: string, city: string | null = 'Minsk') {
  return {
    slug: 'author',
    fullName,
    discipline: 'Керамика',
    country: 'BY',
    city,
    practice: null,
    biography: null,
    socialLink: null,
    telegramUrl: null,
    instagramUrl: null,
    websiteUrl: null,
    publicEmail: null,
    shortDescription: 'About',
  };
}

function revisionSeller(updatedAt: string) {
  return {
    id: sellerId,
    userId,
    parentStatus: 'APPROVED',
    parentUpdatedAt: seenAt,
    sellerType: 'creator',
    applicationStage: null,
    createdAt: seenAt,
    parent: sellerContent('Published author'),
    reviewTarget: {
      id: revisionId,
      version: 2,
      status: 'PENDING_REVIEW',
      updatedAt,
      submittedAt: seenAt,
      content: {
        ...sellerContent('Pending author'),
        profilePhoto: null,
        achievements: [],
      },
    },
    lastModerationReason: null,
    hasBlockingListing: false,
  };
}

function legacySeller() {
  return {
    id: legacyId,
    userId,
    parentStatus: 'PENDING_REVIEW',
    parentUpdatedAt: seenAt,
    sellerType: 'creator',
    applicationStage: null,
    createdAt: seenAt,
    parent: sellerContent('Legacy author'),
    reviewTarget: null,
    lastModerationReason: null,
    hasBlockingListing: false,
  };
}

function quietSeller() {
  return {
    ...legacySeller(),
    id: quietId,
    parentStatus: 'APPROVED',
    parent: sellerContent('Quiet author'),
  };
}

function pendingProduct() {
  return {
    id: productId,
    publicId: 'abcdefghijk',
    sellerProfileId: sellerId,
    parentStatus: 'APPROVED',
    parentUpdatedAt: seenAt,
    publishedAt: seenAt,
    sellerProfile: {
      slug: 'author',
      fullName: 'Published author',
      status: 'APPROVED',
    },
    parent: {
      categoryId: null,
      title: 'Published work',
      story: 'Published story',
      technique: null,
      materials: null,
      dimensions: null,
      weight: null,
      year: null,
      condition: null,
      uniqueness: null,
      provenance: null,
      city: 'Minsk',
      packaging: null,
      deliveryInfo: null,
      creationIntro: null,
      images: [],
    },
    creationSteps: [],
    reviewTarget: {
      id: productRevisionId,
      version: 2,
      status: 'PENDING_REVIEW',
      updatedAt: seenAt,
      submittedAt: seenAt,
      content: {
        categoryId: null,
        title: 'Pending work',
        story: null,
        technique: null,
        materials: null,
        dimensions: null,
        weight: null,
        year: null,
        condition: null,
        uniqueness: null,
        provenance: null,
        city: null,
        packaging: null,
        deliveryInfo: null,
        creationIntro: null,
        images: [],
      },
    },
    hasBlockingListing: false,
    lastModerationReason: null,
  };
}

function mount(node: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      createElement(QueryClientProvider, { client: queryClient }, node),
    );
  });
  return {
    container,
    queryClient,
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

function deferredPage() {
  let resolvePage: (value: unknown) => void = () => undefined;
  const signal = { current: undefined as AbortSignal | undefined };
  return {
    get signal() {
      return signal.current;
    },
    promise(next: AbortSignal | undefined) {
      signal.current = next;
      return new Promise((resolve) => {
        resolvePage = resolve;
      });
    },
    resolve(value: unknown) {
      resolvePage(value);
    },
  };
}

function pageCount(client: QueryClient, key: readonly unknown[]) {
  const data = client.getQueryData<{ pages: unknown[] }>(key);
  return data?.pages.length ?? 0;
}

function holdCancelQueries(client: QueryClient) {
  const original = client.cancelQueries.bind(client);
  const releases: Array<() => void> = [];
  client.cancelQueries = ((filters, options) => {
    const pending = original(filters, options);
    return new Promise((resolve, reject) => {
      releases.push(() => {
        pending.then(resolve, reject);
      });
    });
  }) as QueryClient['cancelQueries'];
  return releases;
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function until(container: HTMLElement, marker: string) {
  await untilMatch(container, (text) => text.includes(marker), marker);
}

async function untilMatch(
  container: HTMLElement,
  predicate: (text: string) => boolean,
  label: string,
) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (predicate(container.textContent ?? '')) return;
    await flush();
  }
  throw new Error(
    `Timed out waiting for ${label}. Body: ${container.textContent}`,
  );
}

function sellerCache(sellerProfiles: unknown[]) {
  return {
    pages: [{ sellerProfiles, nextCursor: null }],
    pageParams: [null],
  };
}

const pendingSellerKey = moderationListQueryKey(
  'seller-profiles',
  'PENDING_REVIEW',
  '',
);

function clickButton(container: ParentNode, label: string) {
  const button = [...container.querySelectorAll('button')].find(
    (item) => item.textContent === label,
  );
  if (!button) throw new Error(`Missing button ${label}`);
  act(() => {
    button.click();
  });
}

function clickCardButton(container: ParentNode, marker: string, label: string) {
  const button = [...container.querySelectorAll('button')].find((item) => {
    if (item.textContent !== label) return false;
    let node = item.parentElement;
    while (node && node !== container) {
      const text = node.textContent ?? '';
      if (
        text.includes(marker) &&
        !text.includes('Pending author') &&
        !text.includes('Quiet author')
      ) {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  });
  if (!button) throw new Error(`Missing ${label} in ${marker}`);
  act(() => {
    button.click();
  });
}

afterEach(() => {
  document.body.replaceChildren();
  harness.listSellerProfiles.mockReset();
  harness.listProducts.mockReset();
  harness.updateSellerStatus.mockReset();
  harness.updateProductStatus.mockReset();
});

describe('admin moderation revision projection', () => {
  it('shows an approved parent with a pending revision in both queues and keeps legacy approval on the parent', async () => {
    const queued = [revisionSeller(seenAt), legacySeller(), quietSeller()];
    harness.listSellerProfiles.mockImplementation(async (query) => ({
      sellerProfiles: queued.filter((seller) =>
        matchesRequestedSeller(seller, query?.filter ?? 'ALL'),
      ),
      nextCursor: null,
    }));
    harness.updateSellerStatus.mockResolvedValue({});
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Pending author');
    expect(harness.listSellerProfiles).toHaveBeenCalledWith(
      { filter: 'PENDING_REVIEW', search: undefined },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    expect(view.container.textContent).toContain('Legacy author');
    expect(view.container.textContent).toContain('Профиль без ревизии');
    expect(view.container.textContent).not.toContain('Quiet author');
    expect(view.container.textContent).toContain('Публикация:');
    expect(view.container.textContent).toContain('Одобрен');
    expect(view.container.textContent).toContain('Проверка:');
    expect(view.container.textContent).toContain('На модерации');
    expect(view.container.textContent).not.toContain('Published author');

    clickButton(view.container, 'Одобрены');
    await untilMatch(
      view.container,
      (text) =>
        text.includes('Quiet author') && !text.includes('Legacy author'),
      'approved queue',
    );
    expect(view.container.textContent).toContain('Pending author');
    expect(view.container.textContent).toContain('Quiet author');
    expect(view.container.textContent).not.toContain('Legacy author');

    clickButton(view.container, 'Все статусы');
    await untilMatch(
      view.container,
      (text) => text.includes('Legacy author') && text.includes('Quiet author'),
      'all statuses',
    );
    expect(view.container.textContent?.match(/Pending author/g)).toHaveLength(
      1,
    );
    expect(view.container.textContent).toContain('Legacy author');
    expect(view.container.textContent).toContain('Quiet author');

    clickButton(view.container, 'Ожидают проверки');
    await untilMatch(
      view.container,
      (text) =>
        text.includes('Профиль без ревизии') && !text.includes('Quiet author'),
      'pending queue',
    );
    clickCardButton(view.container, 'Профиль без ревизии', 'Одобрить');
    await flush();
    expect(harness.updateSellerStatus).toHaveBeenCalledWith(legacyId, {
      status: 'APPROVED',
      reason: undefined,
      target: {
        kind: 'parent',
        status: 'PENDING_REVIEW',
        updatedAt: seenAt,
      },
    });
    view.unmount();
  });

  it('submits the revision snapshot from the confirmation and does not retry a conflict', async () => {
    let sellers = [revisionSeller(seenAt)];
    harness.listSellerProfiles.mockImplementation(async () => ({
      sellerProfiles: sellers,
    }));
    harness.updateSellerStatus.mockResolvedValue({});
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Pending author');
    clickButton(view.container, 'Запросить изменения');
    await flush();
    sellers = [revisionSeller(freshAt)];
    await act(async () => {
      await view.queryClient.invalidateQueries({
        queryKey: ['admin', 'seller-profiles'],
      });
    });
    await flush();
    const dialog = view.container.querySelector('[role="dialog"]');
    if (!dialog) throw new Error('Confirmation dialog did not open');
    const reason = dialog.querySelector('input');
    if (!reason) throw new Error('Reason field did not open');
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )?.set;
      setter?.call(reason, 'Нужна правка');
      reason.dispatchEvent(new Event('input', { bubbles: true }));
    });
    clickButton(dialog, 'Запросить изменения');
    await flush();
    expect(harness.updateSellerStatus).toHaveBeenCalledWith(sellerId, {
      status: 'CHANGES_REQUESTED',
      reason: 'Нужна правка',
      target: { kind: 'revision', id: revisionId, updatedAt: seenAt },
    });

    harness.updateSellerStatus.mockRejectedValue(
      new ApiClientError('conflict', { kind: 'conflict', status: 409 }),
    );
    clickButton(view.container, 'Одобрить');
    await until(view.container, 'Карточка устарела');
    expect(harness.updateSellerStatus).toHaveBeenCalledTimes(2);
    expect(harness.listSellerProfiles.mock.calls.length).toBeGreaterThan(1);
    view.unmount();
  });

  it('shows product revision content separately from the published parent', async () => {
    harness.listSellerProfiles.mockResolvedValue({ sellerProfiles: [] });
    harness.listProducts.mockResolvedValue({ products: [pendingProduct()] });
    harness.updateProductStatus.mockResolvedValue({});
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Модерация');
    clickButton(view.container, 'Работы');
    await until(view.container, 'Pending work');
    expect(view.container.textContent).toContain('Публикация:');
    expect(view.container.textContent).toContain('Одобрен');
    expect(view.container.textContent).toContain('Проверка:');
    expect(view.container.textContent).toContain('На модерации');
    expect(view.container.textContent).not.toContain('Published work');
    expect(view.container.textContent).toContain('Описание не указано');
    clickButton(view.container, 'Одобрить');
    await flush();
    expect(harness.updateProductStatus).toHaveBeenCalledWith(productId, {
      status: 'APPROVED',
      reason: undefined,
      target: {
        kind: 'revision',
        id: productRevisionId,
        updatedAt: seenAt,
      },
    });
    view.unmount();
  });

  it('passes the current revision photo identity into the photo component', async () => {
    const seenChecksum = 'a'.repeat(64);
    const freshChecksum = 'b'.repeat(64);
    harness.listSellerProfiles.mockResolvedValue({
      sellerProfiles: [photoSeller(seenAt, seenChecksum)],
    });
    const view = mount(createElement(AdminModerationScreen));
    await until(
      view.container,
      `photo:${sellerId}:${revisionId}:${seenAt}:${seenChecksum}`,
    );
    act(() => {
      view.queryClient.setQueryData(
        pendingSellerKey,
        sellerCache([photoSeller(freshAt, freshChecksum)]),
      );
    });
    await flush();
    expect(view.container.textContent).toContain(
      `photo:${sellerId}:${revisionId}:${freshAt}:${freshChecksum}`,
    );
    expect(view.container.textContent).not.toContain(seenChecksum);
    view.unmount();
  });

  it('shows the achievement date that approval publishes, including month precision and an empty date', async () => {
    const day = { year: 2025, month: 3, day: 17 };
    const month = { year: 2026, month: 8, day: null };
    harness.listSellerProfiles.mockResolvedValue({
      sellerProfiles: [achievementSeller(day, month)],
    });
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Дневная премия');
    expect(achievementText(view.container, 'Дневная премия')).toBe(
      `${formatAchievementDate(day)}Дневная премия`,
    );
    expect(achievementText(view.container, 'Месячная премия')).toBe(
      'Август, 2026Месячная премия',
    );
    expect(achievementText(view.container, 'Без даты')).toBe('Без даты');
    expect(view.container.querySelector('img[alt="Достижение"]')).toBeNull();
    view.unmount();
  });

  it('shows the achievement image URL from the review target and replaces it when that image changes', async () => {
    const firstId = '00000000-0000-4000-8000-000000000021';
    const nextId = '00000000-0000-4000-8000-000000000022';
    harness.listSellerProfiles.mockResolvedValue({
      sellerProfiles: [achievementImageSeller(firstId)],
    });
    const view = mount(createElement(AdminModerationScreen));
    const firstUrl = getApiAssetUrl(
      `/api/author-achievements/${firstId}/image`,
    );
    await until(view.container, 'Выставка с фото');
    expect(
      view.container
        .querySelector('img[alt="Достижение"]')
        ?.getAttribute('src'),
    ).toBe(firstUrl);

    act(() => {
      view.queryClient.setQueryData(
        pendingSellerKey,
        sellerCache([achievementImageSeller(nextId)]),
      );
    });
    await flush();
    const nextUrl = getApiAssetUrl(`/api/author-achievements/${nextId}/image`);
    expect(
      view.container
        .querySelector('img[alt="Достижение"]')
        ?.getAttribute('src'),
    ).toBe(nextUrl);
    expect(
      [...view.container.querySelectorAll('img')].some(
        (image) => image.getAttribute('src') === firstUrl,
      ),
    ).toBe(false);
    view.unmount();
  });

  it('renders the server page for the requested filter', async () => {
    harness.listSellerProfiles.mockResolvedValue({
      sellerProfiles: [quietSeller()],
      nextCursor: null,
    });
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Quiet author');
    expect(harness.listSellerProfiles).toHaveBeenCalledWith(
      { filter: 'PENDING_REVIEW', search: undefined },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    view.unmount();
  });

  it('loads the next seller page, blocks a repeated request, and retries after an error', async () => {
    let rejectNext: (error: Error) => void = () => undefined;
    harness.listSellerProfiles
      .mockResolvedValueOnce({
        sellerProfiles: [revisionSeller(seenAt)],
        nextCursor: 'cursor-1',
      })
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            rejectNext = reject;
          }),
      )
      .mockResolvedValueOnce({
        sellerProfiles: [legacySeller()],
        nextCursor: null,
      });
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Показать ещё');
    clickButton(view.container, 'Показать ещё');
    await flush();
    const pending = buttonNamed(view.container, 'Показать ещё');
    expect(pending.disabled).toBe(true);
    clickButton(view.container, 'Показать ещё');
    expect(harness.listSellerProfiles).toHaveBeenCalledTimes(2);
    await act(async () => {
      rejectNext(new Error('offline'));
    });
    await until(view.container, 'Не удалось загрузить следующую страницу.');
    expect(view.container.textContent).toContain('Pending author');
    clickButton(view.container, 'Повторить');
    await until(view.container, 'Legacy author');
    expect(view.container.textContent).toContain('Pending author');
    const cursors = harness.listSellerProfiles.mock.calls.map(
      (call) => call[0]?.cursor,
    );
    expect(cursors.filter((cursor) => cursor === 'cursor-1')).toHaveLength(2);
    view.unmount();
  });

  it('starts a new cursor when the search changes', async () => {
    harness.listSellerProfiles.mockImplementation(async (query) => {
      if (query?.search === 'Later') {
        return {
          sellerProfiles: query.cursor
            ? [legacySeller()]
            : [revisionSeller(seenAt)],
          nextCursor: query.cursor ? null : 'cursor-search',
        };
      }
      return { sellerProfiles: [quietSeller()], nextCursor: 'cursor-old' };
    });
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Quiet author');
    await typeLabeledField(view.container, 'Найти автора', '   ');
    await flush();
    expect(harness.listSellerProfiles).toHaveBeenCalledTimes(1);
    await typeLabeledField(view.container, 'Найти автора', 'Later');
    await until(view.container, 'Pending author');
    expect(view.container.textContent).not.toContain('Quiet author');
    const firstSearch = harness.listSellerProfiles.mock.calls.find(
      (call) => call[0]?.search === 'Later',
    );
    expect(firstSearch?.[0]).toMatchObject({
      filter: 'PENDING_REVIEW',
      search: 'Later',
    });
    expect(firstSearch?.[0].cursor).toBeUndefined();
    clickButton(view.container, 'Показать ещё');
    await until(view.container, 'Legacy author');
    const continued = harness.listSellerProfiles.mock.calls.filter(
      (call) =>
        call[0]?.search === 'Later' && call[0]?.cursor === 'cursor-search',
    );
    expect(continued).toHaveLength(1);
    view.unmount();
  });

  it('approves a seller on the next page and replaces that page after a conflict', async () => {
    let phase: 'open' | 'fresh' = 'open';
    harness.listSellerProfiles.mockImplementation(async (query) => {
      if (phase === 'fresh') {
        return { sellerProfiles: [laterSeller(freshAt)], nextCursor: null };
      }
      if (query?.cursor === 'cursor-2') {
        return { sellerProfiles: [laterSeller(seenAt)], nextCursor: null };
      }
      return {
        sellerProfiles: [revisionSeller(seenAt)],
        nextCursor: 'cursor-2',
      };
    });
    harness.updateSellerStatus.mockImplementation(async () => {
      phase = 'fresh';
      throw new ApiClientError('conflict', { kind: 'conflict', status: 409 });
    });
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Показать ещё');
    clickButton(view.container, 'Показать ещё');
    await until(view.container, 'Later author');
    const cursorReads = () =>
      harness.listSellerProfiles.mock.calls.filter(
        (call) => call[0]?.cursor === 'cursor-2',
      ).length;
    const readsBeforeConflict = cursorReads();
    clickCardButton(view.container, 'Later author', 'Одобрить');
    await untilMatch(
      view.container,
      (text) =>
        text.includes('Карточка устарела') &&
        text.includes('Later author') &&
        !text.includes('Pending author') &&
        (text.match(/Later author/g) ?? []).length === 1,
      'conflict refresh',
    );
    expect(cursorReads()).toBe(readsBeforeConflict);
    expect(harness.updateSellerStatus).toHaveBeenCalledWith(laterSellerId, {
      status: 'APPROVED',
      reason: undefined,
      target: {
        kind: 'revision',
        id: laterRevisionId,
        updatedAt: seenAt,
      },
    });
    clickCardButton(view.container, 'Later author', 'Одобрить');
    await flush();
    expect(harness.updateSellerStatus).toHaveBeenLastCalledWith(laterSellerId, {
      status: 'APPROVED',
      reason: undefined,
      target: {
        kind: 'revision',
        id: laterRevisionId,
        updatedAt: freshAt,
      },
    });
    view.unmount();
  });

  it('approves a product on the next page and drops that page after refresh', async () => {
    harness.listSellerProfiles.mockResolvedValue({
      sellerProfiles: [],
      nextCursor: null,
    });
    let refreshed = false;
    harness.listProducts.mockImplementation(async (query) => {
      if (refreshed) {
        return { products: [pendingProduct()], nextCursor: null };
      }
      if (query?.cursor === 'product-cursor') {
        return { products: [laterProduct()], nextCursor: null };
      }
      return { products: [pendingProduct()], nextCursor: 'product-cursor' };
    });
    harness.updateProductStatus.mockImplementation(async () => {
      refreshed = true;
      return {};
    });
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Модерация');
    clickButton(view.container, 'Работы');
    await until(view.container, 'Показать ещё');
    clickButton(view.container, 'Показать ещё');
    await until(view.container, 'Later work');
    clickButtonNear(view.container, 'Later work', 'Одобрить');
    await untilMatch(
      view.container,
      (text) => text.includes('Pending work') && !text.includes('Later work'),
      'refreshed product page',
    );
    expect(harness.updateProductStatus).toHaveBeenCalledWith(laterProductId, {
      status: 'APPROVED',
      reason: undefined,
      target: {
        kind: 'revision',
        id: laterProductRevisionId,
        updatedAt: seenAt,
      },
    });
    expect(
      harness.listProducts.mock.calls.filter(
        (call) => call[0]?.cursor === 'product-cursor',
      ),
    ).toHaveLength(1);
    view.unmount();
  });

  it('keeps the author search focused and editable while the next query is pending', async () => {
    let resolveSearch: (value: unknown) => void = () => undefined;
    harness.listSellerProfiles.mockImplementation((query) => {
      if (query?.search) {
        return new Promise((resolve) => {
          resolveSearch = resolve;
        });
      }
      return Promise.resolve({
        sellerProfiles: [revisionSeller(seenAt)],
        nextCursor: null,
      });
    });
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Pending author');
    const input = view.container.querySelector(
      'input[aria-label="Найти автора"]',
    );
    if (!(input instanceof HTMLInputElement)) throw new Error('Missing search');
    input.focus();
    await typeLabeledField(view.container, 'Найти автора', 'Later');
    await flush();
    expect(
      view.container.querySelector('input[aria-label="Найти автора"]'),
    ).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(view.container.textContent).not.toContain('Pending author');
    await typeLabeledField(view.container, 'Найти автора', 'Later more');
    await flush();
    expect(
      view.container.querySelector('input[aria-label="Найти автора"]'),
    ).toBe(input);
    expect(input.value).toBe('Later more');
    expect(harness.listSellerProfiles.mock.calls.at(-1)?.[0].search).toBe(
      'Later more',
    );
    await act(async () => {
      resolveSearch({ sellerProfiles: [legacySeller()], nextCursor: null });
    });
    await until(view.container, 'Legacy author');
    view.unmount();
  });

  it('keeps the work search focused while its query is pending', async () => {
    let resolveSearch: (value: unknown) => void = () => undefined;
    harness.listSellerProfiles.mockResolvedValue({
      sellerProfiles: [],
      nextCursor: null,
    });
    harness.listProducts.mockImplementation((query) => {
      if (query?.search) {
        return new Promise((resolve) => {
          resolveSearch = resolve;
        });
      }
      return Promise.resolve({
        products: [pendingProduct()],
        nextCursor: null,
      });
    });
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Модерация');
    clickButton(view.container, 'Работы');
    await until(view.container, 'Pending work');
    const input = view.container.querySelector(
      'input[aria-label="Найти работу"]',
    );
    if (!(input instanceof HTMLInputElement)) throw new Error('Missing search');
    input.focus();
    await typeLabeledField(view.container, 'Найти работу', 'Vessel');
    await flush();
    expect(
      view.container.querySelector('input[aria-label="Найти работу"]'),
    ).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(view.container.textContent).not.toContain('Pending work');
    await act(async () => {
      resolveSearch({ products: [pendingProduct()], nextCursor: null });
    });
    await until(view.container, 'Pending work');
    view.unmount();
  });

  it('lets an over-limit search be corrected without leaving the moderation shell', async () => {
    harness.listSellerProfiles.mockImplementation(async (query) => {
      adminModerationListQuerySchema.parse(query);
      return { sellerProfiles: [revisionSeller(seenAt)], nextCursor: null };
    });
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Pending author');
    await typeLabeledField(
      view.container,
      'Найти автора',
      'a'.repeat(ADMIN_MODERATION_MAX_SEARCH + 1),
    );
    await flush();
    await flush();
    const input = view.container.querySelector(
      'input[aria-label="Найти автора"]',
    );
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(view.container.textContent).toContain(
      `Поиск не длиннее ${ADMIN_MODERATION_MAX_SEARCH} символов.`,
    );
    expect(view.container.textContent).not.toContain('Pending author');
    expect(
      harness.listSellerProfiles.mock.calls.some(
        (call) =>
          String(call[0]?.search ?? '').length > ADMIN_MODERATION_MAX_SEARCH,
      ),
    ).toBe(false);
    await typeLabeledField(view.container, 'Найти автора', 'Later');
    await until(view.container, 'Pending author');
    view.unmount();
  });

  it('changes filter and tab while a search query is still pending', async () => {
    harness.listSellerProfiles.mockImplementation((query) => {
      if (query?.search === 'Later' && query?.filter === 'PENDING_REVIEW') {
        return new Promise(() => undefined);
      }
      if (query?.filter === 'APPROVED') {
        return Promise.resolve({
          sellerProfiles: [quietSeller()],
          nextCursor: null,
        });
      }
      return Promise.resolve({
        sellerProfiles: [revisionSeller(seenAt)],
        nextCursor: null,
      });
    });
    harness.listProducts.mockResolvedValue({
      products: [pendingProduct()],
      nextCursor: null,
    });
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Pending author');
    await typeLabeledField(view.container, 'Найти автора', 'Later');
    await flush();
    expect(view.container.textContent).not.toContain('Pending author');
    clickButton(view.container, 'Одобрены');
    await until(view.container, 'Quiet author');
    expect(
      view.container.querySelector('input[aria-label="Найти автора"]'),
    ).not.toBeNull();
    expect(harness.listSellerProfiles.mock.calls.at(-1)?.[0]).toMatchObject({
      filter: 'APPROVED',
      search: 'Later',
    });
    clickButton(view.container, 'Работы');
    await until(view.container, 'Pending work');
    expect(
      view.container.querySelector('input[aria-label="Найти работу"]'),
    ).not.toBeNull();
    view.unmount();
  });

  it('ignores a late response from the search that is no longer current', async () => {
    const resolvers = new Map<string, (value: unknown) => void>();
    const signals = new Map<string, AbortSignal>();
    harness.listSellerProfiles.mockImplementation((query, options) => {
      if (!query?.search) {
        return Promise.resolve({
          sellerProfiles: [revisionSeller(seenAt)],
          nextCursor: null,
        });
      }
      signals.set(query.search, options.signal);
      return new Promise((resolve) => {
        resolvers.set(query.search, resolve);
      });
    });
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Pending author');
    await typeLabeledField(view.container, 'Найти автора', 'Later');
    await flush();
    await typeLabeledField(view.container, 'Найти автора', 'Other');
    await flush();
    const laterSignal = signals.get('Later');
    expect(laterSignal?.aborted).toBe(true);
    await act(async () => {
      resolvers.get('Later')?.({
        sellerProfiles: [namedSeller('Stale author')],
        nextCursor: null,
      });
    });
    await flush();
    expect(view.container.textContent).not.toContain('Stale author');
    await act(async () => {
      resolvers.get('Other')?.({
        sellerProfiles: [namedSeller('Other author')],
        nextCursor: null,
      });
    });
    await until(view.container, 'Other author');
    expect(view.container.textContent).not.toContain('Stale author');
    view.unmount();
  });

  it('cancels an active later page before refresh and still loads a fresh next page', async () => {
    const pending = deferredPage();
    let refreshed = false;
    harness.listSellerProfiles.mockImplementation((query, options) => {
      if (query?.cursor === 'old-cursor')
        return pending.promise(options?.signal);
      if (query?.cursor === 'fresh-cursor') {
        return Promise.resolve({
          sellerProfiles: [laterSeller(seenAt)],
          nextCursor: null,
        });
      }
      if (refreshed) {
        return Promise.resolve({
          sellerProfiles: [namedSeller('Fresh author')],
          nextCursor: 'fresh-cursor',
        });
      }
      return Promise.resolve({
        sellerProfiles: [revisionSeller(seenAt)],
        nextCursor: 'old-cursor',
      });
    });
    harness.updateSellerStatus.mockImplementation(async () => {
      refreshed = true;
      return {};
    });
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Показать ещё');
    clickButton(view.container, 'Показать ещё');
    await flush();
    expect(pending.signal?.aborted).toBe(false);
    clickButton(view.container, 'Одобрить');
    await until(view.container, 'Fresh author');
    expect(pending.signal?.aborted).toBe(true);
    pending.resolve({
      sellerProfiles: [namedSeller('Restored author')],
      nextCursor: null,
    });
    await flush();
    expect(view.container.textContent).not.toContain('Restored author');
    expect(pageCount(view.queryClient, pendingSellerKey)).toBe(1);
    clickButton(view.container, 'Показать ещё');
    await until(view.container, 'Later author');
    expect(pageCount(view.queryClient, pendingSellerKey)).toBe(2);
    view.unmount();
  });

  it('does not let an inactive later page restore pages trimmed by refresh', async () => {
    const pending = deferredPage();
    harness.listSellerProfiles.mockImplementation((query, options) => {
      if (query?.cursor === 'old-cursor')
        return pending.promise(options?.signal);
      return Promise.resolve({
        sellerProfiles: [revisionSeller(seenAt)],
        nextCursor: 'old-cursor',
      });
    });
    harness.listProducts.mockResolvedValue({
      products: [pendingProduct()],
      nextCursor: null,
    });
    harness.updateProductStatus.mockResolvedValue({});
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Показать ещё');
    clickButton(view.container, 'Показать ещё');
    await flush();
    clickButton(view.container, 'Работы');
    await until(view.container, 'Pending work');
    expect(pending.signal?.aborted).toBe(false);
    clickButton(view.container, 'Одобрить');
    await flush();
    await flush();
    expect(pending.signal?.aborted).toBe(true);
    expect(pageCount(view.queryClient, pendingSellerKey)).toBe(1);
    pending.resolve({
      sellerProfiles: [laterSeller(seenAt)],
      nextCursor: 'restored-cursor',
    });
    await flush();
    expect(pageCount(view.queryClient, pendingSellerKey)).toBe(1);
    const cached = view.queryClient.getQueryData<{
      pages: Array<{ nextCursor: string | null }>;
    }>(pendingSellerKey);
    expect(cached?.pages[0]?.nextCursor).toBe('old-cursor');
    view.unmount();
  });

  it('cancels in-flight fetches for other moderation filter and search keys', async () => {
    harness.listSellerProfiles.mockResolvedValue({
      sellerProfiles: [revisionSeller(seenAt)],
      nextCursor: null,
    });
    harness.listProducts.mockResolvedValue({
      products: [pendingProduct()],
      nextCursor: null,
    });
    harness.updateProductStatus.mockResolvedValue({});
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Pending author');
    const filterKey = moderationListQueryKey('seller-profiles', 'APPROVED', '');
    const searchKey = moderationListQueryKey(
      'seller-profiles',
      'PENDING_REVIEW',
      'Later',
    );
    const twoPages = {
      pages: [
        { sellerProfiles: [quietSeller()], nextCursor: 'page-2' },
        { sellerProfiles: [quietSeller()], nextCursor: 'page-3' },
      ],
      pageParams: [null, 'page-2'],
    };
    view.queryClient.setQueryData(filterKey, twoPages);
    view.queryClient.setQueryData(searchKey, twoPages);
    const filterFetch = deferredPage();
    const searchFetch = deferredPage();
    const filterRead = view.queryClient.fetchInfiniteQuery({
      queryKey: filterKey,
      initialPageParam: 'page-3',
      queryFn: ({ signal }) => filterFetch.promise(signal),
      getNextPageParam: (page: { nextCursor: string | null }) =>
        page.nextCursor ?? undefined,
    });
    const searchRead = view.queryClient.fetchInfiniteQuery({
      queryKey: searchKey,
      initialPageParam: 'page-3',
      queryFn: ({ signal }) => searchFetch.promise(signal),
      getNextPageParam: (page: { nextCursor: string | null }) =>
        page.nextCursor ?? undefined,
    });
    await flush();
    expect(filterFetch.signal?.aborted).toBe(false);
    expect(searchFetch.signal?.aborted).toBe(false);
    clickButton(view.container, 'Работы');
    await until(view.container, 'Pending work');
    clickButton(view.container, 'Одобрить');
    await flush();
    await flush();
    expect(filterFetch.signal?.aborted).toBe(true);
    expect(searchFetch.signal?.aborted).toBe(true);
    expect(pageCount(view.queryClient, filterKey)).toBe(1);
    expect(pageCount(view.queryClient, searchKey)).toBe(1);
    filterFetch.resolve({
      sellerProfiles: [namedSeller('Restored author')],
      nextCursor: null,
    });
    searchFetch.resolve({
      sellerProfiles: [namedSeller('Restored author')],
      nextCursor: null,
    });
    await flush();
    await Promise.allSettled([filterRead, searchRead]);
    expect(pageCount(view.queryClient, filterKey)).toBe(1);
    expect(pageCount(view.queryClient, searchKey)).toBe(1);
    view.unmount();
  });

  it('cancels a later page when refresh follows a conflict', async () => {
    const pending = deferredPage();
    harness.listSellerProfiles.mockImplementation((query, options) => {
      if (query?.cursor === 'old-cursor')
        return pending.promise(options?.signal);
      return Promise.resolve({
        sellerProfiles: [revisionSeller(seenAt)],
        nextCursor: 'old-cursor',
      });
    });
    harness.listProducts.mockResolvedValue({
      products: [pendingProduct()],
      nextCursor: null,
    });
    harness.updateProductStatus.mockRejectedValue(
      new ApiClientError('conflict', { kind: 'conflict', status: 409 }),
    );
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Показать ещё');
    clickButton(view.container, 'Показать ещё');
    await flush();
    clickButton(view.container, 'Работы');
    await until(view.container, 'Pending work');
    clickButton(view.container, 'Одобрить');
    await until(view.container, 'Карточка устарела');
    expect(pending.signal?.aborted).toBe(true);
    pending.resolve({
      sellerProfiles: [laterSeller(seenAt)],
      nextCursor: null,
    });
    await flush();
    expect(pageCount(view.queryClient, pendingSellerKey)).toBe(1);
    view.unmount();
  });

  it('drops loaded pages after cancelling the following fetch and ignores its late result', async () => {
    const pending = deferredPage();
    let page = 0;
    harness.listSellerProfiles.mockImplementation((query, options) => {
      if (query?.cursor === 'page-3') return pending.promise(options?.signal);
      page += 1;
      if (page === 1) {
        return Promise.resolve({
          sellerProfiles: [revisionSeller(seenAt)],
          nextCursor: 'page-2',
        });
      }
      return Promise.resolve({
        sellerProfiles: [laterSeller(seenAt)],
        nextCursor: 'page-3',
      });
    });
    harness.updateSellerStatus.mockResolvedValue({});
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Показать ещё');
    clickButton(view.container, 'Показать ещё');
    await until(view.container, 'Later author');
    expect(pageCount(view.queryClient, pendingSellerKey)).toBe(2);
    clickButton(view.container, 'Показать ещё');
    await flush();
    clickButton(view.container, 'Одобрить');
    await flush();
    await flush();
    expect(pending.signal?.aborted).toBe(true);
    expect(pageCount(view.queryClient, pendingSellerKey)).toBe(1);
    pending.resolve({
      sellerProfiles: [namedSeller('Restored author')],
      nextCursor: null,
    });
    await flush();
    expect(pageCount(view.queryClient, pendingSellerKey)).toBe(1);
    expect(view.container.textContent).not.toContain('Restored author');
    view.unmount();
  });

  it('does not trim or refetch moderation lists after the auth epoch changes', async () => {
    const pending = deferredPage();
    let page = 0;
    harness.listSellerProfiles.mockImplementation((query, options) => {
      if (query?.cursor === 'page-3') return pending.promise(options?.signal);
      page += 1;
      if (page === 1) {
        return Promise.resolve({
          sellerProfiles: [revisionSeller(seenAt)],
          nextCursor: 'page-2',
        });
      }
      return Promise.resolve({
        sellerProfiles: [laterSeller(seenAt)],
        nextCursor: 'page-3',
      });
    });
    harness.updateSellerStatus.mockResolvedValue({});
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Показать ещё');
    clickButton(view.container, 'Показать ещё');
    await until(view.container, 'Later author');
    const releases = holdCancelQueries(view.queryClient);
    clickButton(view.container, 'Показать ещё');
    await flush();
    clickButton(view.container, 'Одобрить');
    await flush();
    expect(releases).toHaveLength(2);
    advanceAuthEpoch(view.queryClient);
    await act(async () => {
      releases.splice(0).forEach((release) => release());
    });
    await flush();
    expect(pageCount(view.queryClient, pendingSellerKey)).toBe(2);
    pending.resolve({
      sellerProfiles: [namedSeller('Restored author')],
      nextCursor: null,
    });
    await flush();
    expect(pageCount(view.queryClient, pendingSellerKey)).toBe(2);
    expect(view.container.textContent).toContain('Later author');
    view.unmount();
  });
});

function matchesRequestedSeller(
  seller: { parentStatus: string; reviewTarget: { status: string } | null },
  filter: string,
) {
  if (filter === 'ALL') return true;
  if (filter === 'APPROVED') return seller.parentStatus === 'APPROVED';
  if (seller.reviewTarget) return seller.reviewTarget.status === filter;
  return seller.parentStatus === filter;
}

function buttonNamed(container: ParentNode, label: string) {
  const button = [...container.querySelectorAll('button')].find(
    (item) => item.textContent === label,
  );
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Missing button ${label}`);
  }
  return button;
}

function clickButtonNear(container: ParentNode, marker: string, label: string) {
  let best: { button: HTMLButtonElement; length: number } | null = null;
  for (const item of container.querySelectorAll('button')) {
    if (item.textContent !== label) continue;
    let node = item.parentElement;
    while (node && node !== container) {
      const text = node.textContent ?? '';
      if (text.includes(marker)) {
        if (!best || text.length < best.length) {
          best = { button: item, length: text.length };
        }
        break;
      }
      node = node.parentElement;
    }
  }
  if (!best) throw new Error(`Missing ${label} in ${marker}`);
  const button = best.button;
  act(() => {
    button.click();
  });
}

async function typeLabeledField(
  container: ParentNode,
  label: string,
  value: string,
) {
  const field = container.querySelector(`input[aria-label="${label}"]`);
  if (!(field instanceof HTMLInputElement)) {
    throw new Error(`Missing field ${label}`);
  }
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set;
    setter?.call(field, value);
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

const laterSellerId = '00000000-0000-4000-8000-000000000031';
const laterRevisionId = '00000000-0000-4000-8000-000000000032';
const laterProductId = '00000000-0000-4000-8000-000000000033';
const laterProductRevisionId = '00000000-0000-4000-8000-000000000034';

function namedSeller(fullName: string) {
  const seller = revisionSeller(seenAt);
  return {
    ...seller,
    reviewTarget: {
      ...seller.reviewTarget,
      content: {
        ...seller.reviewTarget.content,
        fullName,
      },
    },
  };
}

function laterSeller(updatedAt: string) {
  const seller = revisionSeller(updatedAt);
  return {
    ...seller,
    id: laterSellerId,
    reviewTarget: {
      ...seller.reviewTarget,
      id: laterRevisionId,
      updatedAt,
      content: {
        ...seller.reviewTarget.content,
        fullName: 'Later author',
      },
    },
  };
}

function laterProduct() {
  const product = pendingProduct();
  return {
    ...product,
    id: laterProductId,
    publicId: 'laterwork01',
    reviewTarget: {
      ...product.reviewTarget,
      id: laterProductRevisionId,
      content: {
        ...product.reviewTarget.content,
        title: 'Later work',
      },
    },
  };
}

function photoSeller(updatedAt: string, checksum: string) {
  const seller = revisionSeller(updatedAt);
  return {
    ...seller,
    reviewTarget: {
      ...seller.reviewTarget,
      content: {
        ...seller.reviewTarget.content,
        profilePhoto: {
          url: `/api/admin/seller-profiles/${sellerId}/revisions/${revisionId}/photo`,
          mimeType: 'image/png',
          byteLength: 8,
          checksum,
        },
      },
    },
  };
}

function achievementSeller(
  day: { year: number; month: number; day: number | null },
  month: { year: number; month: number; day: number | null },
) {
  const seller = revisionSeller(seenAt);
  return {
    ...seller,
    reviewTarget: {
      ...seller.reviewTarget,
      content: {
        ...seller.reviewTarget.content,
        achievements: [
          {
            id: '00000000-0000-4000-8000-000000000011',
            occurredDate: day,
            body: 'Дневная премия',
            image: null,
          },
          {
            id: '00000000-0000-4000-8000-000000000012',
            occurredDate: month,
            body: 'Месячная премия',
            image: null,
          },
          {
            id: '00000000-0000-4000-8000-000000000013',
            occurredDate: null,
            body: 'Без даты',
            image: null,
          },
        ],
      },
    },
  };
}

function achievementImageSeller(achievementId: string) {
  const seller = revisionSeller(seenAt);
  return {
    ...seller,
    reviewTarget: {
      ...seller.reviewTarget,
      content: {
        ...seller.reviewTarget.content,
        achievements: [
          {
            id: achievementId,
            occurredDate: { year: 2026, month: 4, day: 11 },
            body: 'Выставка с фото',
            image: {
              url: `/api/author-achievements/${achievementId}/image`,
              mimeType: 'image/png',
              byteLength: 74,
              checksum: 'c'.repeat(64),
            },
          },
        ],
      },
    },
  };
}

function achievementText(container: ParentNode, body: string) {
  const span = [...container.querySelectorAll('span')].find(
    (node) => node.textContent === body,
  );
  if (!span?.parentElement) throw new Error(`Missing achievement ${body}`);
  return span.parentElement.textContent ?? '';
}
