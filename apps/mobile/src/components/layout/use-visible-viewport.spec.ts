/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const platform = vi.hoisted(() => ({ OS: 'web' }));
vi.mock('react-native', () => ({
  Platform: platform,
  useWindowDimensions: () => ({
    width: 390,
    height: 874,
    scale: 2,
    fontScale: 1,
  }),
}));
import { useVisibleViewport } from './use-visible-viewport';

const original = Object.getOwnPropertyDescriptor(window, 'visualViewport');
afterEach(() => {
  platform.OS = 'web';
  vi.restoreAllMocks();
  if (original) Object.defineProperty(window, 'visualViewport', original);
  else Reflect.deleteProperty(window, 'visualViewport');
});

it('tracks visible bounds, keeps pinch separate and removes listeners on unmount', async () => {
  vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(
    874,
  );
  const viewport = Object.assign(new EventTarget(), {
    height: 874,
    offsetTop: 0,
    scale: 1,
  });
  const remove = vi.spyOn(viewport, 'removeEventListener');
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: viewport,
  });
  const node = document.createElement('div');
  const root = createRoot(node);
  let current: ReturnType<typeof useVisibleViewport> | undefined;
  function Probe() {
    current = useVisibleViewport();
    return null;
  }
  await act(async () => root.render(createElement(Probe)));
  expect(current).toMatchObject({
    height: 874,
    layoutHeight: 874,
    offsetTop: 0,
  });
  await act(async () => {
    viewport.height = 420;
    viewport.offsetTop = 35;
    viewport.dispatchEvent(new Event('resize'));
  });
  expect(current).toMatchObject({ height: 420, offsetTop: 35 });
  await act(async () => {
    viewport.scale = 2;
    viewport.height = 210;
    viewport.offsetTop = 100;
    viewport.dispatchEvent(new Event('scroll'));
  });
  expect(current).toMatchObject({ height: 420, offsetTop: 35 });
  await act(async () => {
    viewport.scale = 2;
    viewport.height = 437;
    viewport.offsetTop = 0;
    viewport.dispatchEvent(new Event('resize'));
  });
  expect(current).toMatchObject({ height: 874, offsetTop: 0 });
  await act(async () => {
    viewport.scale = 1.5;
    viewport.height = 582.66666;
    viewport.offsetTop = 120;
    viewport.dispatchEvent(new Event('resize'));
  });
  expect(current).toMatchObject({
    height: 874,
    layoutHeight: 874,
    offsetTop: 0,
  });
  await act(async () => root.unmount());
  expect(remove.mock.calls.map(([name]) => name)).toEqual(['resize', 'scroll']);
});

it.each(['web', 'ios', 'android'])(
  'keeps layout bounds without a browser viewport on %s',
  async (os) => {
    platform.OS = os;
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: undefined,
    });
    const root = createRoot(document.createElement('div'));
    let current: ReturnType<typeof useVisibleViewport> | undefined;
    function Probe() {
      current = useVisibleViewport();
      return null;
    }
    await act(async () => root.render(createElement(Probe)));
    expect(current).toMatchObject({
      width: 390,
      height: 874,
      layoutHeight: 874,
      offsetTop: 0,
    });
    await act(async () => root.unmount());
  },
);
