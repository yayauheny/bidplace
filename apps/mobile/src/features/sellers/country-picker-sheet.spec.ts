/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { flush, setInput } from '../../testing/dom';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const harness = vi.hoisted(() => ({
  list: vi.fn(),
}));

vi.mock('react-native', () => ({
  View: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
}));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({ countries: { list: harness.list } }),
}));

vi.mock('../../components/figma/FilterSheet', () => ({
  FilterSheet: ({
    open,
    title,
    children,
  }: {
    open: boolean;
    title: string;
    children?: ReactNode;
  }) =>
    open ? createElement('section', { 'aria-label': title }, children) : null,
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
      onChange: (event: { target: { value: string } }) =>
        onChangeText(event.target.value),
    }),
}));

vi.mock('../../components/figma/FilterOptionRow', () => ({
  FilterOptionRow: ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) =>
    createElement(
      'button',
      {
        type: 'button',
        role: 'radio',
        'aria-checked': selected,
        onClick: onPress,
      },
      label,
    ),
}));

vi.mock('../../components/ui', () => ({
  AppText: ({ children }: { children?: ReactNode }) =>
    createElement('span', null, children),
  SecondaryButton: ({
    label,
    onPress,
  }: {
    label: string;
    onPress?: () => void;
  }) => createElement('button', { type: 'button', onClick: onPress }, label),
}));

import { CountryPickerSheet } from './country-picker-sheet';

const directory = {
  countries: [
    { code: 'BY', name: 'Беларусь' },
    { code: 'PL', name: 'Польша' },
  ],
};

function mount(
  options: {
    open?: boolean;
    selectedCode?: string;
    onSelect?: (code: string) => void;
  } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  const onSelect = options.onSelect ?? vi.fn();
  act(() => {
    root.render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(CountryPickerSheet, {
          open: options.open ?? true,
          selectedCode: options.selectedCode ?? '',
          onClose: () => undefined,
          onSelect,
        }),
      ),
    );
  });
  return {
    container,
    onSelect,
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

function radio(container: ParentNode, name: string) {
  const target = [
    ...container.querySelectorAll<HTMLButtonElement>('button[role="radio"]'),
  ].find((button) => button.textContent === name);
  if (!target) throw new Error(`Missing country ${name}`);
  return target;
}

beforeEach(() => {
  harness.list.mockReset();
  harness.list.mockResolvedValue(directory);
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('country picker sheet', () => {
  it('lists the directory names and requests the trimmed search with the abort signal', async () => {
    const view = mount();
    await flush();
    expect(harness.list).toHaveBeenLastCalledWith(
      '',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(radio(view.container, 'Беларусь')).toBeInstanceOf(HTMLButtonElement);
    expect(radio(view.container, 'Польша')).toBeInstanceOf(HTMLButtonElement);

    setInput(view.container, 'Поиск', '  бел ');
    await flush();
    expect(harness.list).toHaveBeenLastCalledWith(
      'бел',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    view.unmount();
  });

  it('sends the ISO code of the picked country and marks the stored one as selected', async () => {
    const view = mount({ selectedCode: 'PL' });
    await flush();
    expect(radio(view.container, 'Польша').getAttribute('aria-checked')).toBe(
      'true',
    );
    act(() => {
      radio(view.container, 'Беларусь').click();
    });
    expect(view.onSelect).toHaveBeenCalledWith('BY');
    view.unmount();
  });

  it('shows the empty state when the search matches nothing', async () => {
    harness.list.mockResolvedValue({ countries: [] });
    const view = mount();
    await flush();
    expect(view.container.textContent).toContain('Ничего не найдено');
    view.unmount();
  });

  it('offers a retry after a failed directory request', async () => {
    harness.list.mockRejectedValueOnce(new Error('offline'));
    const view = mount();
    await flush();
    await flush();
    expect(view.container.textContent).toContain('Не удалось загрузить страны');
    const retry = [...view.container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Повторить',
    );
    expect(retry).toBeInstanceOf(HTMLButtonElement);
    act(() => {
      retry?.click();
    });
    await flush();
    expect(harness.list).toHaveBeenCalledTimes(2);
    expect(radio(view.container, 'Беларусь')).toBeInstanceOf(HTMLButtonElement);
    view.unmount();
  });

  it('does not request the directory while closed', async () => {
    const view = mount({ open: false });
    await flush();
    expect(harness.list).not.toHaveBeenCalled();
    view.unmount();
  });
});
