/** @vitest-environment jsdom */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
vi.mock('react-native', () => ({
  View: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
}));
vi.mock('../figma/FigmaSelectField', () => ({
  FigmaSelectField: ({
    label,
    value,
    disabled,
    onPress,
  }: {
    label: string;
    value: string;
    disabled?: boolean;
    onPress: () => void;
  }) =>
    createElement(
      'button',
      { onClick: onPress, disabled, 'aria-label': label },
      value,
    ),
}));
vi.mock('./AppDialog', () => ({
  AppDialog: ({
    open,
    title,
    children,
    onClose,
  }: {
    open: boolean;
    title: string;
    children: ReactNode;
    onClose: () => void;
  }) =>
    open
      ? createElement(
          'section',
          { role: 'dialog', 'aria-label': title },
          children,
          createElement('button', { onClick: onClose }, 'Закрыть'),
        )
      : null,
}));
vi.mock('./AppText', () => ({
  AppText: ({ children }: { children: ReactNode }) =>
    createElement('span', null, children),
}));
vi.mock('./Button', () => {
  const Button = ({
    label,
    onPress,
    disabled,
  }: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  }) => createElement('button', { onClick: onPress, disabled }, label);
  return { PrimaryButton: Button, SecondaryButton: Button };
});
vi.mock('./DateSelection', () => ({
  DateSelection: ({
    onChange,
  }: {
    onChange: (date: {
      year: number;
      month: number;
      day: number | null;
    }) => void;
  }) =>
    createElement(
      'div',
      null,
      createElement(
        'button',
        { onClick: () => onChange({ year: 2025, month: 3, day: null }) },
        'Месяц',
      ),
      createElement(
        'button',
        { onClick: () => onChange({ year: 2024, month: 2, day: 29 }) },
        'День',
      ),
    ),
}));

import { DateField } from './DateField';

const mounted: { root: Root; host: HTMLDivElement }[] = [];
afterEach(() => {
  for (const { root, host } of mounted.splice(0)) {
    act(() => root.unmount());
    host.remove();
  }
});
function mount(value = '') {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  mounted.push({ root, host });
  const change = vi.fn();
  const render = (next = value, editable = true) =>
    act(() =>
      root.render(
        createElement(DateField, {
          label: 'Дата',
          value: next,
          editable,
          onChangeText: change,
        }),
      ),
    );
  render();
  const click = (label: string) =>
    act(() => {
      const button = [...host.querySelectorAll('button')].find(
        (node) =>
          node.getAttribute('aria-label') === label ||
          node.textContent === label,
      );
      expect(button, label).toBeTruthy();
      button!.click();
    });
  return { host, change, render, click };
}

describe('shared date field', () => {
  it('keeps a selected candidate local until confirmed and preserves the value on cancel', () => {
    const view = mount('03.2025');
    view.click('Дата');
    view.click('День');
    expect(view.change).not.toHaveBeenCalled();
    view.click('Закрыть');
    expect(view.change).not.toHaveBeenCalled();
    view.click('Дата');
    expect(view.host.textContent).toContain('Выбрано: 03.2025');
  });
  it.each([
    ['Месяц', '03.2025'],
    ['День', '29.02.2024'],
  ])(
    'confirms %s without inventing a day or shifting the civil date',
    (candidate, expected) => {
      const view = mount();
      view.click('Дата');
      view.click(candidate);
      view.click('Выбрать');
      expect(view.change).toHaveBeenCalledExactlyOnceWith(expected);
      expect(view.host.querySelector('[role=dialog]')).toBeNull();
    },
  );
  it('clears only after the explicit clear action', () => {
    const view = mount('03.2025');
    view.click('Дата');
    view.click('Очистить дату');
    expect(view.change).toHaveBeenCalledExactlyOnceWith('');
  });
  it.each(['disabled', 'replaced'])(
    'discards an open candidate when the owner becomes %s',
    (condition) => {
      const view = mount('03.2025');
      view.click('Дата');
      view.click('День');
      view.render(
        condition === 'replaced' ? '04.2026' : '03.2025',
        condition !== 'disabled',
      );
      expect(view.host.querySelector('[role=dialog]')).toBeNull();
      expect(view.change).not.toHaveBeenCalled();
    },
  );
});
