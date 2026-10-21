/**
 * @vitest-environment jsdom
 */
import {
  act,
  createElement,
  forwardRef,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../../providers/theme-provider';
import { SheetBackdropProvider } from './sheet-backdrop';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const motionCalls = vi.hoisted(() => ({
  timings: [] as Array<{ value: number; config: { reduceMotion?: unknown } }>,
}));
vi.mock('react-native-worklets', () => ({
  scheduleOnRN: (fn: () => void) => fn(),
}));

vi.mock('./SheetDragSurface', () => import('./SheetDragSurface.web'));
vi.mock('./sheet-backdrop-layer', () => import('./sheet-backdrop-layer.web'));

vi.mock('expo-router', () => ({
  DefaultTheme: {
    colors: {
      background: '',
      card: '',
      primary: '',
      border: '',
      text: '',
      notification: '',
    },
  },
  ThemeProvider: ({ children }: { children?: unknown }) => children,
}));

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
  () =>
    import('../../../node_modules/@rn-primitives/dialog/dist/dialog.web.mjs'),
);

if (typeof Element !== 'undefined') {
  Element.prototype.checkVisibility = () => true;
}

vi.mock('./app-dialog-layer', () => import('./app-dialog-layer.web'));

vi.mock('../figma/FigmaIcon', () => ({
  FigmaIcon: () => null,
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
      withCallback() {
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
    useSharedValue: (value: number) => useRef({ value }).current,
    useAnimatedStyle: (style: () => object) => style(),
    cancelAnimation: () => undefined,
    withTiming: (
      value: number,
      config: { reduceMotion?: unknown },
      callback?: (finished: boolean) => void,
    ) => {
      motionCalls.timings.push({ value, config });
      if (callback) queueMicrotask(() => callback(true));
      return value;
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
  useWindowDimensions: () => ({
    width: 390,
    height: 844,
    scale: 1,
    fontScale: 1,
  }),
  AccessibilityInfo: {
    isReduceMotionEnabled: () => Promise.resolve(false),
    addEventListener: () => ({ remove() {} }),
  },
  View: forwardRef(function View(
    { children, style }: { children?: ReactNode; style?: unknown },
    ref,
  ) {
    return createElement(
      'div',
      { ref, style: flattenStyle(style) as React.CSSProperties },
      children,
    );
  }),
  Text: ({ children }: { children?: ReactNode }) =>
    createElement('span', null, children),
  ScrollView: forwardRef(function ScrollView(
    {
      children,
      style,
      contentContainerStyle,
    }: {
      children?: ReactNode;
      style?: unknown;
      contentContainerStyle?: unknown;
    },
    ref,
  ) {
    return createElement(
      'div',
      { ref, style: flattenStyle(style) as React.CSSProperties },
      createElement(
        'div',
        {
          style: flattenStyle(contentContainerStyle) as React.CSSProperties,
        },
        children,
      ),
    );
  }),
  Pressable: forwardRef(function Pressable(
    props: {
      children?:
        | ReactNode
        | ((state: { pressed: boolean; hovered: boolean }) => ReactNode);
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
    (node) =>
      node.getAttribute('aria-label') === label || node.textContent === label,
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

function MediaSheetDialog({ closes }: { closes: { count: number } }) {
  const [open, setOpen] = useState(true);
  return createElement(AppDialog, {
    open,
    presentation: 'mediaSheet',
    title: 'Медиа',
    media: createElement('img', { alt: '', src: 'collage.png' }),
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
    const escapeView = mount(
      createElement(ClosableDialog, { closes: escapeCloses, title: 'Escape' }),
    );
    await flush();
    const escapeDialog = dialogByTitle('Escape');
    if (!escapeDialog) throw new Error('missing dialog');

    act(() => {
      escapeDialog.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    await flush();
    expect(escapeCloses.count).toBe(1);
    expect(dialogByTitle('Escape')).toBeUndefined();
    escapeView.unmount();

    const outsideCloses = { count: 0 };
    const outsideView = mount(
      createElement(ClosableDialog, {
        closes: outsideCloses,
        title: 'Outside',
      }),
    );
    await flush();
    opener.focus();
    act(() => {
      opener.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      opener.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }),
      );
    });
    await flush();
    expect(outsideCloses.count).toBe(1);
    expect(dialogByTitle('Outside')).toBeUndefined();
    outsideView.unmount();
  });

  it.each(['dialog', 'sheet'] as const)(
    'keeps focus in a dialog that reopens before the close restore (%s)',
    async (presentation) => {
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
            presentation,
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
      if (!(again instanceof HTMLButtonElement))
        throw new Error('missing reopen');

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
    },
  );

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
    if (!(openSecond instanceof HTMLButtonElement))
      throw new Error('missing second opener');
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
    expect(
      document.activeElement === null ||
        document.body.contains(document.activeElement),
    ).toBe(true);
    view.unmount();
  });

  it('does not focus an opener that was removed before close', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const closes = { count: 0 };
    const view = mount(
      createElement(ClosableDialog, { closes, title: 'Снятый' }),
    );
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

  it('keeps the media sheet on the shared focus, Escape, and return-focus lifecycle', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const closes = { count: 0 };
    const view = mount(createElement(MediaSheetDialog, { closes }));
    await flush();
    const dialog = dialogByTitle('Медиа');
    if (!dialog) throw new Error('missing dialog');
    expect(dialog.querySelector('img')).not.toBeNull();
    expect(document.activeElement).toBe(closeButton(dialog));

    act(() => {
      dialog.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    await flush();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 40));
    });
    expect(closes.count).toBe(1);
    expect(dialogByTitle('Медиа')).toBeUndefined();
    expect(document.activeElement).toBe(opener);
    view.unmount();
  });

  it('keeps the sheet exit animation, including reduced motion, on the close lifecycle', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const closes = { count: 0 };
    const view = mount(
      createElement(ClosableDialog, {
        closes,
        presentation: 'sheet',
        title: 'Лист',
      }),
    );
    await flush();

    const dialog = dialogByTitle('Лист');
    if (!dialog) throw new Error('missing sheet');
    const motion = dialog.closest('[data-animated="true"]');
    expect(motion).not.toBeNull();
    expect(dialog.contains(document.activeElement)).toBe(true);

    act(() => {
      closeButton(dialog).click();
    });
    await flush();

    expect(
      motionCalls.timings.some(
        ({ value, config }) =>
          value === 844 && config.reduceMotion === 'system',
      ),
    ).toBe(true);
    expect(closes.count).toBe(1);
    expect(dialogByTitle('Лист')).toBeUndefined();
    await vi.waitFor(() => expect(document.activeElement).toBe(opener));
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

  it.each(['dialog', 'sheet'] as const)(
    'returns focus to the original opener after a rapid reopen and a second close (%s)',
    async (presentation) => {
      const opener = document.createElement('button');
      opener.textContent = 'Исходный';
      document.body.append(opener);
      opener.focus();
      const props = {
        presentation,
        title: 'Повтор',
        onClose: () => undefined,
        children: dialogChildren(),
      };
      const view = mount(createElement(AppDialog, { ...props, open: true }));
      await flush();
      const focus = vi.spyOn(opener, 'focus');

      view.render(createElement(AppDialog, { ...props, open: false }));
      view.render(createElement(AppDialog, { ...props, open: true }));
      await flush();

      const reopened = dialogByTitle('Повтор');
      if (!reopened) throw new Error('missing reopened dialog');
      expect(reopened.contains(document.activeElement)).toBe(true);
      expect(focus).not.toHaveBeenCalled();

      view.render(createElement(AppDialog, { ...props, open: false }));
      await flush();
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 80));
      });

      expect(document.activeElement).toBe(opener);
      expect(focus).toHaveBeenCalledTimes(1);
      expect(focus).toHaveBeenCalledWith({ preventScroll: true });
      view.unmount();
    },
  );

  it('returns focus to a live opener when an open dialog unmounts', async () => {
    const opener = document.createElement('button');
    opener.textContent = 'Исходный';
    document.body.append(opener);
    opener.focus();
    const view = mount(
      createElement(AppDialog, {
        open: true,
        title: 'Снятие',
        onClose: () => undefined,
        children: dialogChildren(),
      }),
    );
    await flush();
    const focus = vi.spyOn(opener, 'focus');

    view.render(null);
    await flush();

    expect(opener.isConnected).toBe(true);
    expect(dialogByTitle('Снятие')).toBeUndefined();
    expect(document.activeElement).toBe(opener);
    expect(focus).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    view.unmount();
  });

  it('returns focus to a new opener after a completed close and a later cycle', async () => {
    const first = document.createElement('button');
    first.textContent = 'Первый opener';
    const second = document.createElement('button');
    second.textContent = 'Второй opener';
    document.body.append(first, second);
    first.focus();
    const props = {
      title: 'Смена',
      onClose: () => undefined,
      children: dialogChildren(),
    };
    const view = mount(createElement(AppDialog, { ...props, open: true }));
    await flush();

    view.render(createElement(AppDialog, { ...props, open: false }));
    await flush();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 40));
    });
    expect(document.activeElement).toBe(first);

    second.focus();
    const secondFocus = vi.spyOn(second, 'focus');
    view.render(createElement(AppDialog, { ...props, open: true }));
    await flush();
    const dialog = dialogByTitle('Смена');
    if (!dialog) throw new Error('missing dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);

    view.render(createElement(AppDialog, { ...props, open: false }));
    await flush();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 40));
    });

    expect(document.activeElement).toBe(second);
    expect(document.activeElement).not.toBe(first);
    expect(secondFocus).toHaveBeenCalledTimes(1);
    expect(secondFocus).toHaveBeenCalledWith({ preventScroll: true });
    view.unmount();
  });

  it('re-themes the mounted dialog surface without remounting', async () => {
    const rgbOf = (hex: string) => {
      const value = hex.replace('#', '');
      const channels = [0, 2, 4].map((offset) =>
        parseInt(value.slice(offset, offset + 2), 16),
      );
      return `rgb(${channels.join(', ')})`;
    };
    function Themed({ theme }: { theme: 'light' | 'black' }) {
      return createElement(ThemeProvider, {
        theme,
        children: createElement(AppDialog, {
          open: true,
          title: 'Тема',
          onClose: () => undefined,
          children: dialogChildren(),
        }),
      });
    }
    const view = mount(createElement(Themed, { theme: 'light' }));
    await flush();

    const dialog = dialogByTitle('Тема');
    if (!dialog) throw new Error('missing dialog');
    const surfaceOf = (root: Element) =>
      [...root.querySelectorAll('div')].find(
        (node) =>
          (node as HTMLElement).style.backgroundColor === rgbOf('#FFFFFF'),
      ) as HTMLElement | undefined;
    const lightSurface = surfaceOf(dialog);
    if (!lightSurface) throw new Error('missing light dialog surface');

    view.render(createElement(Themed, { theme: 'black' }));
    await flush();

    const blackSurface = [...dialog.querySelectorAll('div')].find(
      (node) =>
        (node as HTMLElement).style.backgroundColor === rgbOf('#1C1C1C'),
    ) as HTMLElement | undefined;
    expect(blackSurface).toBe(lightSurface);
    expect(lightSurface.style.backgroundColor).toBe(rgbOf('#1C1C1C'));
    view.unmount();
  });
});

