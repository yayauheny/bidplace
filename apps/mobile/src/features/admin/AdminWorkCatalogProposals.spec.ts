/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ComponentProps, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { flush, setInput, waitFor } from '../../testing/dom';
import { AdminWorkCatalogProposals } from './AdminWorkCatalogProposals';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const harness = vi.hoisted(() => ({
  listTerms: vi.fn(),
  listCategories: vi.fn(),
  createCatalogTerm: vi.fn(),
  createCatalogCategory: vi.fn(),
  mapCatalogProposal: vi.fn(),
  rejectCatalogProposal: vi.fn(),
}));

vi.mock('react-native', () => ({
  View: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));
vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({
    catalog: { listTerms: harness.listTerms },
    categories: { list: harness.listCategories },
    admin: {
      createCatalogTerm: harness.createCatalogTerm,
      createCatalogCategory: harness.createCatalogCategory,
      mapCatalogProposal: harness.mapCatalogProposal,
      rejectCatalogProposal: harness.rejectCatalogProposal,
    },
  }),
}));
vi.mock('../../components/ui', () => {
  const Button = ({
    label, onPress, disabled,
  }: { label: string; onPress: () => void; disabled?: boolean }) =>
    createElement('button', { type: 'button', disabled, onClick: onPress }, label);
  return {
    AppText: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
    SecondaryButton: Button,
    DestructiveButton: Button,
    TextField: ({
      label, value, onChangeText,
    }: { label: string; value: string; onChangeText: (text: string) => void }) =>
      createElement('input', {
        'aria-label': label,
        value,
        onChange: (event: { target: { value: string } }) => onChangeText(event.target.value),
      }),
  };
});

const materialProposal = {
  id: '83333333-3333-4333-8333-333333333333',
  productRevisionId: '84444444-4444-4444-8444-444444444444',
  kind: 'MATERIAL' as const,
  rawName: 'Холст',
  normalizedName: 'холст',
  status: 'PENDING' as const,
  selected: true,
  mappedCategoryId: null,
  mappedTermId: null,
  rejectionReason: null,
  reviewedAt: null,
};

function mount(proposals: ComponentProps<typeof AdminWorkCatalogProposals>['proposals'] = [materialProposal]) {
  const el = document.createElement('div');
  document.body.append(el);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const root = createRoot(el);
  const changed = vi.fn();
  act(() => {
    root.render(
      createElement(QueryClientProvider, { client: queryClient },
        createElement(AdminWorkCatalogProposals, { proposals, onChanged: changed }),
      ),
    );
  });
  return {
    el, changed,
    cleanup() {
      act(() => root.unmount());
      queryClient.clear();
      el.remove();
    },
  };
}
function click(el: ParentNode, label: string) {
  const button = [...el.querySelectorAll<HTMLButtonElement>('button')].find(
    (item) => item.textContent === label,
  );
  if (!button) throw new Error(`Button not found: ${label}`);
  act(() => button.click());
}
beforeEach(() => {
  vi.clearAllMocks();
  harness.listTerms.mockResolvedValue({
    terms: [{
      id: '81111111-1111-4111-8111-111111111111',
      role: 'MATERIAL',
      slug: 'canvas',
      name: 'Холст',
      active: true,
    }],
  });
  harness.listCategories.mockResolvedValue({ categories: [] });
  harness.mapCatalogProposal.mockResolvedValue({ ok: true });
  harness.rejectCatalogProposal.mockResolvedValue({ ok: true });
  harness.createCatalogTerm.mockResolvedValue({
    term: { id: '82222222-2222-4222-8222-222222222222', role: 'MATERIAL' },
  });
  harness.createCatalogCategory.mockResolvedValue({
    category: { id: '82222222-2222-4222-8222-222222222222' },
  });
});
afterEach(() => document.body.replaceChildren());

describe('admin catalog proposal moderation', () => {
  it('maps a pending proposal to an existing term', async () => {
    const view = mount();
    click(view.el, 'Материал: Холст');
    await waitFor(() => expect(view.el.textContent).toContain('Сопоставить: Холст'));
    click(view.el, 'Сопоставить: Холст');
    await waitFor(() =>
      expect(harness.mapCatalogProposal).toHaveBeenCalledWith(
        materialProposal.id,
        { termId: '81111111-1111-4111-8111-111111111111' },
      ),
    );
    await waitFor(() => expect(view.changed).toHaveBeenCalledTimes(1));
    view.cleanup();
  });

  it('creates a new catalog term and maps it to the proposal', async () => {
    harness.listTerms.mockResolvedValueOnce({ terms: [] });
    const view = mount();
    click(view.el, 'Материал: Холст');
    await waitFor(() => expect(view.el.textContent).toContain('Создать «Холст» и сопоставить'));
    click(view.el, 'Создать «Холст» и сопоставить');
    await waitFor(() => expect(harness.createCatalogTerm).toHaveBeenCalledWith({
      role: 'MATERIAL',
      name: 'Холст',
    }));
    await waitFor(() => expect(harness.mapCatalogProposal).toHaveBeenCalledWith(
      materialProposal.id, { termId: '82222222-2222-4222-8222-222222222222' },
    ));
    view.cleanup();
  });

  it('rejects with a reason instead of silently dropping a pending proposal', async () => {
    const view = mount();
    click(view.el, 'Материал: Холст');
    setInput(view.el, 'Причина отклонения предложения', 'Уточните название');
    click(view.el, 'Отклонить предложение');
    await waitFor(() =>
      expect(harness.rejectCatalogProposal).toHaveBeenCalledWith(
        materialProposal.id, 'Уточните название',
      ),
    );
    view.cleanup();
  });

  it('does not display completed or deselected proposals', async () => {
    const view = mount([{ ...materialProposal, status: 'APPROVED' as const }]);
    await flush();
    expect(view.el.textContent).not.toContain('Предложения автора');
    view.cleanup();
  });
});
