/**
 * @vitest-environment jsdom
 */
import { act, createElement, forwardRef, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SearchOverlay } from './SearchOverlay';
import { SearchOverlaySurface as WebSearchOverlaySurface } from './search-overlay-surface.web';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const modalBoundary = vi.hoisted(() => {
  const state: {
    latest: {
      visible?: boolean;
      transparent?: boolean;
      animationType?: string;
      onRequestClose?: () => void;
    } | null;
  } = { latest: null };
  return state;
});

vi.mock('./search-overlay-surface', () => import('./search-overlay-surface.web'));

vi.mock('./panes/CategoriesSearchPane', () => ({
  CategoriesSearchPane: () => createElement('div', { 'data-marker': 'categories-pane' }, 'categories'),
}));

vi.mock('./panes/AuthorsSearchPane', () => ({
  AuthorsSearchPane: () => createElement('div', { 'data-marker': 'authors-pane' }, 'authors'),
}));

vi.mock('./panes/WorksSearchPane', () => ({
  WorksSearchPane: () => createElement('div', { 'data-marker': 'works-pane' }, 'works'),
}));

vi.mock('react-native', () => {
  function host(props: {
    accessibilityRole?: string;
    accessibilityLabel?: string;
    nativeID?: string;
    role?: string;
    testID?: string;
  }) {
    return {
      id: props.nativeID,
      role: props.accessibilityRole ?? props.role,
      'aria-label': props.accessibilityLabel,
      'data-testid': props.testID,
    };
  }
  return {
    Platform: { OS: 'web', select: (options: { web?: unknown }) => options.web },
    StyleSheet: {
      create: <T,>(styles: T) => styles,
      flatten: (style: unknown) => style,
      absoluteFill: {},
      hairlineWidth: 1,
    },
    AccessibilityInfo: {
      isReduceMotionEnabled: async () => false,
      addEventListener: () => ({ remove() {} }),
    },
    View: forwardRef(function View(
      props: {
        children?: ReactNode;
        accessibilityRole?: string;
        accessibilityLabel?: string;
        nativeID?: string;
        role?: string;
        testID?: string;
      },
      ref,
    ) {
      return createElement('div', { ...host(props), ref }, props.children);
    }),
    ScrollView: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
    Text: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
    TextInput: forwardRef(function TextInput(
      props: {
        accessibilityLabel?: string;
        testID?: string;
        value?: string;
      },
      ref,
    ) {
      return createElement('input', {
        ref,
        'aria-label': props.accessibilityLabel,
        'data-testid': props.testID,
        value: props.value,
        readOnly: true,
      });
    }),
    Pressable: forwardRef(function Pressable(
      props: {
        children?: ReactNode | ((state: { pressed: boolean; hovered: boolean; focused: boolean }) => ReactNode);
        onPress?: () => void;
        accessibilityRole?: string;
        accessibilityLabel?: string;
        testID?: string;
      },
      ref,
    ) {
      return createElement(
        'button',
        {
          ref,
          type: 'button',
          role: props.accessibilityRole,
          'aria-label': props.accessibilityLabel,
          'data-testid': props.testID,
          onClick: () => props.onPress?.(),
        },
        typeof props.children === 'function'
          ? props.children({ pressed: false, hovered: false, focused: false })
          : props.children,
      );
    }),
    Modal: ({
      children,
      visible,
      transparent,
      animationType,
      onRequestClose,
    }: {
      children?: ReactNode;
      visible?: boolean;
      transparent?: boolean;
      animationType?: string;
      onRequestClose?: () => void;
    }) => {
      modalBoundary.latest = { visible, transparent, animationType, onRequestClose };
      return visible ? createElement('div', { 'data-testid': 'native-modal' }, children) : null;
    },
  };
});

vi.mock('react-native-svg', () => {
  const shape = ({ children }: { children?: ReactNode }) => createElement('svg', null, children);
  return {
    default: shape,
    Svg: shape,
    Circle: shape,
    Ellipse: shape,
    G: shape,
    Line: shape,
    Path: shape,
    Rect: shape,
  };
});

vi.mock('@hugeicons/react-native', () => ({
  HugeiconsIcon: () => null,
}));

const mounted: Array<{ unmount: () => void }> = [];

function mount(node: ReactNode) {
  const host = document.createElement('div');
  document.body.append(host);
  const root: Root = createRoot(host);
  let unmounted = false;
  const view = {
    host,
    unmount() {
      if (unmounted) return;
      unmounted = true;
      act(() => root.unmount());
      host.remove();
    },
  };
  mounted.push(view);
  act(() => {
    root.render(node);
  });
  return view;
}

afterEach(() => {
  for (const entry of mounted.splice(0)) entry.unmount();
  modalBoundary.latest = null;
  document.body.replaceChildren();
});

describe('Search overlay surface', () => {
  it('portals the web dialog outside the host and removes it on unmount', () => {
    const view = mount(
      createElement(WebSearchOverlaySurface, {
        surfaceId: 'search-web',
        onClose: () => undefined,
        children: createElement('p', null, 'sentinel'),
      }),
    );
    const dialog = document.getElementById('search-web');
    expect(dialog).toBeTruthy();
    expect(dialog?.getAttribute('role')).toBe('dialog');
    expect(dialog?.textContent).toContain('sentinel');
    expect(view.host.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
    view.unmount();
    expect(document.getElementById('search-web')).toBeNull();
  });

  it('wires the native surface through Modal', async () => {
    const { SearchOverlaySurface: NativeSearchOverlaySurface } =
      await vi.importActual<typeof import('./search-overlay-surface')>(
        './search-overlay-surface',
      );
    const onClose = vi.fn();
    mount(
      createElement(NativeSearchOverlaySurface, {
        surfaceId: 'search-native',
        onClose,
        children: createElement('p', null, 'native-sentinel'),
      }),
    );
    expect(modalBoundary.latest).toMatchObject({
      visible: true,
      transparent: true,
      animationType: 'none',
    });
    act(() => {
      modalBoundary.latest?.onRequestClose?.();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes once from the dimmer and ignores inside and post-unmount events', () => {
    const onDismiss = vi.fn();
    const view = mount(
      createElement(SearchOverlay, {
        initialQuery: '',
        initialTab: 'categories',
        onDismiss,
        onSessionChange: () => undefined,
      }),
    );
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const dimmer = document.querySelector<HTMLElement>('[data-testid="overlay-dimmer"]');
    expect(dialog?.id).toBeTruthy();
    expect(view.host.contains(dialog)).toBe(false);
    expect(dimmer).toBeTruthy();

    act(() => {
      dialog!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      dialog!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      dimmer!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      dimmer!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);

    view.unmount();
    act(() => {
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
