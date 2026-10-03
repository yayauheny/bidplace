/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { flush } from '../../testing/dom';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const productId = '11111111-1111-4111-8111-111111111111';
const categoryId = '33333333-3333-4333-8333-333333333333';

const harness = vi.hoisted(() => ({
  listCategories: vi.fn(),
  getProduct: vi.fn(),
  updateProduct: vi.fn(),
  getMyProfile: vi.fn(),
  listCabinetWorks: vi.fn(),
  publicReads: { count: 0 },
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  View: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({ replace: vi.fn(), setParams: vi.fn(), push: vi.fn() }),
  useNavigation: () => ({ dispatch: vi.fn() }),
  Link: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('expo-router/build/react-navigation/core', () => ({
  usePreventRemove: () => undefined,
}));

vi.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: vi.fn(),
}));

vi.mock('../../providers/auth-provider', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isAdmin: false,
    logout: vi.fn(),
    user: { email: 'author@example.com', emailVerifiedAt: '2026-09-27T00:00:00.000Z', role: 'user' },
  }),
}));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({
    categories: { list: harness.listCategories },
    sellers: { getProduct: harness.getProduct, getMyProfile: harness.getMyProfile },
    products: { create: vi.fn(), update: harness.updateProduct, submit: vi.fn() },
    images: { add: vi.fn(), remove: vi.fn(), reorder: vi.fn() },
    portfolio: { listCabinetWorks: harness.listCabinetWorks },
  }),
}));

vi.mock('../auth/AccountLogoutButton', () => ({
  AccountLogoutButton: () => createElement('button', { type: 'button' }, 'Выйти'),
}));

vi.mock('../../components/layout', () => ({
  AppShell: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  FormPageShell: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  FormPageColumns: ({ children, sidebar }: { children?: ReactNode; sidebar?: ReactNode }) =>
    createElement('div', null, sidebar, children),
}));

vi.mock('../../components/shared/InfrastructurePageStatus', () => ({
  InfrastructurePageStatus: () => null,
}));

vi.mock('../../components/ui', () => {
  function PressButton({ label, onPress, disabled }: { label: string; onPress?: () => void; disabled?: boolean }) {
    return createElement('button', { type: 'button', disabled: Boolean(disabled), onClick: () => { if (!disabled) onPress?.(); } }, label);
  }
  return {
    AppDialog: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
    AppText: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
    DestructiveButton: PressButton,
    FormSection: ({ children }: { children?: ReactNode }) => createElement('section', null, children),
    ImagePlaceholder: ({ label }: { label: string }) => createElement('div', null, label),
    PageHeader: ({ title }: { title: string }) => createElement('h1', null, title),
    PageState: () => null,
    PrimaryButton: PressButton,
    SecondaryButton: PressButton,
    TextButton: PressButton,
    ResilientRemoteImage: ({ accessibilityLabel }: { accessibilityLabel?: string }) =>
      createElement('div', null, accessibilityLabel),
    TextField: ({ label, value, onChangeText }: { label: string; value?: string; onChangeText?: (value: string) => void }) =>
      createElement('input', {
        'aria-label': label,
        value: value ?? '',
        onChange: (event: { target: { value: string } }) => onChangeText?.(event.target.value),
      }),
  };
});

import { AuthorCabinetScreen } from './author-cabinet-screen';
import { ProductDraftScreen } from './product-draft-screen';

function PublicProbe() {
  const query = useQuery({
    queryKey: ['portfolio-works'],
    queryFn: async () => {
      harness.publicReads.count += 1;
      return { marker: true };
    },
  });
  return createElement('div', { 'data-public': query.data?.marker ? 'yes' : 'no' });
}

function product() {
  return {
    id: productId,
    publicId: 'draftwork01',
    sellerProfileId: '44444444-4444-4444-8444-444444444444',
    categoryId,
    title: 'Saved title',
    story: '',
    technique: 'Oil',
    materials: '',
    dimensions: '',
    weight: null,
    year: null,
    condition: null,
    uniqueness: '',
    provenance: null,
    city: null,
    packaging: null,
    deliveryInfo: null,
    publishedAt: null,
    status: 'DRAFT',
    images: [],
    createdAt: '2026-09-27T00:00:00.000Z',
    updatedAt: '2026-09-28T00:00:00.000Z',
  };
}