describe('shared sheet backdrop lifecycle', () => {
  it('keeps one dimmer through handoff and removes it after the last sheet closes', async () => {
    const flow = (active: 'first' | 'second' | null) =>
      createElement(
        SheetBackdropProvider,
        null,
        ...(['first', 'second'] as const).map((id) =>
          createElement(AppDialog, {
            key: id,
            presentation: 'sheet',
            open: active === id,
            title: id,
            onClose: () => undefined,
            children: dialogChildren(),
          }),
        ),
      );
    const view = mount(flow('first'));
    await flush();
    const dimmer = document.querySelector('#sheet-backdrop > [data-animated]');
    expect(dimmer).not.toBeNull();
    view.render(flow('second'));
    await flush();
    expect(document.querySelector('#sheet-backdrop > [data-animated]')).toBe(
      dimmer,
    );
    view.render(flow(null));
    await flush();
    expect(document.querySelector('#sheet-backdrop')?.childElementCount).toBe(
      0,
    );
    view.render(flow('first'));
    await flush();
    expect(
      document.querySelector('#sheet-backdrop > [data-animated]'),
    ).not.toBeNull();
    view.unmount();
    expect(document.querySelector('#sheet-backdrop')).toBeNull();
  });
});

it('returns focus inside a still-open parent dialog instead of its outer trigger', async () => {
  const outer = document.createElement('button');
  document.body.append(outer);
  outer.focus();
  function NestedDialogs() {
    const [childOpen, setChildOpen] = useState(false);
    return createElement(
      'div',
      null,
      createElement(AppDialog, {
        open: true,
        title: 'Родитель',
        onClose: () => undefined,
        children: createElement(
          'button',
          { type: 'button', onClick: () => setChildOpen(true) },
          'Открыть вложенный',
        ),
      }),
      createElement(AppDialog, {
        open: childOpen,
        title: 'Вложенный',
        onClose: () => setChildOpen(false),
        children: dialogChildren(),
      }),
    );
  }
  const view = mount(createElement(NestedDialogs));
  await flush();
  const opener = [
    ...(dialogByTitle('Родитель')?.querySelectorAll('button') ?? []),
  ].find((node) => node.textContent === 'Открыть вложенный');
  if (!(opener instanceof HTMLButtonElement))
    throw new Error('missing child opener');
  act(() => {
    opener.focus();
    opener.click();
  });
  await flush();
  const child = dialogByTitle('Вложенный');
  if (!child) throw new Error('missing nested dialog');
  act(() => closeButton(child).click());
  await flush();
  expect(document.activeElement).toBe(opener);
  view.unmount();
});
