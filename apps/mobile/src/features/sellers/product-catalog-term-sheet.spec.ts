/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ComponentProps, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setInput } from '../../testing/dom';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

vi.mock('react-native', () => ({
  View: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('../../components/figma/FilterSheet', () => ({
  FilterSheet: ({
    open,
    children,
    onClear,
    primaryAction,
  }: {
    open: boolean;
    children?: ReactNode;
    onClear?: () => void;
    primaryAction?: { onPress: () => void; disabled?: boolean };
  }) =>
    open
      ? createElement(
          'section',
          null,
          onClear ? createElement('button', { type: 'button', onClick: onClear }, 'Очистить') : null,
          children,
          createElement(
            'button',
            {
              type: 'button',
              onClick: primaryAction?.onPress,
              disabled: primaryAction?.disabled,
            },
            'Применить',
          ),
        )
      : null,
}));

vi.mock('../../components/figma/FilterSearchField', () => ({
  FilterSearchField: ({
    value,
    onChangeText,
    placeholder,
  }: {
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
  }) =>
    createElement('input', {
      'aria-label': placeholder,
      value,
      onChange: (event: { target: { value: string } }) => onChangeText(event.target.value),
    }),
}));

vi.mock('../../components/figma/FilterOptionRow', () => ({
  FilterOptionRow: ({
    label,
    selected,
    disabled,
    onPress,
  }: {
    label: string;
    selected: boolean;
    disabled?: boolean;
    onPress: () => void;
  }) =>
    createElement(
      'button',
      { type: 'button', disabled, onClick: onPress, 'aria-pressed': selected },
      label,
    ),
}));

vi.mock('../../components/figma/FigmaChoiceChip', () => ({
  FigmaChoiceChip: ({
    label,
    disabled,
    onRemove,
  }: {
    label: string;
    disabled: boolean;
    onRemove?: () => void;
  }) =>
    createElement('button', { type: 'button', disabled, onClick: onRemove }, label),
}));

vi.mock('../../components/ui', () => ({
  AppText: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
  SecondaryButton: ({
    label,
    onPress,
  }: {
    label: string;
    onPress: () => void;
  }) => createElement('button', { type: 'button', onClick: onPress }, label),
}));

import { ProductCatalogTermSheet } from './product-catalog-term-sheet';

const acrylic = {
  id: '81111111-1111-4111-8111-111111111111',
  role: 'MATERIAL' as const,
  slug: 'acrylic',
  name: 'Акрил',
  active: true,
};
const hiddenCanvas = {
  id: '82222222-2222-4222-8222-222222222222',
  role: 'MATERIAL' as const,
  slug: 'canvas',
  name: 'Холст',
  active: false,
};
const rejectedProposal = {
  id: '83333333-3333-4333-8333-333333333333',
  productRevisionId: '84444444-4444-4444-8444-444444444444',
  kind: 'MATERIAL' as const,
  rawName: 'Ткань',
  normalizedName: 'ткань',
  status: 'REJECTED' as const,
  selected: true,
  mappedCategoryId: null,
  mappedTermId: null,
  rejectionReason: 'Уточните состав',
  reviewedAt: null,
};

function mount(overrides: Partial<ComponentProps<typeof ProductCatalogTermSheet>> = {}) {
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  const onApply = vi.fn();
  const props: ComponentProps<typeof ProductCatalogTermSheet> = {
    role: 'MATERIAL',
    open: true,
    selectedIds: [],
    proposals: [],
    availableTerms: [acrylic],
    knownTerms: [],
    knownProposals: [],
    loading: false,
    error: false,
    editable: true,
    onRetry: () => undefined,
    onClose: () => undefined,
    onApply,
    ...overrides,
  };
  act(() => {
    root.render(createElement(ProductCatalogTermSheet, props));
  });
  return {
    container,
    onApply,
    unmount() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

function click(container: ParentNode, name: string) {
  const button = [...container.querySelectorAll<HTMLButtonElement>('button')].find(
    (item) => item.textContent === name,
  );
  if (!button) throw new Error(`Missing button ${name}`);
  act(() => button.click());
}

afterEach(() => document.body.replaceChildren());

describe('Work catalog term picker', () => {
  it('does not offer an existing active term as a new proposal', () => {
    const view = mount();
    setInput(view.container, 'Поиск или новое значение', ' АКРИЛ ');
    expect(view.container.textContent).not.toContain('Предложить «АКРИЛ»');
    click(view.container, 'Акрил');
    click(view.container, 'Применить');
    expect(view.onApply).toHaveBeenCalledWith([acrylic.id], []);
    view.unmount();
  });

  it('does not propose a previously selected hidden term again', () => {
    const view = mount({ selectedIds: [hiddenCanvas.id], knownTerms: [hiddenCanvas] });
    setInput(view.container, 'Поиск или новое значение', 'Холст');
    expect(view.container.textContent).not.toContain('Предложить «Холст»');
    click(view.container, 'Применить');
    expect(view.onApply).toHaveBeenCalledWith([hiddenCanvas.id], []);
    view.unmount();
  });

  it('replaces a pending proposal when the matching directory term is selected', () => {
    const view = mount({ proposals: ['Акрил'] });
    click(view.container, 'Акрил');
    click(view.container, 'Применить');
    expect(view.onApply).toHaveBeenCalledWith([acrylic.id], []);
    view.unmount();
  });

  it('shows a rejection reason and allows the author to remove the proposal', () => {
    const view = mount({ proposals: ['Ткань'], knownProposals: [rejectedProposal] });
    expect(view.container.textContent).toContain('Отклонено: Уточните состав');
    click(view.container, 'Ткань');
    click(view.container, 'Применить');
    expect(view.onApply).toHaveBeenCalledWith([], []);
    view.unmount();
  });

  it('allows removing a previously selected value even if the directory is offline', () => {
    const view = mount({
      error: true,
      selectedIds: [hiddenCanvas.id],
      knownTerms: [hiddenCanvas],
    });
    click(view.container, 'Очистить');
    click(view.container, 'Применить');
    expect(view.onApply).toHaveBeenCalledWith([], []);
    view.unmount();
  });

  it('disables apply and clear in read-only mode', () => {
    const view = mount({ editable: false, selectedIds: [acrylic.id] });
    expect(view.container.textContent).not.toContain('Очистить');
    const apply = [...view.container.querySelectorAll<HTMLButtonElement>('button')].find(
      (button) => button.textContent === 'Применить',
    );
    expect(apply?.disabled).toBe(true);
    view.unmount();
  });
});
