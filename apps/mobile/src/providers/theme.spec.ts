/**
 * @vitest-environment jsdom
 */
import { act, createElement, useRef, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  blackColorMap,
  designTokens,
  lightColorMap,
  type SemanticColorMap,
} from '@bidplace/design-tokens';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

vi.mock(
  '../components/ui/SheetDragSurface',
  () => import('../components/ui/SheetDragSurface.web'),
);

const navigationThemes: Array<{ colors: Record<string, string> }> = [];

vi.mock('expo-router', () => ({
  DefaultTheme: {
    colors: {
      background: 'default',
      card: 'default',
      primary: 'default',
      border: 'default',
      text: 'default',
      notification: 'default',
    },
  },
  ThemeProvider: ({
    value,
    children,
  }: {
    value: { colors: Record<string, string> };
    children?: ReactNode;
  }) => {
    navigationThemes.push(value);
    return createElement('div', null, children);
  },
  Link: ({ children }: { children?: ReactNode }) =>
    createElement('a', null, children),
  useRouter: () => ({ push: () => undefined, back: () => undefined }),
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  useReducedMotion: () => false,
  StyleSheet: { create: (styles: unknown) => styles },
  Pressable: ({
    children,
    style,
    accessibilityLabel,
    accessibilityRole,
    onPress,
  }: {
    children?:
      | ReactNode
      | ((state: { pressed: boolean; hovered: boolean }) => ReactNode);
    style?:
      | unknown
      | ((state: { pressed: boolean; hovered: boolean }) => unknown);
    accessibilityLabel?: string;
    accessibilityRole?: string;
    onPress?: () => void;
  }) => {
    const state = { pressed: false, hovered: false };
    const resolved = typeof style === 'function' ? style(state) : style;
    const flat: Record<string, unknown> = {};
    const absorb = (item: unknown) => {
      if (Array.isArray(item)) item.forEach(absorb);
      else if (item && typeof item === 'object')
        Object.assign(flat, item as Record<string, unknown>);
    };
    absorb(resolved);
    const content = typeof children === 'function' ? children(state) : children;
    return createElement(
      'div',
      {
        role: accessibilityRole ?? 'button',
        'aria-label': accessibilityLabel,
        style: flat as React.CSSProperties,
        onClick: onPress,
      },
      content,
    );
  },
  Text: ({ children, style }: { children?: ReactNode; style?: unknown }) => {
    const flat: Record<string, unknown> = {};
    for (const item of Array.isArray(style) ? style : [style]) {
      if (item && typeof item === 'object') Object.assign(flat, item);
    }
    return createElement(
      'span',
      { style: flat as React.CSSProperties },
      children,
    );
  },
  View: ({
    children,
    style,
    dataSet,
  }: {
    children?: ReactNode;
    style?: unknown;
    dataSet?: Record<string, string | boolean>;
  }) => {
    const flat: Record<string, unknown> = {};
    for (const item of Array.isArray(style) ? style : [style]) {
      if (item && typeof item === 'object') Object.assign(flat, item);
    }
    const dataAttrs: Record<string, string> = {};
    if (dataSet) {
      for (const [key, val] of Object.entries(dataSet)) {
        dataAttrs[`data-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] =
          String(val);
      }
    }
    return createElement(
      'div',
      { style: flat as React.CSSProperties, ...dataAttrs },
      children,
    );
  },
  TextInput: ({
    value,
    style,
    accessibilityLabel,
    multiline,
  }: {
    value?: string;
    style?: unknown;
    accessibilityLabel?: string;
    multiline?: boolean;
  }) => {
    const flat: Record<string, unknown> = {};
    for (const item of Array.isArray(style) ? style : [style]) {
      if (item && typeof item === 'object') Object.assign(flat, item);
    }
    return createElement(multiline ? 'textarea' : 'input', {
      value,
      'aria-label': accessibilityLabel,
      style: flat as React.CSSProperties,
      readOnly: true,
    });
  },
  ScrollView: ({
    children,
    style,
  }: {
    children?: ReactNode;
    style?: unknown;
  }) => {
    const flat: Record<string, unknown> = {};
    for (const item of Array.isArray(style) ? style : [style]) {
      if (item && typeof item === 'object') Object.assign(flat, item);
    }
    return createElement(
      'div',
      { style: flat as React.CSSProperties },
      children,
    );
  },
  useWindowDimensions: () => ({ width: 390, height: 844 }),
  Share: { share: async () => ({ action: 'sharedAction' }) },
  Alert: { alert: () => undefined },
}));

vi.mock('react-native-svg', () => ({
  Svg: ({ children }: { children?: ReactNode }) =>
    createElement('svg', null, children),
  Circle: () => null,
  Ellipse: () => null,
  G: ({ children }: { children?: ReactNode }) =>
    createElement('g', null, children),
  Path: ({ d, fill }: { d?: string; fill?: string }) =>
    createElement('path', { d, fill }),
  Defs: () => null,
  LinearGradient: () => null,
  Rect: () => null,
  Stop: () => null,
}));

vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({
    colors,
    children,
  }: {
    colors: string[];
    children?: ReactNode;
  }) =>
    createElement(
      'div',
      { 'data-gradient-colors': colors.join('|') },
      children,
    ),
}));

// The figma barrel re-exports glass surfaces built on expo-blur; the blur
// itself is a separate owner and only needs to render children here.
vi.mock('expo-blur', () => ({
  BlurTargetView: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
  BlurView: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
}));

vi.mock('expo-image', () => ({
  Image: () => null,
}));

// The card cover is a separate figma owner; this wave checks the seller
// chrome actions that received the semantic palette.
vi.mock('../components/figma/WorkCoverCard', () => ({
  WorkCoverCard: () => createElement('div', { 'data-cover': '' }),
}));

// Vitest resolves reanimated through Node ESM, which rejects its internal
// directory imports; the AppDialog owner spec uses the same stand-in.
vi.mock('react-native-worklets', () => ({
  scheduleOnRN: (fn: () => void) => fn(),
}));

vi.mock('react-native-reanimated', () => {
  function chain() {
    const api = {
      duration() {
        return api;
      },
      easing() {
        return api;
      },
      reduceMotion() {
        return api;
      },
      withCallback() {
        return api;
      },
    };
    return api;
  }
  return {
    default: {
      View: ({ children }: { children?: ReactNode }) =>
        createElement('div', null, children),
    },
    useSharedValue: (value: number) => useRef({ value }).current,
    useAnimatedStyle: (style: () => object) => style(),
    cancelAnimation: () => undefined,
    withTiming: (
      value: number,
      _config: unknown,
      callback?: (finished: boolean) => void,
    ) => {
      if (callback) queueMicrotask(() => callback(true));
      return value;
    },
    Easing: { bezier: () => 'bezier' },
    FadeIn: chain(),
    FadeOut: chain(),
    LinearTransition: chain(),
    ReduceMotion: { System: 'system' },
    SlideInDown: chain(),
    SlideOutDown: chain(),
  };
});

vi.mock('@hugeicons/react-native', () => ({
  // DOM evidence for the icon color wiring: Hugeicons internals are out of
  // scope; the assertion is that FigmaIcon passes the active theme color.
  HugeiconsIcon: ({ color }: { color?: string }) =>
    createElement('span', {
      'data-figma-icon': '',
      style: { color } as React.CSSProperties,
    }),
}));

import { AppText } from '../components/ui/AppText';
import { FigmaTextField } from '../components/figma/FigmaTextField';
import { FigmaButton } from '../components/figma/FigmaButton';
import { FigmaIcon } from '../components/figma/FigmaIcon';
import { FigmaChip } from '../components/figma/FigmaChip.web';
import { figmaButtonLabelColor } from '../components/figma/figma-button-style';
import { AuthConsentCheckbox } from '../features/auth/auth-consent-checkbox';
import { AuthGoogleIcon } from '../features/auth/auth-google-icon';
import {
  AuthLegalText,
  RegistrationLegalText,
} from '../features/auth/auth-legal-text';
import { HomeNewAuthors } from '../features/home/home-new-authors';
import { AuthorShare } from '../features/sellers/AuthorShare';
import { CreatorWorkCard } from '../features/sellers/CreatorWorkCard';
import { ProductDraftStoryStep } from '../features/sellers/product-draft-story';
import { ThemeProvider, useAppTheme } from './theme-provider';

let captured: SemanticColorMap | null = null;
function Probe() {
  captured = useAppTheme();
  return null;
}

function textColor(container: HTMLElement): string {
  const span = container.querySelector('span');
  return String((span?.style as CSSStyleDeclaration).color);
}

afterEach(() => {
  document.documentElement.removeAttribute('data-bidplace-theme');
  document.documentElement.style.removeProperty('--bidplace-focus');
  navigationThemes.length = 0;
});

describe('app theme owner', () => {
  it('keeps designTokens.color as the single light source', () => {
    expect(designTokens.color).toBe(lightColorMap);
    expect(lightColorMap.canvas).toBe('#FFFFFF');
  });

  it('re-renders theme consumers without remount when the theme switches', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    function Gallery({ theme }: { theme: 'light' | 'black' }) {
      return createElement(ThemeProvider, {
        theme,
        children: [
          createElement(Probe, { key: 'probe' }),
          createElement(
            AppText,
            { key: 'text', role: 'body', tone: 'danger' },
            'Ошибка',
          ),
        ],
      });
    }
    act(() => root.render(createElement(Gallery, { theme: 'light' })));
    const span = container.querySelector('span')!;
    expect(captured).toBe(lightColorMap);
    expect(textColor(container)).toBe('rgb(255, 0, 0)');
    expect(document.documentElement.dataset.bidplaceTheme).toBe('light');
    expect(
      document.documentElement.style.getPropertyValue('--bidplace-focus'),
    ).toBe(lightColorMap.focus);

    // Same root, no remount: switching the prop must update every consumer.
    act(() => root.render(createElement(Gallery, { theme: 'black' })));
    expect(container.querySelector('span')).toBe(span);
    expect(captured).toBe(blackColorMap);
    expect(textColor(container)).toBe('rgb(255, 77, 77)');
    expect(document.documentElement.dataset.bidplaceTheme).toBe('black');
    expect(
      document.documentElement.style.getPropertyValue('--bidplace-focus'),
    ).toBe(blackColorMap.focus);
    expect(navigationThemes.at(-1)?.colors.background).toBe(
      blackColorMap.canvas,
    );
    expect(navigationThemes.at(-1)?.colors.text).toBe(blackColorMap.ink);

    act(() => root.unmount());
    container.remove();
  });

  it('re-themes a field input without remount when the theme switches', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    function FieldGallery({ theme }: { theme: 'light' | 'black' }) {
      return createElement(ThemeProvider, {
        theme,
        children: createElement(FigmaTextField, {
          label: 'Email',
          value: 'a@bidplace.ru',
        }),
      });
    }
    act(() => root.render(createElement(FieldGallery, { theme: 'light' })));
    const input = container.querySelector('input')!;
    expect(input.style.color).toBe('rgb(18, 18, 18)');

    act(() => root.render(createElement(FieldGallery, { theme: 'black' })));
    expect(container.querySelector('input')).toBe(input);
    expect(input.style.color).toBe('rgb(245, 245, 245)');

    act(() => root.unmount());
    container.remove();
  });

  it('re-themes mounted button, icon and chip gradient without remounting', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    function Consumers({ theme }: { theme: 'light' | 'black' }) {
      return createElement(ThemeProvider, {
        theme,
        children: [
          createElement(FigmaButton, {
            key: 'button',
            variant: 'solid',
            label: 'Сохранить',
            onPress: () => undefined,
          }),
          createElement(FigmaIcon, { key: 'icon', name: 'search-01' }),
          createElement(FigmaChip, {
            key: 'chip',
            tone: 'onDark',
            label: 'Автор',
          }),
        ],
      });
    }
    act(() => root.render(createElement(Consumers, { theme: 'light' })));

    const paletteOf = (theme: 'light' | 'black') =>
      theme === 'light' ? lightColorMap : blackColorMap;
    // jsdom serializes inline colors as rgb(); palette values are hex.
    const rgbOf = (hex: string) => {
      const value = hex.replace('#', '');
      const channels = [0, 2, 4].map((offset) =>
        parseInt(value.slice(offset, offset + 2), 16),
      );
      return `rgb(${channels.join(', ')})`;
    };
    const button = container.querySelector(
      '[aria-label="Сохранить"]',
    ) as HTMLElement;
    const label = button.querySelector('span') as HTMLElement;
    const icon = container.querySelector('[data-figma-icon]') as HTMLElement;
    const chip = [...container.querySelectorAll('div')].find((node) =>
      (node as HTMLElement).style.backgroundImage.includes('linear-gradient'),
    ) as HTMLElement;
    const chipShell = chip.parentElement as HTMLElement;

    for (const theme of ['light', 'black'] as const) {
      const palette = paletteOf(theme);
      // The solid surface paints via FigmaButtonSurface (SVG); the mounted
      // DOM evidence here is the label/icon colors and the chip gradient.
      expect(label.style.color).toBe(
        rgbOf(figmaButtonLabelColor('solid', 'matrix', palette)),
      );
      expect(icon.style.color).toBe(rgbOf(palette.ink));
      expect(chipShell.style.backgroundColor).toBe(palette.chip);
      expect(chip.style.backgroundImage).toContain(
        palette.chipBorderGradientStart,
      );
      expect(chip.style.backgroundImage).toContain(
        palette.chipBorderGradientEnd,
      );
      if (theme === 'light') {
        act(() => root.render(createElement(Consumers, { theme: 'black' })));
        // Same DOM nodes: switching the theme updates consumers in place.
        expect(container.querySelector('[aria-label="Сохранить"]')).toBe(
          button,
        );
        expect(container.querySelector('[data-figma-icon]')).toBe(icon);
        expect(
          [...container.querySelectorAll('div')].find((node) =>
            (node as HTMLElement).style.backgroundImage.includes(
              'linear-gradient',
            ),
          ),
        ).toBe(chip);
      }
    }

    act(() => root.unmount());
    container.remove();
  });

  it('resolves to light outside a provider', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    act(() => root.render(createElement(Probe)));
    expect(captured).toBe(lightColorMap);
    act(() => root.unmount());
    container.remove();
  });

  it('re-themes mounted login controls and the story toolbar without remounting', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const rgbOf = (hex: string) => {
      const value = hex.replace('#', '');
      const channels = [0, 2, 4].map((offset) =>
        parseInt(value.slice(offset, offset + 2), 16),
      );
      return `rgb(${channels.join(', ')})`;
    };
    function Controls({ theme }: { theme: 'light' | 'black' }) {
      return createElement(ThemeProvider, {
        theme,
        children: [
          createElement(AuthLegalText, {
            key: 'legal',
            variant: 'login',
            onOpenPolicy: () => undefined,
            onOpenRules: () => undefined,
          }),
          createElement(AuthConsentCheckbox, {
            key: 'consent',
            checked: false,
            onChange: () => undefined,
            label: 'Мне есть 18 лет',
            children: createElement(RegistrationLegalText, {
              onOpenDocument: () => undefined,
            }),
          }),
          createElement(AuthGoogleIcon, { key: 'google' }),
          createElement(ProductDraftStoryStep, {
            key: 'story',
            productId: 'p1',
            sessionEpoch: 1,
            isCreationFlow: false,
            storyNeedsDraft: false,
            blocks: [],
            images: [],
            editable: true,
            savePending: false,
            saveError: null,
            retryUpload: false,
            onAddText: () => undefined,
            onEditText: () => undefined,
            onEditAlt: () => undefined,
            onRemove: () => undefined,
            onMove: () => undefined,
            onChooseImage: () => undefined,
            onRetryUpload: () => undefined,
            onSaveAndContinue: () => undefined,
          }),
        ],
      });
    }
    act(() => root.render(createElement(Controls, { theme: 'light' })));

    const spanByText = (text: string) =>
      [...container.querySelectorAll('span')].find(
        (node) => node.textContent === text,
      ) as HTMLElement;
    const legalLink = spanByText('политикой персональных данных и cookies');
    const consentLink = spanByText('пользовательское соглашение');
    const gradient = container.querySelector(
      '[data-gradient-colors]',
    ) as HTMLElement;
    const googlePath = container.querySelector(
      'path',
    ) as unknown as HTMLElement;
    const tool = container.querySelector(
      '[aria-label="Добавить заголовок"]',
    ) as HTMLElement;
    const imageTool = container.querySelector(
      '[aria-label="Добавить изображение"]',
    ) as HTMLElement;

    for (const theme of ['light', 'black'] as const) {
      const palette = theme === 'light' ? lightColorMap : blackColorMap;
      expect(legalLink.style.color).toBe(rgbOf(palette.legalLink));
      expect(consentLink.style.color).toBe(rgbOf(palette.fieldValue));
      expect(gradient.dataset.gradientColors).toBe(
        `${palette.outlineBorderGradientStart}|${palette.outlineBorderGradientEnd}`,
      );
      expect(googlePath.getAttribute('fill')).toBe(palette.fieldValue);
      expect(tool.style.backgroundColor).toBe(rgbOf(palette.surfaceMuted));
      expect((tool.querySelector('span') as HTMLElement).style.color).toBe(
        rgbOf(palette.ink),
      );
      expect(
        (imageTool.querySelector('[data-figma-icon]') as HTMLElement).style
          .color,
      ).toBe(rgbOf(palette.ink));
      if (theme === 'light') {
        act(() => root.render(createElement(Controls, { theme: 'black' })));
        // Same DOM nodes: the palette switch re-paints consumers in place.
        expect(
          container.querySelector('[aria-label="Добавить заголовок"]'),
        ).toBe(tool);
        expect(container.querySelector('path')).toBe(googlePath);
        expect(container.querySelector('[data-gradient-colors]')).toBe(
          gradient,
        );
      }
    }

    act(() => root.unmount());
    container.remove();
  });

  it('re-themes mounted seller chrome actions without remounting', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const rgbOf = (hex: string) => {
      const value = hex.replace('#', '');
      const channels = [0, 2, 4].map((offset) =>
        parseInt(value.slice(offset, offset + 2), 16),
      );
      return `rgb(${channels.join(', ')})`;
    };
    const item = {
      work: {
        id: 'w1',
        publicId: 'pub1',
        title: 'Натюрморт',
        images: [{ url: '/x.webp' }],
      },
      author: { slug: 'author-a' },
    };
    function Card({ theme }: { theme: 'light' | 'black' }) {
      return createElement(ThemeProvider, {
        theme,
        children: createElement(CreatorWorkCard, {
          item,
          isOwner: true,
          onUnavailable: () => undefined,
          onHide: () => undefined,
        }),
      });
    }
    act(() => root.render(createElement(Card, { theme: 'light' })));

    const like = container.querySelector(
      '[aria-label="Нравится работа Натюрморт"]',
    ) as HTMLElement;
    const hide = container.querySelector(
      '[aria-label="Скрыть работу Натюрморт"]',
    ) as HTMLElement;
    const hideIcon = hide.querySelector('[data-figma-icon]') as HTMLElement;

    for (const theme of ['light', 'black'] as const) {
      const palette = theme === 'light' ? lightColorMap : blackColorMap;
      expect(like.style.backgroundColor).toBe(rgbOf(palette.white));
      expect(hide.style.backgroundColor).toBe(rgbOf(palette.danger));
      expect(hideIcon.style.color).toBe(rgbOf(palette.white));
      if (theme === 'light') {
        act(() => root.render(createElement(Card, { theme: 'black' })));
        expect(
          container.querySelector('[aria-label="Нравится работа Натюрморт"]'),
        ).toBe(like);
        expect(
          container.querySelector('[aria-label="Скрыть работу Натюрморт"]'),
        ).toBe(hide);
      }
    }

    act(() => root.unmount());
    container.remove();
  });

  it('re-themes the remaining literal accents without remounting', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const rgbOf = (hex: string) => {
      const value = hex.replace('#', '');
      const channels = [0, 2, 4].map((offset) =>
        parseInt(value.slice(offset, offset + 2), 16),
      );
      return `rgb(${channels.join(', ')})`;
    };
    const noop = () => undefined;
    const authors = [
      {
        slug: 'vex',
        fullName: 'Илья Васильев',
        profilePhotoUrl: '/api/sellers/vex/photo',
      },
    ];
    function RemainingAccents({ theme }: { theme: 'light' | 'black' }) {
      return createElement(ThemeProvider, {
        theme,
        children: createElement(
          'div',
          null,
          createElement(AuthorShare, {
            sharePath: '/s/vex',
            onUnavailable: noop,
          }),
          createElement(HomeNewAuthors, { authors }),
          createElement(ProductDraftStoryStep, {
            productId: 'p1',
            sessionEpoch: 1,
            isCreationFlow: true,
            storyNeedsDraft: false,
            blocks: [],
            images: [],
            editable: true,
            savePending: false,
            saveError: null,
            retryUpload: false,
            onAddText: noop,
            onEditText: noop,
            onEditAlt: noop,
            onRemove: noop,
            onMove: noop,
            onChooseImage: noop,
            onRetryUpload: noop,
            onSaveAndContinue: noop,
          }),
        ),
      });
    }
    act(() => root.render(createElement(RemainingAccents, { theme: 'light' })));
    // The report row renders inside the share sheet; open it like a user.
    act(() => {
      (
        container.querySelector(
          '[aria-label="Поделиться профилем"]',
        ) as HTMLElement
      ).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const reportRow = container.querySelector(
      '[aria-label="Пожаловаться на автора"]',
    ) as HTMLElement;
    const reportLabel = Array.from(reportRow.querySelectorAll('span')).find(
      (el) => el.textContent === 'Пожаловаться',
    ) as HTMLElement;
    const reportIcon = reportRow.querySelector(
      '[data-figma-icon]',
    ) as HTMLElement;
    const toolbar = Array.from(container.querySelectorAll('div')).find(
      (el) =>
        el.style.borderRadius === '31px' && el.style.borderWidth === '0.5px',
    ) as HTMLElement;
    const frontShell = Array.from(container.querySelectorAll('div')).find(
      (el) =>
        el.style.boxShadow !== '' &&
        (el.style.width === '322px' || el.style.width === '322'),
    ) as HTMLElement;

    for (const theme of ['light', 'black'] as const) {
      const palette = theme === 'light' ? lightColorMap : blackColorMap;
      expect(reportLabel.style.color).toBe(rgbOf(palette.report));
      expect(reportIcon.style.color).toBe(rgbOf(palette.report));
      expect(toolbar.style.borderColor).toBe(rgbOf(palette.toolbarBorder));
      expect(frontShell.style.boxShadow).toBe(palette.fanShadow);
      if (theme === 'light') {
        act(() =>
          root.render(createElement(RemainingAccents, { theme: 'black' })),
        );
        expect(
          container.querySelector('[aria-label="Пожаловаться на автора"]'),
        ).toBe(reportRow);
        expect(frontShell.isConnected).toBe(true);
      }
    }

    act(() => root.unmount());
    container.remove();
  });

  it('uses 6px between story text blocks and 20px before the in-flow toolbar', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const noop = () => undefined;
    act(() =>
      root.render(
        createElement(ThemeProvider, {
          theme: 'light',
          children: createElement(ProductDraftStoryStep, {
            productId: 'p1',
            sessionEpoch: 1,
            isCreationFlow: true,
            storyNeedsDraft: false,
            blocks: [
              { key: 'h', type: 'HEADING', text: 'Title' },
              { key: 'p', type: 'PARAGRAPH', text: 'Body' },
            ],
            images: [],
            editable: true,
            savePending: false,
            saveError: null,
            retryUpload: false,
            onAddText: noop,
            onEditText: noop,
            onEditAlt: noop,
            onRemove: noop,
            onMove: noop,
            onChooseImage: noop,
            onRetryUpload: noop,
            onSaveAndContinue: noop,
          }),
        }),
      ),
    );
    const blocks = container.querySelectorAll('[data-editor-block="text"]');
    const secondBlock = blocks[1]!.parentElement as HTMLElement;
    expect(parseFloat(secondBlock.style.marginTop)).toBe(
      designTokens.space.workChipGap,
    );
    const toolbar = Array.from(container.querySelectorAll('div')).find(
      (node) =>
        node.style.borderRadius === '31px' &&
        parseFloat(node.style.minHeight || '0') === 52,
    ) as HTMLElement;
    expect(parseFloat(toolbar.style.marginTop)).toBe(designTokens.space.x5);
    act(() => root.unmount());
    container.remove();
  });

  it('starts empty web story fields at paragraph line height', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const noop = () => undefined;
    act(() =>
      root.render(
        createElement(ThemeProvider, {
          theme: 'light',
          children: createElement(ProductDraftStoryStep, {
            productId: 'p1',
            sessionEpoch: 1,
            isCreationFlow: true,
            storyNeedsDraft: false,
            blocks: [],
            images: [],
            editable: true,
            savePending: false,
            saveError: null,
            retryUpload: false,
            onAddText: noop,
            onEditText: noop,
            onEditAlt: noop,
            onRemove: noop,
            onMove: noop,
            onChooseImage: noop,
            onRetryUpload: noop,
            onSaveAndContinue: noop,
          }),
        }),
      ),
    );
    const field = container.querySelector(
      'textarea[aria-label="Текст истории"]',
    ) as HTMLTextAreaElement;
    expect(parseFloat(field.style.minHeight)).toBe(
      designTokens.typography.subtitle.lineHeight,
    );
    act(() => root.unmount());
    container.remove();
  });
});
