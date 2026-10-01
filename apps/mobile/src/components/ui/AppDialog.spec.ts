/**
 * @vitest-environment jsdom
 */
import { act, createElement, forwardRef, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });


function flattenStyle(style: unknown): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.map((item) => flattenStyle(item)));
  }
  if (typeof style === 'object') return style as Record<string, unknown>;
  return {};
}

vi.mock(
  '@rn-primitives/dialog',
  () => import('../../../node_modules/@rn-primitives/dialog/dist/dialog.web.mjs'),
);

if (typeof Element !== 'undefined') {
  Element.prototype.checkVisibility = () => true;
}

vi.mock('./app-dialog-layer', () => import('./app-dialog-layer.web'));

vi.mock('lucide-react-native', () => ({
  X: () => null,
}));

vi.mock('react-native-reanimated', () => {
  const ReduceMotion = { System: 'system' };
  function chain(name: string) {
    const record = { name, reduceMotion: undefined as unknown };
    const api = {
      duration() {
        return api;
      },
      easing() {
        return api;
      },
      reduceMotion(mode: unknown) {
        record.reduceMotion = mode;
        return api;
      },
      record,
    };
    return api;
  }

  return {
    default: {
      View: ({
        children,
        exiting,
      }: {
        children?: ReactNode;
        exiting?: { record?: { name?: string; reduceMotion?: unknown } };
      }) =>
        createElement(
          'div',
          {
            'data-animated': 'true',
            'data-exit': exiting?.record?.name ?? '',
            'data-exit-motion': String(exiting?.record?.reduceMotion ?? ''),
          },
          children,
        ),
    },
    Easing: { bezier: () => 'bezier' },
    FadeIn: chain('fade-in'),
    FadeOut: chain('fade-out'),
    LinearTransition: chain('linear'),
    ReduceMotion,
    SlideInDown: chain('slide-in'),
    SlideOutDown: chain('slide-out'),
  };
});

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  StyleSheet: {
    create<T>(styles: T) {
      return styles;
    },
    flatten: flattenStyle,
    absoluteFill: {},
  },
  useWindowDimensions: () => ({ width: 390, height: 844, scale: 1, fontScale: 1 }),
  AccessibilityInfo: {
    isReduceMotionEnabled: () => Promise.resolve(false),
    addEventListener: () => ({ remove() {} }),
  },
  View: forwardRef(function View(
    { children }: { children?: ReactNode },
    ref,
  ) {
    return createElement('div', { ref }, children);
  }),
  Text: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
  ScrollView: forwardRef(function ScrollView(
    { children }: { children?: ReactNode },
    ref,
  ) {
    return createElement('div', { ref }, children);
  }),
  Pressable: forwardRef(function Pressable(
    props: {
      children?: ReactNode | ((state: { pressed: boolean; hovered: boolean }) => ReactNode);
      accessibilityLabel?: string;
      accessibilityRole?: string;
      disabled?: boolean;
      onPress?: () => void;
    },
    ref,
  ) {
    return createElement(
      'button',
      {
        ref,
        type: 'button',
        'aria-label': props.accessibilityLabel,
        role: props.accessibilityRole,
        disabled: Boolean(props.disabled),
        onClick: () => {
          if (!props.disabled) props.onPress?.();
        },
      },
      typeof props.children === 'function'
        ? props.children({ pressed: false, hovered: false })
        : props.children,
    );
  }),
}));

import { AppDialog } from './AppDialog';

