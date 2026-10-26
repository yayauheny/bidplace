/** @vitest-environment jsdom */
import { act, createElement, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClientError } from '@bidplace/api-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const h = vi.hoisted(() => ({
  params: {} as Record<string, string>,
  admin: {
    listProductSummaries: vi.fn(),
    listSellerSummaries: vi.fn(),
    getProductDetail: vi.fn(),
    getSellerDetail: vi.fn(),
    getProductHistory: vi.fn(),
    getSellerHistory: vi.fn(),
    updateProductStatus: vi.fn(),
    updateSellerStatus: vi.fn(),
  },
  back: vi.fn(),
  replace: vi.fn(),
}));
vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  View: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
  FlatList: ({
    data,
    renderItem,
    ListHeaderComponent,
    ListEmptyComponent,
    ListFooterComponent,
  }: {
    data: unknown[];
    renderItem: (item: { item: unknown }) => ReactNode;
    ListHeaderComponent: ReactNode;
    ListEmptyComponent: ReactNode;
    ListFooterComponent: ReactNode;
  }) =>
    createElement(
      'div',
      null,
      ListHeaderComponent,
      data.length
        ? data.map((item, i) =>
            createElement('div', { key: i }, renderItem({ item })),
          )
        : ListEmptyComponent,
      ListFooterComponent,
    ),
}));
vi.mock('expo-router', () => ({
  useRouter: () => ({
    back: h.back,
    replace: h.replace,
    setParams: (params: object) => Object.assign(h.params, params),
  }),
  useLocalSearchParams: () => h.params,
  Link: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
}));
vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({ admin: h.admin }),
}));
vi.mock('../../providers/theme-provider', () => ({ useAppTheme: () => ({}) }));
vi.mock('../../components/layout/use-dock-inset', () => ({
  useDockInset: () => ({ reserve: 90 }),
}));
vi.mock('../../components/layout', () => ({
  FormPageColumns: ({
    children,
    sidebar,
  }: {
    children?: ReactNode;
    sidebar?: ReactNode;
  }) => createElement('div', null, sidebar, children),
  AppShell: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
  FormPageShell: ({
    children,
    bottomAction,
  }: {
    children?: ReactNode;
    bottomAction?: ReactNode;
  }) => createElement('div', null, children, bottomAction),
}));
vi.mock('../../components/figma/BackButton', () => ({
  BackButton: ({ onPress }: { onPress: () => void }) =>
    createElement(
      'button',
      { onClick: onPress, 'aria-label': 'Назад' },
      'Назад',
    ),
}));
vi.mock('../../components/figma/WorkGallery', () => ({
  WorkGallery: () => null,
}));
vi.mock('../../components/figma/FigmaTabs', () => ({
  FigmaTabs: ({
    tabs,
    onChange,
  }: {
    tabs: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
  }) =>
    createElement(
      'div',
      null,
      ...tabs.map((tab) =>
        createElement(
          'button',
          { key: tab.value, onClick: () => onChange(tab.value) },
          tab.label,
        ),
      ),
    ),
}));
vi.mock('../../components/shared/PrivateStoryImage', () => ({
  PrivateStoryImage: () => null,
}));
vi.mock('../../components/shared/InfrastructurePageStatus', () => ({
  InfrastructurePageStatus: ({
    status,
    onRetry,
  }: {
    status: string;
    onRetry: () => void;
  }) => createElement('button', { onClick: onRetry }, status),
}));
vi.mock('./AdminRevisionPhoto', () => ({
  AdminReviewImage: () => null,
  AdminRevisionPhoto: () => null,
  AdminAchievementImage: () => null,
}));
vi.mock('./AdminWorkCatalogProposals', () => ({
  AdminWorkCatalogProposals: () =>
    createElement('div', null, 'catalog proposals'),
}));
vi.mock('../auth/AccountLogoutButton', () => ({
  AccountLogoutButton: () => null,
}));
vi.mock('./AdminUsersPanel', () => ({
  AdminUsersPanel: () => createElement('div', null, 'user incidents'),
}));
vi.mock('../../components/ui', () => {
  const Text = ({ children }: { children?: ReactNode }) =>
    createElement('span', null, children);
  const Button = ({
    label,
    onPress,
    disabled,
    loading,
  }: {
    label: string;
    onPress?: () => void;
    disabled?: boolean;
    loading?: boolean;
  }) =>
    createElement(
      'button',
      { onClick: onPress, disabled: disabled || loading },
      label,
    );
  return {
    AppText: Text,
    PageHeader: ({ title }: { title: string }) =>
      createElement('h1', null, title),
    FormSection: ({
      title,
      children,
    }: {
      title?: string;
      children?: ReactNode;
    }) => createElement('section', null, title, children),
    ResilientRemoteImage: () => null,
    MotionPressable: ({ children, ...props }: { children?: ReactNode }) =>
      createElement('div', props, children),
    PrimaryButton: Button,
    SecondaryButton: Button,
    TextButton: Button,
    TextField: ({
      label,
      value,
      onChangeText,
    }: {
      label: string;
      value: string;
      onChangeText: (value: string) => void;
    }) =>
      createElement('input', {
        'aria-label': label,
        value,
        onChange: (e: { target: { value: string } }) =>
          onChangeText(e.target.value),
      }),
    AppDialog: ({
      open,
      children,
      title,
    }: {
      open: boolean;
      children?: ReactNode;
      title: string;
    }) =>
      open ? createElement('div', { role: 'dialog' }, title, children) : null,
  };
});
import { AdminModerationScreen } from './admin-moderation-screen';
import { AdminModerationDetail } from './admin-moderation-detail';
import {
  moderationComparison,
  moderationPhotoChanges,
  moderationStoryChanged,
} from './admin-moderation-state';
const sellerId = '00000000-0000-4000-8000-000000000001';
const userId = '00000000-0000-4000-8000-000000000004';
const revisionId = '00000000-0000-4000-8000-000000000005';
const productId = '00000000-0000-4000-8000-000000000006';
const productRevisionId = '00000000-0000-4000-8000-000000000007';
const seenAt = '2026-09-26T12:00:00.000Z';

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
      story: { storyToken: 0, blocks: [] },
      selection: {
        category: null,
        materialTermIds: [],
        techniqueTermIds: [],
        materialTerms: [],
        techniqueTerms: [],
        proposals: [],
      },
    },
    hasBlockingListing: false,
    lastModerationReason: null,
  };
}

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let client: QueryClient;
beforeEach(() => {
  for (const fn of Object.values(h.admin)) fn.mockReset();
  h.params = {};
  h.back.mockReset();
  h.replace.mockReset();
  h.admin.listProductSummaries.mockResolvedValue({
    items: [],
    nextCursor: null,
  });
  h.admin.listSellerSummaries.mockResolvedValue({
    items: [],
    nextCursor: null,
  });
  h.admin.getProductHistory.mockResolvedValue({ events: [], nextCursor: null });
  h.admin.getSellerHistory.mockResolvedValue({ events: [], nextCursor: null });
  h.admin.updateProductStatus.mockResolvedValue({});
  h.admin.updateSellerStatus.mockResolvedValue({});
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  container.remove();
});
async function mount(node: ReactNode) {
  await act(async () =>
    root.render(createElement(QueryClientProvider, { client }, node)),
  );
}
async function waitFor(text: string) {
  await vi.waitFor(async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    expect(container.textContent).toContain(text);
  });
}
async function click(label: string, scope: ParentNode = container) {
  const button = Array.from(scope.querySelectorAll('button')).find(
    (b) => b.textContent === label,
  );
  expect(button).toBeTruthy();
  await act(async () => button!.click());
}
function workDetail() {
  const entity = pendingProduct();
  return {
    entity,
    publishedRevision: {
      ...entity.reviewTarget,
      id: '00000000-0000-4000-8000-000000000099',
      status: 'APPROVED',
      content: entity.parent,
    },
    reviewRevision: entity.reviewTarget,
    decisionTarget: {
      kind: 'revision',
      id: entity.reviewTarget.id,
      updatedAt: seenAt,
    },
  };
}
function authorDetail() {
  const entity = revisionSeller(seenAt);
  return {
    entity,
    publishedRevision: null,
    reviewRevision: entity.reviewTarget,
    decisionTarget: { kind: 'revision', id: revisionId, updatedAt: seenAt },
  };
}
describe('mobile moderation queue', () => {
  it('uses bounded summary cards without fetching details or legacy lists', async () => {
    h.admin.listProductSummaries.mockResolvedValue({
      items: [
        {
          id: productId,
          label: 'Queued work',
          parentStatus: 'APPROVED',
          reviewStatus: 'PENDING_REVIEW',
          submittedAt: null,
          card: {
            author: { fullName: 'Author', slug: 'author' },
            reviewKind: 'repeat',
            thumbnail: null,
          },
        },
      ],
      nextCursor: 'next',
    });
    await mount(createElement(AdminModerationScreen));
    await waitFor('Queued work');
    expect(h.admin.listProductSummaries).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 15,
        includeCard: true,
        filter: 'PENDING_REVIEW',
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(h.admin.getProductDetail).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Повторная проверка');
    expect(container.textContent).toContain('Дата отправки неизвестна');
    h.admin.listProductSummaries.mockRejectedValueOnce(new Error('offline'));
    await click('Загрузить ещё');
    await waitFor('Загруженные заявки сохранены');
    expect(container.textContent).toContain('Queued work');
    await click('Повторить загрузку');
    expect(h.admin.listProductSummaries.mock.calls.at(-1)?.[0].cursor).toBe(
      'next',
    );
  });
  it('restores route filter/search and keeps user controls reachable', async () => {
    h.params = { section: 'authors', filter: 'APPROVED', q: 'artist' };
    await mount(createElement(AdminModerationScreen));
    await waitFor('Заявок');
    expect(h.admin.listSellerSummaries.mock.calls[0]?.[0]).toMatchObject({
      filter: 'APPROVED',
      search: 'artist',
    });
    expect(container.textContent).toContain('могут иметь новую редакцию');
  });
  it('does not query an oversized search', async () => {
    h.params = { q: 'a'.repeat(201) };
    await mount(createElement(AdminModerationScreen));
    expect(h.admin.listProductSummaries).not.toHaveBeenCalled();
  });
  it('shows errors and retries the current queue', async () => {
    h.admin.listProductSummaries.mockRejectedValueOnce(new Error('offline'));
    await mount(createElement(AdminModerationScreen));
    await waitFor('error');
    await click('error');
    await waitFor('Заявок');
  });
});
describe('mobile moderation detail', () => {
  it('confirms one exact revision snapshot, blocks duplicate submissions and invalidates queues', async () => {
    const detail = workDetail();
    h.admin.getProductDetail.mockResolvedValue(detail);
    let finish: () => void = () => {
      throw new Error('not started');
    };
    h.admin.updateProductStatus.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    await mount(
      createElement(AdminModerationDetail, { id: productId, kind: 'products' }),
    );
    await waitFor('Pending work');
    await click('Одобрить');
    const dialog = container.querySelector('[role="dialog"]')!;
    await click('Подтвердить решение', dialog);
    await click('Подтвердить решение', dialog);
    expect(h.admin.updateProductStatus).toHaveBeenCalledTimes(1);
    expect(h.admin.updateProductStatus).toHaveBeenCalledWith(productId, {
      status: 'APPROVED',
      reason: undefined,
      target: detail.decisionTarget,
    });
    await act(async () => finish());
    await waitFor('Решение принято');
    await click('Назад');
    expect(h.back).toHaveBeenCalledOnce();
    expect(h.replace).not.toHaveBeenCalled();
    expect(h.admin.listProductSummaries).not.toHaveBeenCalled();
    expect(h.admin.listSellerSummaries).not.toHaveBeenCalled();
  });
  it('does not offer a repeated decision when accepted approval readback fails', async () => {
    const detail = workDetail();
    h.admin.getProductDetail
      .mockResolvedValueOnce(detail)
      .mockRejectedValue(new Error('offline'));
    await mount(
      createElement(AdminModerationDetail, { id: productId, kind: 'products' }),
    );
    await waitFor('Pending work');
    await click('Одобрить');
    await click('Подтвердить решение');
    await waitFor('Актуальный статус публикации не подтверждён');
    expect(container.textContent).not.toContain('Публикация обрабатывается');
    expect(
      Array.from(container.querySelectorAll('button')).find(
        (button) => button.textContent === 'Одобрить',
      ),
    ).toBeUndefined();
    expect(h.admin.updateProductStatus).toHaveBeenCalledOnce();
    h.admin.getProductDetail.mockResolvedValue({
      ...detail,
      entity: {
        ...detail.entity,
        publication: {
          id: revisionId,
          kind: 'PUBLISH',
          state: 'FAILED',
          attemptCount: 1,
        },
      },
    });
    await click('Обновить статус публикации');
    await waitFor('Доставка медиа не выполнена');
    expect(
      Array.from(container.querySelectorAll('button')).find(
        (button) => button.textContent === 'Одобрить',
      )!.disabled,
    ).toBe(false);
  });
  it.each(['products', 'authors'] as const)(
    'blocks new %s review decisions during media publication, then refreshes',
    async (kind) => {
      const detail = kind === 'products' ? workDetail() : authorDetail();
      const publication = {
        id: revisionId,
        kind: 'PUBLISH',
        state: 'PENDING',
        attemptCount: 0,
      };
      Object.assign(detail.entity, { publication });
      const read =
        kind === 'products'
          ? h.admin.getProductDetail
          : h.admin.getSellerDetail;
      read.mockImplementation(async () => structuredClone(detail));
      await mount(
        createElement(AdminModerationDetail, {
          id: kind === 'products' ? productId : sellerId,
          kind,
        }),
      );
      await waitFor('Публикация обрабатывается');
      for (const label of ['Одобрить', 'Исправления', 'Отклонить'])
        expect(
          Array.from(container.querySelectorAll('button')).find(
            (button) => button.textContent === label,
          ),
        ).toBeUndefined();
      publication.state = 'RUNNING';
      await click('Обновить статус публикации');
      await waitFor('Публикация обрабатывается');
      publication.state = 'DONE';
      Object.assign(detail.reviewRevision, { status: 'APPROVED' });
      await click('Обновить статус публикации');
      await vi.waitFor(() =>
        expect(container.textContent).not.toContain(
          'Публикация обрабатывается',
        ),
      );
      expect(h.admin.updateProductStatus).not.toHaveBeenCalled();
      expect(h.admin.updateSellerStatus).not.toHaveBeenCalled();
    },
  );
  it('keeps failed-publication retry and parent restoration available', async () => {
    const detail = workDetail();
    Object.assign(detail.entity, {
      parentStatus: 'ARCHIVED',
      publication: {
        id: revisionId,
        kind: 'PUBLISH',
        state: 'FAILED',
        attemptCount: 1,
      },
    });
    h.admin.getProductDetail.mockResolvedValue(detail);
    await mount(
      createElement(AdminModerationDetail, { id: productId, kind: 'products' }),
    );
    await waitFor('Pending work');
    expect(
      Array.from(container.querySelectorAll('button')).find(
        (button) => button.textContent === 'Одобрить',
      )!.disabled,
    ).toBe(false);
    await click('Восстановить публикацию');
    await click('Подтвердить решение');
    await waitFor('Решение принято');
    expect(h.admin.updateProductStatus).toHaveBeenCalledWith(
      productId,
      expect.objectContaining({
        target: { kind: 'parent', status: 'ARCHIVED', updatedAt: seenAt },
      }),
    );
  });
  it('does not block parent restoration while another publication is running', async () => {
    const detail = workDetail();
    Object.assign(detail.entity, {
      parentStatus: 'ARCHIVED',
      publication: {
        id: revisionId,
        kind: 'PUBLISH',
        state: 'RUNNING',
        attemptCount: 1,
      },
    });
    h.admin.getProductDetail.mockResolvedValue(detail);
    await mount(
      createElement(AdminModerationDetail, { id: productId, kind: 'products' }),
    );
    await waitFor('Публикация обрабатывается');
    await click('Восстановить публикацию');
    await click('Подтвердить решение');
    await waitFor('Решение принято');
    expect(h.admin.updateProductStatus).toHaveBeenCalledWith(
      productId,
      expect.objectContaining({
        target: { kind: 'parent', status: 'ARCHIVED', updatedAt: seenAt },
      }),
    );
  });
  it('retains reason on a conflict, requires refresh and never retries automatically', async () => {
    h.admin.getSellerDetail.mockResolvedValue(authorDetail());
    h.admin.updateSellerStatus.mockRejectedValue(
      new ApiClientError('stale', { kind: 'conflict', status: 409 }),
    );
    await mount(
      createElement(AdminModerationDetail, { id: sellerId, kind: 'authors' }),
    );
    await waitFor('Pending author');
    await click('Исправления');
    const input = container.querySelector(
      'input[aria-label="Причина решения"]',
    )!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )!.set!.call(input, 'Please clarify');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await click('Подтвердить решение');
    await waitFor('Причина сохранена');
    expect((input as HTMLInputElement).value).toBe('Please clarify');
    expect(h.admin.updateSellerStatus).toHaveBeenCalledTimes(1);
    await click('Обновить заявку');
    expect(h.admin.getSellerDetail.mock.calls.length).toBeGreaterThan(1);
  });
  it('uses parent restore even with a pending editing revision', async () => {
    const detail = workDetail();
    detail.entity.parentStatus = 'ARCHIVED';
    Object.assign(detail.reviewRevision.selection, {
      proposals: [{ selected: true, status: 'REJECTED', id: 'proposal' }],
    });
    h.admin.getProductDetail.mockResolvedValue(detail);
    await mount(
      createElement(AdminModerationDetail, { id: productId, kind: 'products' }),
    );
    await waitFor('Pending work');
    await click('Восстановить публикацию');
    await click('Подтвердить решение');
    await waitFor('Решение принято');
    expect(h.admin.updateProductStatus).toHaveBeenCalledWith(
      productId,
      expect.objectContaining({
        status: 'APPROVED',
        target: { kind: 'parent', status: 'ARCHIVED', updatedAt: seenAt },
      }),
    );
  });
  it.each(['author', 'proposal'])(
    'blocks approval for unresolved %s conditions',
    async (condition) => {
      const detail = workDetail();
      if (condition === 'author')
        detail.entity.sellerProfile.status = 'PENDING_REVIEW';
      else
        Object.assign(detail.reviewRevision.selection, {
          proposals: [{ selected: true, status: 'REJECTED', id: 'proposal' }],
        });
      h.admin.getProductDetail.mockResolvedValue(detail);
      await mount(
        createElement(AdminModerationDetail, {
          id: productId,
          kind: 'products',
        }),
      );
      await waitFor('Pending work');
      expect(
        Array.from(container.querySelectorAll('button')).find(
          (b) => b.textContent === 'Одобрить',
        )!.disabled,
      ).toBe(true);
      expect(h.admin.updateProductStatus).not.toHaveBeenCalled();
    },
  );
  it('keeps history distinct and pages with the returned cursor', async () => {
    h.admin.getProductDetail.mockResolvedValue(workDetail());
    h.admin.getProductHistory.mockResolvedValue({
      events: [
        {
          id: 'event',
          action: 'DECISION',
          createdAt: seenAt,
          actorUserId: null,
          revisionId: null,
          reason: 'reviewed',
          newStatus: 'APPROVED',
        },
      ],
      nextCursor: 'next',
    });
    await mount(
      createElement(AdminModerationDetail, { id: productId, kind: 'products' }),
    );
    await waitFor('Pending work');
    await click('История');
    await waitFor('reviewed');
    expect(container.textContent).toContain('неизвестна');
    await click('Ещё события');
    expect(h.admin.getProductHistory.mock.calls.at(-1)?.[1].cursor).toBe(
      'next',
    );
  });
});
describe('snapshot comparison', () => {
  it('compares fields without inventing a historical snapshot', () => {
    expect(moderationComparison(null, { title: 'New' })).toContainEqual({
      key: 'title',
      label: 'Название',
      before: 'Не указано',
      after: 'New',
      changed: true,
    });
  });
  it('distinguishes additions removals and reordering', () => {
    expect(
      moderationPhotoChanges(
        [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        [{ id: 'b' }, { id: 'a' }, { id: 'd' }],
      ),
    ).toEqual({
      added: [{ id: 'd' }],
      removed: [{ id: 'c' }],
      reordered: true,
    });
  });
  it('detects achievement date and image-only changes', () => {
    const a = {
      achievements: [
        {
          body: 'Exhibition',
          occurredDate: { year: 2026, month: 1, day: null },
          image: { checksum: 'a' },
        },
      ],
    };
    const b = {
      achievements: [
        {
          body: 'Exhibition',
          occurredDate: { year: 2026, month: 2, day: null },
          image: { checksum: 'b' },
        },
      ],
    };
    const field = moderationComparison(a, b).find(
      (f) => f.key === 'achievements',
    )!;
    expect(field.changed).toBe(true);
    expect(field.after).not.toContain('[object Object]');
  });
});

it('detects story-only changes and reordering while ignoring new row identifiers', () => {
  const a = {
    id: revisionId,
    position: 0,
    type: 'PARAGRAPH' as const,
    text: 'First',
  };
  const b = {
    id: productId,
    position: 1,
    type: 'PARAGRAPH' as const,
    text: 'Second',
  };
  expect(moderationStoryChanged([a], [{ ...a, id: productId }])).toBe(false);
  expect(moderationStoryChanged([a], [{ ...a, text: 'Changed' }])).toBe(true);
  expect(moderationStoryChanged([a, b], [b, a])).toBe(true);
});