function cabinetWork(status: 'DRAFT' | 'PENDING_REVIEW') {
  return {
    id: productId,
    publicId: 'draftwork01',
    title: status === 'DRAFT' ? 'Saved title' : 'Normalized title',
    status,
    editingRevisionStatus: status === 'DRAFT' ? 'DRAFT' : null,
    updatedAt: '2026-09-28T00:00:00.000Z',
    moderationMessage: status === 'PENDING_REVIEW' ? 'Проверьте подпись' : null,
    coverImage: status === 'PENDING_REVIEW'
      ? {
          id: '55555555-5555-4555-8555-555555555555',
          position: 0,
          url: '/api/images/55555555-5555-4555-8555-555555555555',
          mimeType: 'image/png',
          byteLength: 4,
          checksum: 'a'.repeat(64),
          width: null,
          height: null,
        }
      : null,
  };
}

function mount() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(['user', 'me'], { id: 'user-a' });
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(PublicProbe),
        createElement(AuthorCabinetScreen),
        createElement(ProductDraftScreen, { productId }),
      ),
    );
  });
  return {
    container,
    queryClient,
    unmount() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

async function until(container: HTMLElement, predicate: () => boolean, label: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (predicate()) return;
    await flush();
  }
  throw new Error(`Timed out waiting for ${label}. Body: ${container.textContent}`);
}

beforeEach(() => {
  harness.publicReads.count = 0;
  harness.listCategories.mockReset();
  harness.getProduct.mockReset();
  harness.updateProduct.mockReset();
  harness.getMyProfile.mockReset();
  harness.listCabinetWorks.mockReset();
  harness.listCategories.mockResolvedValue({
    categories: [{ id: categoryId, slug: 'painting', name: 'Painting' }],
  });
  harness.getProduct.mockResolvedValue({
    product: product(),
    editingRevision: {
      id: '22222222-2222-4222-8222-222222222222',
      version: 1,
      status: 'DRAFT',
      updatedAt: '2026-09-27T00:00:00.000Z',
    },
    creationIntro: null,
    creationSteps: [],
    lastModerationReason: null,
  });
  harness.getMyProfile.mockResolvedValue({
    sellerProfile: {
      id: '44444444-4444-4444-8444-444444444444',
      slug: 'author',
      fullName: 'Author Name',
      status: 'APPROVED',
      updatedAt: '2026-09-27T00:00:00.000Z',
    },
    editingRevision: null,
  });
  let cabinetCalls = 0;
  harness.listCabinetWorks.mockImplementation(async () => {
    cabinetCalls += 1;
    return {
      works: [cabinetWork(cabinetCalls === 1 ? 'DRAFT' : 'PENDING_REVIEW')],
      pagination: { page: 1, limit: 20, total: 1 },
    };
  });
  harness.updateProduct.mockResolvedValue({ product: product() });
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('owner work cache', () => {
  it('updates the retained cabinet after a work save without touching public queries', async () => {
    let resolveSave: (value: { product: ReturnType<typeof product> }) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () => view.container.textContent?.includes('Черновик') === true
        && [...view.container.querySelectorAll('button')].some((button) => button.textContent === 'Сохранить изменения'),
      'cabinet and editor',
    );
    const publicReads = harness.publicReads.count;
    const save = [...view.container.querySelectorAll('button')].find((button) => button.textContent === 'Сохранить изменения');
    act(() => save?.click());
    await flush();
    await act(async () => {
      resolveSave({ product: { ...product(), title: 'Normalized title', status: 'PENDING_REVIEW' } });
      await Promise.resolve();
    });
    await until(view.container, () => view.container.textContent?.includes('На модерации') === true, 'cabinet status');
    expect(view.container.textContent).toContain('Normalized title');
    expect(view.container.textContent).toContain('Проверьте подпись');
    expect(view.container.textContent).toContain('Normalized title');
    expect(view.container.textContent).not.toContain('Обложка работы не добавлена');
    expect(harness.publicReads.count).toBe(publicReads);
    expect(view.queryClient.getQueryData(['portfolio-works'])).toEqual({ marker: true });
    view.unmount();
  });

  it('does not refetch the cabinet after the session is cleared', async () => {
    let resolveSave: (value: { product: ReturnType<typeof product> }) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () => view.container.textContent?.includes('Черновик') === true,
      'cabinet',
    );
    const reads = harness.listCabinetWorks.mock.calls.length;
    view.queryClient.setQueryData(['user', 'me'], null);
    const save = [...view.container.querySelectorAll('button')].find((button) => button.textContent === 'Сохранить изменения');
    act(() => save?.click());
    await flush();
    await act(async () => {
      resolveSave({ product: { ...product(), status: 'PENDING_REVIEW' } });
      await Promise.resolve();
    });
    await flush();
    expect(harness.listCabinetWorks.mock.calls.length).toBe(reads);
    expect(view.container.textContent).toContain('Черновик');
    expect(view.container.textContent).not.toContain('На модерации');
    view.unmount();
  });
});
