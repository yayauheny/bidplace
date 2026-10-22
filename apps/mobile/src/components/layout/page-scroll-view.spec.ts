/** @vitest-environment jsdom */
import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  useWindowDimensions: () => ({ width: 390 }),
  ScrollView: ({ children }: { children?: ReactNode }) => createElement('main', null, children),
  View: ({ children, style }: { children?: ReactNode; style?: object }) => createElement('div', { style }, children),
}));
vi.mock('react-native-reanimated', () => ({
  default: { ScrollView: ({ children }: { children?: ReactNode }) => createElement('main', null, children) },
}));
vi.mock('./PageColumn', () => ({ PageColumn: ({ children }: { children?: ReactNode }) => createElement('section', null, children) }));
vi.mock('./SiteFooter', () => ({ SiteFooter: () => createElement('footer', null, 'footer') }));
vi.mock('./BrandLogo', () => ({ BrandLogo: () => null }));
vi.mock('./use-dock-inset', () => ({ useDockInset: () => ({ reserve: 96 }) }));

import { PageScrollView } from './PageScrollView';
import { PageChromeProvider } from './public-navigation';

describe('ordinary page scroll chrome', () => {
  it.each([
    { desktop: false, dock: false, reserveDock: true, height: '0px' },
    { desktop: false, dock: true, reserveDock: true, height: '96px' },
    { desktop: true, dock: false, reserveDock: true, height: '0px' },
    { desktop: false, dock: true, reserveDock: false, height: '0px' },
  ])('reserves space for visible chrome only: %o', ({ desktop, dock, reserveDock, height }) => {
    for (const animated of [false, true]) {
      for (const state of ['loading', 'error', 'empty', 'ready']) {
        const container = document.createElement('div');
        container.innerHTML = renderToStaticMarkup(createElement(PageChromeProvider, { value: { desktop, dock } }, createElement(PageScrollView, { reserveDock, animated }, state)));
        expect(container.querySelectorAll('main')).toHaveLength(1);
        expect(container.querySelectorAll('footer')).toHaveLength(1);
        expect(container.querySelector('main')?.lastElementChild?.getAttribute('style')).toBe(`height:${height === '0px' ? '0' : height}`);
        expect(container.textContent).toContain(state);
      }
    }
  });
});
