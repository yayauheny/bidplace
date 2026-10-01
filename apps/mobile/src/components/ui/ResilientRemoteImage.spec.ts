/**
 * @vitest-environment jsdom
 */
import { act, createElement, forwardRef, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

type RecordedImage = {
  sourceUri?: string;
  recyclingKey?: string;
  contentFit?: string;
  contentPosition?: string;
  transition?: number;
  blurRadius?: number;
  onLoad?: () => void;
  onError?: (event: { error: string }) => void;
};

const recorded = vi.hoisted(() => ({
  images: [] as RecordedImage[],
}));

function flattenStyle(style: unknown): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.map((item) => flattenStyle(item)));
  }
  if (typeof style === 'object') return style as Record<string, unknown>;
  return {};
}

vi.mock('expo-image', () => ({
  Image: (props: RecordedImage & { source?: { uri?: string } }) => {
    recorded.images.push({
      sourceUri: props.source?.uri,
      recyclingKey: props.recyclingKey,
      contentFit: props.contentFit,
      contentPosition: props.contentPosition,
      transition: props.transition,
      blurRadius: props.blurRadius,
      onLoad: props.onLoad,
      onError: props.onError,
    });
    return createElement('img', {
      alt: '',
      src: props.source?.uri,
      'data-recycling': props.recyclingKey,
      'data-fit': props.contentFit,
      'data-position': props.contentPosition ?? '',
      'data-transition': props.transition == null ? '' : String(props.transition),
      'data-blur': props.blurRadius == null ? '' : String(props.blurRadius),
    });
  },
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  StyleSheet: {
    create<T>(styles: T) {
      return styles;
    },
    flatten: flattenStyle,
    absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  },
  AccessibilityInfo: {
    isReduceMotionEnabled: () => Promise.resolve(false),
    addEventListener: () => ({ remove() {} }),
  },
  ActivityIndicator: () => createElement('span', { role: 'progressbar' }),
  View: forwardRef(function View(
    {
      children,
      accessibilityLabel,
      accessibilityRole,
    }: {
      children?: ReactNode;
      accessibilityLabel?: string;
      accessibilityRole?: string;
    },
    ref,
  ) {
    return createElement(
      'div',
      { ref, role: accessibilityRole, 'aria-label': accessibilityLabel },
      children,
    );
  }),
  Text: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
  Pressable: forwardRef(function Pressable(
    props: {
      children?: ReactNode | ((state: { pressed: boolean; hovered: boolean }) => ReactNode);
      accessibilityLabel?: string;
      accessibilityState?: { disabled?: boolean; busy?: boolean };
      disabled?: boolean;
      onPress?: () => void;
      style?: unknown;
    },
    ref,
  ) {
    return createElement(
      'button',
      {
        ref,
        type: 'button',
        'aria-label': props.accessibilityLabel,
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

vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('react-native-svg', () => ({
  Svg: ({
    children,
    role,
    ...props
  }: {
    children?: ReactNode;
    role?: string;
    'aria-label'?: string;
  }) => createElement('svg', { role, 'aria-label': props['aria-label'] }, children),
  G: ({ children }: { children?: ReactNode }) => createElement('g', null, children),
  Path: () => null,
  Circle: () => null,
  Ellipse: () => null,
}));

vi.mock('@hugeicons/react-native', () => ({
  HugeiconsIcon: () => null,
}));

import { ResilientRemoteImage } from './ResilientRemoteImage';

const imageA = 'https://cdn.example.test/a.jpg?token=secret#preview';
const imageB = 'https://cdn.example.test/b.jpg';

function latestImage() {
  const image = recorded.images.at(-1);
  if (!image) throw new Error('expected an image');
  return image;
}

function shownImage() {
  const image = document.querySelector('img');
  if (!(image instanceof HTMLImageElement)) throw new Error('expected a visible image');
  return image;
}

function retryButton() {
  return [...document.querySelectorAll('button')].find((node) => node.textContent === 'Повторить');
}

function imageElement(
  uri: string,
  extra: {
    accessibilityLabel?: string;
    contentFit?: 'cover' | 'contain';
    contentPosition?: 'center' | 'top';
    transition?: number;
    recyclingKey?: string;
    blurRadius?: number;
  } = {},
) {
  return createElement(ResilientRemoteImage, {
    uri,
    component: 'ProductGallery',
    accessibilityLabel: extra.accessibilityLabel ?? 'Работа',
    fallbackLabel: 'Нет фото',
    style: { width: 48, height: 48 },
    contentFit: extra.contentFit,
    contentPosition: extra.contentPosition,
    transition: extra.transition,
    recyclingKey: extra.recyclingKey,
    blurRadius: extra.blurRadius,
  });
}

function mount(node: ReactNode) {
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  let unmounted = false;
  const view = {
    container,
    rerender(next: ReactNode) {
      act(() => {
        root.render(next);
      });
    },
    unmount() {
      if (unmounted) return;
      unmounted = true;
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
  act(() => {
    root.render(node);
  });
  return view;
}

function fail(image: RecordedImage, message = `load failed ${imageA}`) {
  act(() => {
    image.onError?.({ error: message });
  });
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  recorded.images.length = 0;
  vi.useFakeTimers();
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('ResilientRemoteImage lifetime', () => {
  it('retries a failed load on the existing delays and cache-busts each attempt', () => {
    const view = mount(imageElement(imageA, { recyclingKey: 'gallery' }));
    fail(latestImage());
    expect(document.querySelector('img')).toBeNull();
    expect(retryButton()).toBeUndefined();
    expect(document.querySelector('svg')?.getAttribute('aria-label')).toBe('Нет фото');

    advance(999);
    expect(document.querySelector('img')).toBeNull();
    advance(1);
    expect(shownImage().getAttribute('src')).toBe(
      'https://cdn.example.test/a.jpg?token=secret&media_retry=1#preview',
    );
    expect(shownImage().getAttribute('data-recycling')).toBe('gallery-1');

    fail(latestImage());
    advance(3_000);
    expect(shownImage().getAttribute('src')).toContain('media_retry=2');
    expect(shownImage().getAttribute('data-recycling')).toBe('gallery-2');

    fail(latestImage());
    advance(8_000);
    expect(shownImage().getAttribute('src')).toContain('media_retry=3');
    expect(shownImage().getAttribute('data-recycling')).toBe('gallery-3');
    view.unmount();
  });

  it('shows a manual retry after exhaustion and continues the request version', () => {
    const view = mount(imageElement(imageA));
    fail(latestImage());
    advance(1_000);
    fail(latestImage());
    advance(3_000);
    fail(latestImage());
    advance(8_000);
    fail(latestImage());

    expect(document.querySelector('img')).toBeNull();
    expect(retryButton()).toBeInstanceOf(HTMLButtonElement);
    advance(60_000);
    expect(document.querySelector('img')).toBeNull();

    act(() => {
      retryButton()?.click();
    });
    expect(shownImage().getAttribute('src')).toContain('media_retry=4');
    expect(shownImage().getAttribute('data-recycling')).toBe(`${imageA}-4`);
    expect(retryButton()).toBeUndefined();
    view.unmount();
  });

  it('keeps the request version when a later attempt succeeds', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const view = mount(imageElement(imageA));
    fail(latestImage(), `load failed ${imageA}`);
    const warning = JSON.parse(String(warn.mock.calls[0]?.[0])) as {
      url: string;
      message: string;
      attempt: number;
    };
    expect(warning.url).toBe('https://cdn.example.test/a.jpg');
    expect(warning.message).not.toContain('token');
    expect(warning.attempt).toBe(1);

    advance(1_000);
    const loaded = latestImage();
    act(() => {
      loaded.onLoad?.();
    });
    expect(shownImage().getAttribute('src')).toContain('media_retry=1');

    fail(latestImage());
    advance(999);
    expect(document.querySelector('img')).toBeNull();
    advance(1);
    expect(shownImage().getAttribute('src')).toContain('media_retry=2');
    view.unmount();
  });

  it('starts a new recovery lifetime when the URI changes', () => {
    const view = mount(imageElement(imageA, { recyclingKey: 'gallery' }));
    fail(latestImage());
    expect(document.querySelector('svg')).not.toBeNull();

    view.rerender(imageElement(imageB, { recyclingKey: 'gallery' }));
    expect(document.querySelector('svg')).toBeNull();
    expect(shownImage().getAttribute('src')).toBe(imageB);
    expect(shownImage().getAttribute('data-recycling')).toBe('gallery-0');
    view.unmount();
  });

  it('ignores a previous URI callback after the image changes', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const view = mount(imageElement(imageA));
    const first = latestImage();

    view.rerender(imageElement(imageB));
    act(() => {
      first.onError?.({ error: `load failed ${imageA}` });
      first.onLoad?.();
    });
    expect(warn).not.toHaveBeenCalled();
    expect(shownImage().getAttribute('src')).toBe(imageB);

    fail(latestImage());
    expect(document.querySelector('svg')).not.toBeNull();
    act(() => {
      first.onLoad?.();
    });
    expect(document.querySelector('img')).toBeNull();
    expect(document.querySelector('svg')?.getAttribute('aria-label')).toBe('Нет фото');
    view.unmount();
  });

  it('does not let the first instance of a URI reset a later instance of that URI', () => {
    const view = mount(imageElement(imageA));
    const first = latestImage();
    fail(first);
    expect(document.querySelector('svg')).not.toBeNull();

    view.rerender(imageElement(imageB));
    view.rerender(imageElement(imageA));
    expect(shownImage().getAttribute('src')).toBe(imageA);
    expect(shownImage().getAttribute('data-recycling')).toBe(`${imageA}-0`);

    act(() => {
      first.onError?.({ error: `load failed ${imageA}` });
    });
    expect(shownImage().getAttribute('src')).toBe(imageA);
    expect(retryButton()).toBeUndefined();
    view.unmount();
  });

  it('drops a pending retry when the URI changes or the image unmounts', () => {
    const view = mount(imageElement(imageA));
    fail(latestImage());
    view.rerender(imageElement(imageB));
    advance(1_000);
    expect(shownImage().getAttribute('src')).toBe(imageB);

    fail(latestImage());
    view.unmount();
    advance(8_000);
    expect(document.querySelector('img')).toBeNull();
  });

  it('keeps recovery across a rerender of the same URI', () => {
    const view = mount(imageElement(imageA, { accessibilityLabel: 'Работа' }));
    fail(latestImage());
    view.rerender(imageElement(imageA, { accessibilityLabel: 'Та же работа' }));
    expect(document.querySelector('img')).toBeNull();
    expect(document.querySelector('[role="image"]')).toBeNull();

    advance(1_000);
    expect(shownImage().getAttribute('src')).toContain('media_retry=1');
    view.rerender(imageElement(imageA, { accessibilityLabel: 'Та же работа' }));
    expect(shownImage().getAttribute('src')).toContain('media_retry=1');
    expect(document.querySelector('[role="image"]')?.getAttribute('aria-label')).toBe(
      'Та же работа',
    );
    view.unmount();
  });

  it('applies presentation changes without resetting recovery', () => {
    const view = mount(
      imageElement(imageA, {
        contentFit: 'cover',
        contentPosition: 'center',
        transition: 120,
        recyclingKey: 'gallery',
        blurRadius: 0,
      }),
    );
    fail(latestImage());
    advance(1_000);
    view.rerender(
      imageElement(imageA, {
        contentFit: 'contain',
        contentPosition: 'top',
        transition: 240,
        recyclingKey: 'detail',
        blurRadius: 8,
      }),
    );

    const image = shownImage();
    expect(image.getAttribute('src')).toContain('media_retry=1');
    expect(image.getAttribute('data-fit')).toBe('contain');
    expect(image.getAttribute('data-position')).toBe('top');
    expect(image.getAttribute('data-transition')).toBe('240');
    expect(image.getAttribute('data-blur')).toBe('8');
    expect(image.getAttribute('data-recycling')).toBe('detail-1');
    view.unmount();
  });
});
