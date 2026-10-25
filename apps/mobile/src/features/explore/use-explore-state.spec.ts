/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { exploreSearchHref, useExploreState } from './use-explore-state';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const harness = vi.hoisted(() => ({
  params: {} as Record<string, string | undefined>,
  key: 'explore-1',
  setParams: vi.fn(),
}));
vi.mock('expo-router', () => ({
  useLocalSearchParams: () => harness.params,
  useRoute: () => ({ key: harness.key }),
  useNavigation: () => ({
    getState: () => ({ routes: [{ key: harness.key }] }),
  }),
  useRouter: () => ({ setParams: harness.setParams }),
}));
let latest: ReturnType<typeof useExploreState>;
function Probe() {
  latest = useExploreState();
  return null;
}
let root: Root | undefined;
let container: HTMLDivElement;
function mount() {
  container = document.createElement('div');
  root = createRoot(container);
  act(() => root?.render(createElement(Probe)));
}
function unmount() {
  act(() => root?.unmount());
  root = undefined;
  container?.remove();
}
afterEach(() => {
  unmount();
  harness.setParams.mockClear();
  harness.key += 'x';
  harness.params = {};
});
describe('Explore navigation session', () => {
  it('starts independent Search and direct URL entries without previous queries, hidden drafts or scroll', () => {
    harness.params = { section: 'authors', search: '1', q: 'old-author', city: 'Minsk', sort: 'name' };
    mount();
    act(() => latest.saveScroll(160));
    act(() => latest.selectSection('works'));
    act(() => latest.changeQuery('old-work'));
    act(() => latest.saveScroll(640));
    const fresh = exploreSearchHref();
    expect(fresh).toContain('search=1');
    expect(fresh).not.toMatch(/old-|Minsk|sort=name/);
    unmount();
    harness.key += '-independent';
    harness.params = Object.fromEntries(new URL(fresh, 'https://test.local').searchParams);
    mount();
    expect(latest.state.works.q).toBeUndefined();
    expect(latest.state.authors).toEqual({ sort: 'added' });
    expect(latest.scroll).toEqual({});
    unmount();
    harness.key += '-direct';
    harness.params = {};
    mount();
    expect(latest.state.searchOpen).toBe(false);
    expect(latest.state.works.q).toBeUndefined();
    expect(latest.state.authors.q).toBeUndefined();
    expect(latest.scroll).toEqual({});
  });

  it('keeps independent drafts, filters and scroll through section changes and unmount/Back', () => {
    harness.params = {
      section: 'works',
      search: '1',
      q: 'glass',
      material: 'Glass',
      sort: 'oldest',
    };
    mount();
    act(() => latest.saveScroll(640));
    act(() => latest.selectSection('authors'));
    act(() => latest.changeQuery('maker'));
    act(() =>
      latest.update({
        ...latest.state,
        authors: { ...latest.state.authors, city: 'Minsk', sort: 'name' },
      }),
    );
    act(() => latest.saveScroll(120));
    const last = harness.setParams.mock.lastCall?.[0];
    unmount();
    harness.params = last;
    mount();
    expect(latest.state.section).toBe('authors');
    expect(latest.state.authors).toEqual({
      q: 'maker',
      city: 'Minsk',
      sort: 'name',
    });
    expect(latest.scroll.authors).toBe(120);
    expect(exploreSearchHref()).not.toMatch(/city=|q=|sort=name/);
    expect(exploreSearchHref()).toContain('search=1');
    act(() => latest.selectSection('works'));
    expect(latest.state.works).toEqual({
      q: 'glass',
      material: 'Glass',
      sort: 'oldest',
    });
    expect(latest.scroll.works).toBe(640);
  });
  it('X uses setParams, preserves filters/sort and does not restore the cleared query', () => {
    harness.params = {
      section: 'authors',
      search: '1',
      q: 'maker',
      city: 'Minsk',
      sort: 'name',
    };
    mount();
    act(() => latest.closeSearch());
    expect(harness.setParams).toHaveBeenLastCalledWith(
      expect.objectContaining({
        section: 'authors',
        search: undefined,
        q: undefined,
        city: 'Minsk',
        sort: 'name',
      }),
    );
    act(() => latest.update({ ...latest.state, searchOpen: true }));
    expect(latest.state.authors.q).toBeUndefined();
  });
  it('applies external URL Back/Forward while keeping hidden drafts', () => {
    harness.params = { section: 'works', q: 'glass' };
    mount();
    act(() => latest.selectSection('authors'));
    act(() => latest.changeQuery('maker'));
    harness.params = { section: 'works', search: '1', material: 'Clay' };
    act(() => root?.render(createElement(Probe)));
    expect(latest.state.works).toEqual({ material: 'Clay', sort: 'newest' });
    expect(latest.state.authors.q).toBe('maker');
    expect(latest.state.searchOpen).toBe(true);
  });
  it('restores active state from URL for a new entry and keeps empty header toggles scroll neutral', () => {
    harness.params = { section: 'categories', search: '1' };
    mount();
    act(() => latest.saveScroll(500));
    act(() => latest.closeSearch());
    expect(latest.scroll.categories).toBe(500);
    expect(latest.state.section).toBe('categories');
  });
});