afterEach(async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

function mount(node: ReactNode) {
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return {
    container,
    render(next: ReactNode) {
      act(() => {
        root.render(next);
      });
    },
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
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function dialogByTitle(title: string) {
  return [...document.querySelectorAll('[role="dialog"]')].find((node) =>
    node.textContent?.includes(title),
  );
}

function closeButton(dialog: Element) {
  const button = dialog.querySelector('[aria-label="Закрыть окно"]');
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`missing close button for dialog`);
  }
  return button;
}

function dialogField(dialog: Element, label: string) {
  const field = [...dialog.querySelectorAll('input, button')].find(
    (node) => node.getAttribute('aria-label') === label || node.textContent === label,
  );
  if (!(field instanceof HTMLElement)) throw new Error(`missing ${label}`);
  return field;
}

function tab(target: Element, shiftKey = false) {
  act(() => {
    target.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
}

function dialogChildren() {
  return [
    createElement('input', { 'aria-label': 'Поле', key: 'field' }),
    createElement('button', { type: 'button', key: 'done' }, 'Готово'),
  ];
}

function ClosableDialog({
  presentation = 'dialog',
  title = 'Заголовок',
  closes,
}: {
  presentation?: 'dialog' | 'sheet';
  title?: string;
  closes: { count: number };
}) {
  const [open, setOpen] = useState(true);
  return createElement(AppDialog, {
    open,
    presentation,
    title,
    onClose: () => {
      closes.count += 1;
      setOpen(false);
    },
    children: dialogChildren(),
  });
}

describe('AppDialog web focus lifecycle', () => {
  it('focuses inside the opened dialog and cycles Tab without leaving it', async () => {
    const opener = document.createElement('button');
    opener.textContent = 'Открыть';
    document.body.append(opener);
    opener.focus();
    const view = mount(
      createElement(AppDialog, {
        open: true,
        title: 'Заголовок',
        onClose: () => undefined,
        children: dialogChildren(),
      }),
    );
    await flush();

    const dialog = dialogByTitle('Заголовок');
    if (!dialog) throw new Error('missing dialog');
    const close = closeButton(dialog);
    const field = dialogField(dialog, 'Поле');
    const done = dialogField(dialog, 'Готово');
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(close);

    tab(close, true);
    expect(document.activeElement).toBe(done);
    tab(done);
    expect(document.activeElement).toBe(close);
    field.focus();
    tab(field);
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(opener).not.toBe(document.activeElement);
    view.unmount();
  });

  it('returns focus to a connected opener once, without scrolling', async () => {
    const opener = document.createElement('button');
    opener.textContent = 'Открыть';
    document.body.append(opener);
    opener.focus();
    const scrollBefore = window.scrollY;
    const closes = { count: 0 };
    const view = mount(createElement(ClosableDialog, { closes }));
    await flush();
    const focus = vi.spyOn(opener, 'focus');
    const dialog = dialogByTitle('Заголовок');
    if (!dialog) throw new Error('missing dialog');

    act(() => {
      closeButton(dialog).click();
    });
    await flush();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 40));
    });

    expect(closes.count).toBe(1);
    expect(dialogByTitle('Заголовок')).toBeUndefined();
    expect(focus).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(opener);
    expect(window.scrollY).toBe(scrollBefore);
    view.unmount();
  });

  it('closes once from Escape and from an outside press', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const escapeCloses = { count: 0 };
    const escapeView = mount(createElement(ClosableDialog, { closes: escapeCloses, title: 'Escape' }));
    await flush();
    const escapeDialog = dialogByTitle('Escape');
    if (!escapeDialog) throw new Error('missing dialog');

    act(() => {
      escapeDialog.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      );
    });
    await flush();
    expect(escapeCloses.count).toBe(1);
    expect(dialogByTitle('Escape')).toBeUndefined();
    escapeView.unmount();

    const outsideCloses = { count: 0 };
    const outsideView = mount(
      createElement(ClosableDialog, { closes: outsideCloses, title: 'Outside' }),
    );
    await flush();
    opener.focus();
    act(() => {
      opener.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }),
      );
      opener.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    });
    await flush();
    expect(outsideCloses.count).toBe(1);
    expect(dialogByTitle('Outside')).toBeUndefined();
    outsideView.unmount();
  });

  it('keeps focus in a dialog that reopens before the close restore', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();

    function RapidDialog() {
      const [open, setOpen] = useState(true);
      return createElement(
        'div',
        null,
        createElement(
          'button',
          { type: 'button', onClick: () => setOpen(true) },
          'Снова',
        ),
        createElement(AppDialog, {
          open,
          title: 'Быстрый',
          onClose: () => setOpen(false),
          children: dialogChildren(),
        }),
      );
    }

    const view = mount(createElement(RapidDialog));
    await flush();
    const focus = vi.spyOn(opener, 'focus');
    const dialogBefore = dialogByTitle('Быстрый');
    if (!dialogBefore) throw new Error('missing dialog');
    const again = [...document.querySelectorAll('button')].find(
      (node) => node.textContent === 'Снова',
    );
    if (!(again instanceof HTMLButtonElement)) throw new Error('missing reopen');

    act(() => {
      closeButton(dialogBefore).click();
    });
    act(() => {
      again.click();
    });
    await flush();

    const dialog = dialogByTitle('Быстрый');
    if (!dialog) throw new Error('missing reopened dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(focus).not.toHaveBeenCalled();
    view.unmount();
  });

  it('focuses the second dialog instead of the first dialog control', async () => {
    function TwoDialogs() {
      const [second, setSecond] = useState(false);
      return createElement(
        'div',
        null,
        createElement(AppDialog, {
          open: true,
          title: 'Первый',
          onClose: () => undefined,
          children: createElement('input', { 'aria-label': 'Поле первого' }),
        }),
        createElement(AppDialog, {
          open: second,
          title: 'Второй',
          onClose: () => setSecond(false),
          children: createElement('input', { 'aria-label': 'Поле второго' }),
        }),
        createElement(
          'button',
          { type: 'button', onClick: () => setSecond(true) },
          'Открыть второй',
        ),
      );
    }

    const view = mount(createElement(TwoDialogs));
    await flush();
    const first = dialogByTitle('Первый');
    if (!first) throw new Error('missing first dialog');
    expect(first.contains(document.activeElement)).toBe(true);

    const openSecond = [...document.querySelectorAll('button')].find(
      (node) => node.textContent === 'Открыть второй',
    );
    if (!(openSecond instanceof HTMLButtonElement)) throw new Error('missing second opener');
    act(() => {
      openSecond.click();
    });
    await flush();

    const second = dialogByTitle('Второй');
    if (!second) throw new Error('missing second dialog');
    expect(second.contains(document.activeElement)).toBe(true);
    expect(first.contains(document.activeElement)).toBe(false);

    act(() => {
      closeButton(second).click();
    });
    await flush();
    expect(dialogByTitle('Второй')).toBeUndefined();
    expect(dialogByTitle('Первый')?.isConnected).toBe(true);
    expect(document.activeElement === null || document.body.contains(document.activeElement)).toBe(
      true,
    );
    view.unmount();
  });

  it('does not focus an opener that was removed before close', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const closes = { count: 0 };
    const view = mount(createElement(ClosableDialog, { closes, title: 'Снятый' }));
    await flush();
    opener.remove();
    const focus = vi.spyOn(opener, 'focus');
    const dialog = dialogByTitle('Снятый');
    if (!dialog) throw new Error('missing dialog');

    act(() => {
      closeButton(dialog).click();
    });
    await flush();

    expect(closes.count).toBe(1);
    expect(opener.isConnected).toBe(false);
    expect(focus).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(opener);
    view.unmount();
  });

  it('keeps the sheet exit animation, including reduced motion, on the close lifecycle', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const closes = { count: 0 };
    const view = mount(
      createElement(ClosableDialog, { closes, presentation: 'sheet', title: 'Лист' }),
    );
    await flush();

    const dialog = dialogByTitle('Лист');
    if (!dialog) throw new Error('missing sheet');
    const motion = dialog.closest('[data-animated="true"]');
    expect(motion?.getAttribute('data-exit')).toBe('slide-out');
    expect(motion?.getAttribute('data-exit-motion')).toBe('system');
    expect(dialog.contains(document.activeElement)).toBe(true);

    act(() => {
      closeButton(dialog).click();
    });
    await flush();

    expect(closes.count).toBe(1);
    expect(dialogByTitle('Лист')).toBeUndefined();
    expect(document.activeElement).toBe(opener);
    view.unmount();
  });

  it('does not search the document for another dialog control', async () => {
    const query = vi.spyOn(document, 'querySelector');
    const view = mount(
      createElement(AppDialog, {
        open: true,
        title: 'Поиск',
        onClose: () => undefined,
        children: dialogChildren(),
      }),
    );
    await flush();
    const dialog = dialogByTitle('Поиск');
    if (!dialog) throw new Error('missing dialog');
    tab(dialog);

    const dialogLookups = query.mock.calls.filter((call) =>
      String(call[0]).includes('role="dialog"'),
    );
    expect(dialogLookups).toEqual([]);
    view.unmount();
  });
});
