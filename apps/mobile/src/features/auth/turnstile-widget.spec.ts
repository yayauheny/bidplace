/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useInvisibleTurnstile } from './turnstile-widget';
import type { TurnstileApi } from './turnstile-script';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const harness = vi.hoisted(() => ({
  load: vi.fn(),
  os: 'web',
  siteKey: 'synthetic-public-site-key' as string | null,
}));
vi.mock('react-native', () => ({ Platform: { get OS() { return harness.os; } } }));
vi.mock('../../lib/environment', () => ({
  getTurnstileSiteKey: () => harness.siteKey,
}));
vi.mock('./turnstile-script', () => ({
  loadTurnstileApi: () => harness.load(),
}));
let root: Root | undefined;
let getToken: ReturnType<typeof useInvisibleTurnstile>['getToken'];
function Harness() {
  ({ getToken } = useInvisibleTurnstile('register'));
  return null;
}
async function mount() {
  const host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root?.render(createElement(Harness));
  });
  return host;
}
function provider() {
  const options: Parameters<TurnstileApi['render']>[1][] = [];
  const api: TurnstileApi = {
    render: vi.fn((_host, value) => {
      options.push(value);
      return String(options.length);
    }),
    execute: vi.fn(),
    remove: vi.fn(),
    reset: vi.fn(),
  };
  harness.load.mockResolvedValue(api);
  return { api, options };
}
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.resetAllMocks();
  harness.siteKey = 'synthetic-public-site-key';
  harness.os = 'web';
});
describe('invisible Turnstile', () => {
  it('requests a new execute-bound proof only on submission without visible form markup', async () => {
    const { api, options } = provider();
    const host = await mount();
    expect(host.childElementCount).toBe(0);
    expect(harness.load).not.toHaveBeenCalled();
    const proof = getToken();
    await Promise.resolve();
    await Promise.resolve();
    expect(options[0]).toMatchObject({
      action: 'register',
      execution: 'execute',
      retry: 'never',
      'refresh-expired': 'manual',
    });
    expect(api.execute).toHaveBeenCalledWith('1');
    options[0]!.callback('fresh-proof');
    expect(await proof).toBe('fresh-proof');
    expect(api.remove).toHaveBeenCalledWith('1');
  });
  it.each(['error-callback', 'expired-callback', 'timeout-callback'] as const)(
    'fails closed on %s and allows a fresh retry',
    async (event) => {
      const { options } = provider();
      await mount();
      const first = getToken();
      await Promise.resolve();
      await Promise.resolve();
      options[0]![event]();
      expect(await first).toBeNull();
      const second = getToken();
      await Promise.resolve();
      await Promise.resolve();
      options[0]!.callback('late-proof');
      options[1]!.callback('retry-proof');
      expect(await second).toBe('retry-proof');
    },
  );
  it('settles a pending proof on unmount and ignores late provider results', async () => {
    const { options } = provider();
    await mount();
    const proof = getToken();
    await Promise.resolve();
    await Promise.resolve();
    act(() => root?.unmount());
    root = undefined;
    expect(await proof).toBeNull();
    options[0]!.callback('late-proof');
    expect(await getToken()).toBeNull();
  });
  it('settles an aborted submission without executing a late script load', async () => {
    const { api } = provider();
    let loaded!: (api: TurnstileApi) => void;
    harness.load.mockImplementation(
      () =>
        new Promise<TurnstileApi>((resolve) => {
          loaded = resolve;
        }),
    );
    await mount();
    const controller = new AbortController();
    const proof = getToken(controller.signal);
    controller.abort();
    expect(await proof).toBeNull();
    loaded(api);
    await Promise.resolve();
    expect(api.render).not.toHaveBeenCalled();
  });
  it('retires an overlapping request so old callbacks cannot satisfy its replacement', async () => {
    const { options } = provider();
    await mount();
    const first = getToken();
    await Promise.resolve();
    await Promise.resolve();
    const second = getToken();
    await Promise.resolve();
    await Promise.resolve();
    expect(await first).toBeNull();
    options[0]!.callback('stale-proof');
    options[1]!.callback('current-proof');
    expect(await second).toBe('current-proof');
  });
  it('bounds a silent provider and permits retry without caching its late proof', async () => {
    const { options } = provider();
    await mount();
    vi.useFakeTimers();
    const proof = getToken();
    await Promise.resolve();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await proof).toBeNull();
    const retry = getToken();
    await Promise.resolve();
    await Promise.resolve();
    options[0]!.callback('late-proof');
    options[1]!.callback('fresh-proof');
    expect(await retry).toBe('fresh-proof');
  });
  it.each(['missing-key', 'native'])('fails closed for %s without loading the provider', async (reason) => {
    provider();
    if (reason === 'missing-key') harness.siteKey = null;
    else harness.os = 'ios';
    await mount();
    expect(await getToken()).toBeNull();
    expect(harness.load).not.toHaveBeenCalled();
  });
  it('returns null for unavailable provider and retries on the next submission', async () => {
    const { options } = provider();
    harness.load.mockRejectedValueOnce(new Error('offline'));
    await mount();
    expect(await getToken()).toBeNull();
    const proof = getToken();
    await Promise.resolve();
    await Promise.resolve();
    options[0]!.callback('retry-proof');
    expect(await proof).toBe('retry-proof');
  });
});
