/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TurnstileApi } from './turnstile-script';

const EXPLICIT_API = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const provider: TurnstileApi = {
  execute: () => undefined,
  render: () => 'widget',
  remove: () => undefined,
  reset: () => undefined,
};

type TurnstileBrowser = Window & { turnstile?: TurnstileApi };

function browser(): TurnstileBrowser {
  return window;
}

function stubScriptElements(): HTMLScriptElement[] {
  const created: HTMLScriptElement[] = [];
  const create = Document.prototype.createElement;
  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    const element = create.call(document, tagName);
    if (tagName.toLowerCase() !== 'script') return element;
    let src = '';
    Object.defineProperty(element, 'src', {
      configurable: true,
      get: () => src,
      set: (value: string) => {
        src = value;
      },
    });
    created.push(element as HTMLScriptElement);
    return element;
  });
  return created;
}

describe('turnstile script loader', () => {
  let turnstile: typeof import('./turnstile-script');

  beforeEach(async () => {
    vi.resetModules();
    delete browser().turnstile;
    turnstile = await import('./turnstile-script');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete browser().turnstile;
    document.head.querySelectorAll('script').forEach((script) => {
      script.remove();
    });
  });

  it('uses the explicit Cloudflare api and an already published provider', async () => {
    const created = stubScriptElements();
    browser().turnstile = provider;

    await expect(turnstile.loadTurnstileApi()).resolves.toBe(provider);

    expect(turnstile.TURNSTILE_SCRIPT_URL).toBe(EXPLICIT_API);
    expect(created).toHaveLength(0);
  });

  it('shares one script load across concurrent callers', async () => {
    const created = stubScriptElements();
    const first = turnstile.loadTurnstileApi();
    const second = turnstile.loadTurnstileApi();

    expect(second).toBe(first);
    expect(created).toHaveLength(1);
    expect(created[0]?.src).toBe(EXPLICIT_API);
    expect(created[0]?.isConnected).toBe(true);

    browser().turnstile = provider;
    created[0]?.onload?.(new Event('load'));

    await expect(first).resolves.toBe(provider);
    await expect(second).resolves.toBe(provider);
  });

  it('removes a failed script and can load again', async () => {
    const created = stubScriptElements();
    const first = turnstile.loadTurnstileApi();
    const failed = created[0];
    if (!failed) throw new Error('missing script');

    failed.onerror?.(new Event('error'));
    await expect(first).rejects.toThrow('Turnstile script failed to load');
    expect(failed.isConnected).toBe(false);

    const second = turnstile.loadTurnstileApi();
    expect(second).not.toBe(first);
    expect(created).toHaveLength(2);
    browser().turnstile = provider;
    created[1]?.onload?.(new Event('load'));
    await expect(second).resolves.toBe(provider);
  });

  it('rejects a load event that does not publish the provider and can load again', async () => {
    const created = stubScriptElements();
    const first = turnstile.loadTurnstileApi();
    const failed = created[0];
    if (!failed) throw new Error('missing script');

    failed.onload?.(new Event('load'));
    await expect(first).rejects.toThrow('Turnstile API did not load');
    expect(failed.isConnected).toBe(false);

    const second = turnstile.loadTurnstileApi();
    expect(created).toHaveLength(2);
    browser().turnstile = provider;
    created[1]?.onload?.(new Event('load'));
    await expect(second).resolves.toBe(provider);
  });

  it('times out a hung script, ignores its late load, and does not reuse the rejection', async () => {
    vi.useFakeTimers();
    const created = stubScriptElements();
    const first = turnstile.loadTurnstileApi();
    const hung = created[0];
    if (!hung?.onload) throw new Error('missing script');
    const lateLoad = hung.onload;
    const timedOut = expect(first).rejects.toThrow('Turnstile script timed out');

    await vi.advanceTimersByTimeAsync(turnstile.TURNSTILE_SCRIPT_TIMEOUT_MS);
    await timedOut;
    expect(hung.isConnected).toBe(false);

    let settled = false;
    const second = turnstile.loadTurnstileApi().then(
      (api) => {
        settled = true;
        return api;
      },
      () => {
        settled = true;
        return null;
      },
    );
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(created).toHaveLength(2);

    browser().turnstile = provider;
    const retry = created[1];
    if (!retry?.onload) throw new Error('missing retry script');
    retry.onload(new Event('load'));
    await expect(second).resolves.toBe(provider);

    lateLoad.call(hung, new Event('load'));
    expect(browser().turnstile).toBe(provider);
    expect(created).toHaveLength(2);
  });
});
