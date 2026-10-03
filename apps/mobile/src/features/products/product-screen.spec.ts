/**
 * @vitest-environment jsdom
 */
import { act, createElement, forwardRef, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PAYMENT_DELIVERY_STUB } from './payment-delivery-stub';
import { WorkHeader as NativeWorkHeader } from './WorkHeader';
import { WorkHeader as WebWorkHeader } from './WorkHeader.web';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

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
    Text: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
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
  };
});

vi.mock('react-native-svg', () => {
  const shape = ({
    children,
    accessibilityRole,
    accessibilityLabel,
  }: {
    children?: ReactNode;
    accessibilityRole?: string;
    accessibilityLabel?: string;
  }) => createElement('svg', { role: accessibilityRole, 'aria-label': accessibilityLabel }, children);
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

vi.mock('expo-blur', () => ({
  BlurView: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('../../components/figma/WorkGallery', () => ({
  WorkGallery: ({
    leadingAction,
    action,
    children,
  }: {
    leadingAction?: ReactNode;
    action?: ReactNode;
    children?: ReactNode;
  }) => createElement('div', { 'data-marker': 'work-gallery' }, leadingAction, action, children),
}));

vi.mock('./WorkIdentity', () => ({
  WorkIdentity: ({ title }: { title: string }) => createElement('h1', null, title),
}));

vi.mock('../../components/figma/FigmaTabs', () => ({
  FigmaTabs: ({
    tabs,
  }: {
    tabs: ReadonlyArray<{ value: string; label: string }>;
  }) =>
    createElement(
      'div',
      { role: 'tablist' },
      tabs.map((tab) => createElement('button', { key: tab.value, type: 'button', role: 'tab' }, tab.label)),
    ),
}));

const mounted: Array<{ unmount: () => void }> = [];

const headerProps = {
  images: [
    {
      id: '33333333-0000-4000-8000-000000000001',
      url: '/api/images/33333333-0000-4000-8000-000000000001',
    },
  ] as const,
  title: 'Glass bowl',
  authorName: 'Maker 1',
  authorHref: '/authors/maker-1' as const,
  chips: ['Glass'] as const,
  tabs: [{ value: 'story', label: 'История' }] as const,
  tab: 'story',
  onTabChange: () => undefined,
  panelId: 'work-panel',
};

function mountHeader(node: ReactNode) {
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  let unmounted = false;
  const view = {
    container,
    unmount() {
      if (unmounted) return;
      unmounted = true;
      act(() => root.unmount());
      container.remove();
    },
  };
  mounted.push(view);
  act(() => {
    root.render(node);
  });
  return view;
}

function actionLabels(root: ParentNode) {
  return [...root.querySelectorAll('button')].map((node) => node.getAttribute('aria-label'));
}

afterEach(() => {
  for (const entry of mounted.splice(0)) entry.unmount();
  document.body.replaceChildren();
});

describe('Work page commerce stub', () => {
  it('keeps payment and delivery unavailable in v1 without a bid CTA', () => {
    expect(PAYMENT_DELIVERY_STUB).toBe(
      'Оплата и доставка на bidplace пока недоступны.',
    );
    expect(PAYMENT_DELIVERY_STUB.toLowerCase()).not.toContain('корзин');
    expect(PAYMENT_DELIVERY_STUB.toLowerCase()).not.toContain('купить');
  });
});

describe('Work top chrome', () => {
  it.each([
    { platform: 'native', Header: NativeWorkHeader },
    { platform: 'web', Header: WebWorkHeader },
  ])('$platform header shows one Back and one Share and no Like', ({ Header }) => {
    const onBack = vi.fn();
    const onShare = vi.fn();
    const view = mountHeader(createElement(Header, { ...headerProps, onBack, onShare }));
    const labels = actionLabels(view.container);
    const back = view.container.querySelector<HTMLButtonElement>('[aria-label="Назад"]');
    const share = view.container.querySelector<HTMLButtonElement>('[aria-label="Поделиться работой"]');

    expect(labels.filter((label) => label === 'Назад')).toEqual(['Назад']);
    expect(labels.filter((label) => label === 'Поделиться работой')).toEqual(['Поделиться работой']);
    expect(labels.some((label) => /heart|like|лайк|нрав/i.test(label ?? ''))).toBe(false);
    expect(back).toBeTruthy();
    expect(share).toBeTruthy();

    act(() => {
      back!.click();
      share!.click();
    });
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onShare).toHaveBeenCalledTimes(1);
  });
});
