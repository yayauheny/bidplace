/**
 * @vitest-environment jsdom
 */
import { act, createElement, forwardRef, type ReactNode, type Ref } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { designTokens } from '@bidplace/design-tokens';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTH_TURNSTILE_UNAVAILABLE_COPY } from '../../errors';
import { TurnstileWidget, type TurnstileAvailability } from './turnstile-widget';
import type { TurnstileAction } from './turnstile-script';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const LOADING_COPY = 'Загрузка проверки безопасности…';
const SITE_KEY = 'synthetic-site-key';

type RenderOptions = {
  sitekey: string;
  action: string;
  language: string;
  size: string;
  callback: (token: string) => void;
  'error-callback': () => void;
  'expired-callback': () => void;
  'timeout-callback': () => void;
};

type FakeWidget = {
  id: string;
  options: RenderOptions;
};

const harness = vi.hoisted(() => ({
  os: 'web',
  siteKey: 'synthetic-site-key' as string | null,
  onLayout: null as
    | ((event: { nativeEvent: { layout: { width: number; height: number } } }) => void)
    | null,
  loadTurnstileApi: (): Promise<unknown> => Promise.reject(new Error('Turnstile load is not ready')),
}));

vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return harness.os;
    },
  },
  View: forwardRef(function View(
    {
      style,
      children,
      accessibilityLabel,
      onLayout,
    }: {
      style?: {
        minWidth?: number;
        minHeight?: number;
        gap?: number;
        width?: string;
        maxWidth?: string;
      };
      children?: ReactNode;
      accessibilityLabel?: string;
      onLayout?: (event: { nativeEvent: { layout: { width: number; height: number } } }) => void;
    },
    ref: Ref<HTMLDivElement>,
  ) {
    if (onLayout) harness.onLayout = onLayout;
    const flat = style ?? {};
    return createElement(
      'div',
      {
        ref,
        'aria-label': accessibilityLabel,
        'data-min-width': flat.minWidth === undefined ? '' : String(flat.minWidth),
        'data-min-height': flat.minHeight === undefined ? '' : String(flat.minHeight),
        'data-gap': flat.gap === undefined ? '' : String(flat.gap),
        'data-width': flat.width ?? '',
        'data-max-width': flat.maxWidth ?? '',
      },
      children,
    );
  }),
}));

vi.mock('../../components/ui', () => ({
  AppText: ({
    children,
    tone,
    role,
  }: {
    children?: ReactNode;
    tone?: string;
    role?: string;
  }) => createElement('p', { 'data-tone': tone ?? '', 'data-role': role ?? '' }, children),
  TextButton: ({ label, onPress }: { label: string; onPress: () => void }) =>
    createElement('button', { type: 'button', onClick: onPress }, label),
}));

vi.mock('../../lib/environment', () => ({
  getTurnstileSiteKey: () => harness.siteKey,
}));

vi.mock('./turnstile-script', () => ({
  loadTurnstileApi: () => harness.loadTurnstileApi(),
}));

function fakeProvider() {
  const widgets: FakeWidget[] = [];
  const api = {
    render: vi.fn((container: HTMLElement, options: RenderOptions) => {
      if (!(container instanceof HTMLElement)) throw new Error('missing host');
      const id = `widget-${widgets.length + 1}`;
      widgets.push({ id, options });
      return id;
    }),
    remove: vi.fn(),
    reset: vi.fn(),
  };
  return { api, widgets };
}

function textIncludes(container: ParentNode, value: string): boolean {
  return container.textContent?.includes(value) ?? false;
}

describe('turnstile widget', () => {
  let root: Root | undefined;

  beforeEach(() => {
    harness.os = 'web';
    harness.siteKey = SITE_KEY;
    harness.onLayout = null;
    harness.loadTurnstileApi = () => Promise.reject(new Error('Turnstile load is not ready'));
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    root = undefined;
    document.body.replaceChildren();
  });

  async function renderWidget(action: TurnstileAction = 'login', width = 360) {
    const tokens: Array<string | null> = [];
    const availability: TurnstileAvailability[] = [];
    const container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    await act(async () => {
      root?.render(
        createElement(TurnstileWidget, {
          action,
          onToken: (token) => {
            tokens.push(token);
          },
          onAvailability: (next) => {
            availability.push(next);
          },
        }),
      );
    });
    await act(async () => {
      harness.onLayout?.({
        nativeEvent: { layout: { width, height: width < 300 ? 140 : 65 } },
      });
    });
    return { container, tokens, availability };
  }

  it.each(['login', 'register', 'password_reset', 'email_verification'] as const)(
    'renders the %s challenge in Russian at the flexible size',
    async (action) => {
      const provider = fakeProvider();
      harness.loadTurnstileApi = () => Promise.resolve(provider.api);
      const view = await renderWidget(action);
      const options = provider.widgets[0]?.options;

      expect(options).toMatchObject({
        sitekey: SITE_KEY,
        action,
        language: 'ru',
        size: 'flexible',
      });
      expect(view.container.querySelector('[data-min-height="65"]')).toBeTruthy();
      expect(view.container.querySelector('[data-min-width="300"]')).toBeNull();
      expect(view.container.querySelector('[data-width="100%"]')?.getAttribute('data-max-width')).toBe('100%');
      expect(view.container.querySelector(`[data-gap="${designTokens.auth.formGap}"]`)).toBeTruthy();
      expect(view.availability.at(-1)).toBe('ready');
      expect(textIncludes(view.container, LOADING_COPY)).toBe(false);
    },
  );

  it('shows loading until the provider callback supplies a token', async () => {
    const provider = fakeProvider();
    let resolveLoad: (api: ReturnType<typeof fakeProvider>['api']) => void = () => undefined;
    harness.loadTurnstileApi = () =>
      new Promise((resolve) => {
        resolveLoad = resolve;
      });
    const view = await renderWidget();

    expect(textIncludes(view.container, LOADING_COPY)).toBe(true);
    expect(view.container.querySelector('button')).toBeNull();
    expect(view.tokens.some((token) => typeof token === 'string')).toBe(false);

    await act(async () => {
      resolveLoad(provider.api);
      await Promise.resolve();
    });

    expect(textIncludes(view.container, LOADING_COPY)).toBe(false);
    provider.widgets[0]?.options.callback('synthetic-turnstile-token');
    expect(view.tokens).toContain('synthetic-turnstile-token');
  });

  it('ignores a provider callback after the widget is removed', async () => {
    const provider = fakeProvider();
    harness.loadTurnstileApi = () => Promise.resolve(provider.api);
    const view = await renderWidget();
    const callback = provider.widgets[0]?.options.callback;
    if (!callback) throw new Error('missing callback');

    act(() => {
      root?.unmount();
    });
    callback('synthetic-turnstile-token');

    expect(provider.api.remove).toHaveBeenCalledWith('widget-1');
    expect(view.tokens).not.toContain('synthetic-turnstile-token');
    expect(view.tokens.at(-1)).toBeNull();
  });

  it('ignores a callback from the previous action', async () => {
    const provider = fakeProvider();
    harness.loadTurnstileApi = () => Promise.resolve(provider.api);
    const view = await renderWidget('login');
    const previous = provider.widgets[0]?.options.callback;
    if (!previous) throw new Error('missing callback');

    await act(async () => {
      root?.render(
        createElement(TurnstileWidget, {
          action: 'email_verification',
          onToken: (token) => {
            view.tokens.push(token);
          },
          onAvailability: (next) => {
            view.availability.push(next);
          },
        }),
      );
    });

    previous('stale-token');
    provider.widgets[1]?.options.callback('fresh-token');

    expect(provider.api.remove).toHaveBeenCalledWith('widget-1');
    expect(provider.widgets[1]?.options.action).toBe('email_verification');
    expect(view.tokens).not.toContain('stale-token');
    expect(view.tokens).toContain('fresh-token');
  });

  it('reports a provider error as unavailable without resetting', async () => {
    const provider = fakeProvider();
    let resets = 0;
    provider.api.reset.mockImplementation(() => {
      resets += 1;
      if (resets > 2) throw new Error('reset loop');
      provider.widgets.at(-1)?.options['error-callback']();
    });
    harness.loadTurnstileApi = () => Promise.resolve(provider.api);
    const view = await renderWidget();

    act(() => {
      provider.widgets[0]?.options['error-callback']();
    });

    expect(resets).toBe(0);
    expect(provider.api.reset).not.toHaveBeenCalled();
    expect(provider.api.remove).toHaveBeenCalledWith('widget-1');
    expect(view.availability.at(-1)).toBe('unavailable');
    expect(view.tokens.at(-1)).toBeNull();
    expect(view.container.querySelector('p')?.getAttribute('data-tone')).toBe('danger');
    expect(textIncludes(view.container, AUTH_TURNSTILE_UNAVAILABLE_COPY)).toBe(true);
    expect(view.tokens.some((token) => typeof token === 'string')).toBe(false);
  });

  it('clears a consumed proof and resets when the challenge expires or times out', async () => {
    const provider = fakeProvider();
    harness.loadTurnstileApi = () => Promise.resolve(provider.api);
    const view = await renderWidget();
    provider.widgets[0]?.options.callback('synthetic-turnstile-token');

    act(() => {
      provider.widgets[0]?.options['expired-callback']();
    });
    act(() => {
      provider.widgets[0]?.options['timeout-callback']();
    });

    expect(provider.api.reset).toHaveBeenCalledTimes(2);
    expect(provider.api.reset).toHaveBeenCalledWith('widget-1');
    expect(provider.api.remove).not.toHaveBeenCalled();
    expect(view.tokens.filter((token) => token === null).length).toBeGreaterThan(0);
    expect(view.tokens.at(-1)).toBeNull();
    expect(textIncludes(view.container, AUTH_TURNSTILE_UNAVAILABLE_COPY)).toBe(false);
    expect(view.availability.at(-1)).toBe('ready');
  });

  it('keeps a synchronous reset token and clears the proof when reset fails', async () => {
    const provider = fakeProvider();
    provider.api.reset.mockImplementation(() => {
      provider.widgets[0]?.options.callback('fresh-turnstile-token');
    });
    harness.loadTurnstileApi = () => Promise.resolve(provider.api);
    const view = await renderWidget();
    provider.widgets[0]?.options.callback('expired-turnstile-token');

    act(() => {
      provider.widgets[0]?.options['expired-callback']();
    });

    expect(provider.api.reset).toHaveBeenCalledTimes(1);
    expect(view.tokens).toContain('expired-turnstile-token');
    expect(view.tokens.at(-1)).toBe('fresh-turnstile-token');
    expect(view.availability.at(-1)).toBe('ready');
    expect(provider.api.remove).not.toHaveBeenCalled();

    provider.api.reset.mockImplementation(() => {
      throw new Error('reset failed');
    });
    act(() => {
      provider.widgets[0]?.options['timeout-callback']();
    });

    expect(view.tokens.at(-1)).toBeNull();
    expect(view.availability.at(-1)).toBe('unavailable');
    expect(provider.api.remove).toHaveBeenCalledWith('widget-1');
    expect(textIncludes(view.container, AUTH_TURNSTILE_UNAVAILABLE_COPY)).toBe(true);
  });

  it('shows unavailable and removes the widget when reset throws', async () => {
    const provider = fakeProvider();
    provider.api.reset.mockImplementation(() => {
      throw new Error('reset failed');
    });
    harness.loadTurnstileApi = () => Promise.resolve(provider.api);
    const view = await renderWidget();

    act(() => {
      provider.widgets[0]?.options['expired-callback']();
    });

    expect(provider.api.remove).toHaveBeenCalledWith('widget-1');
    expect(view.availability.at(-1)).toBe('unavailable');
    expect(textIncludes(view.container, AUTH_TURNSTILE_UNAVAILABLE_COPY)).toBe(true);
    expect(view.container.querySelector('button')?.textContent).toBe('Повторить');
  });

  it('shows unavailable when rendering throws', async () => {
    const provider = fakeProvider();
    provider.api.render.mockImplementation(() => {
      throw new Error('render failed');
    });
    harness.loadTurnstileApi = () => Promise.resolve(provider.api);
    const view = await renderWidget();

    expect(provider.api.remove).not.toHaveBeenCalled();
    expect(view.availability.at(-1)).toBe('unavailable');
    expect(view.tokens.length).toBeGreaterThan(0);
    expect(view.tokens.every((token) => token === null)).toBe(true);
    expect(textIncludes(view.container, AUTH_TURNSTILE_UNAVAILABLE_COPY)).toBe(true);
  });

  it('stays unavailable when the provider reports an error while rendering', async () => {
    const provider = fakeProvider();
    provider.api.render.mockImplementation((_container: HTMLElement, options: RenderOptions) => {
      options['error-callback']();
      return 'widget-1';
    });
    harness.loadTurnstileApi = () => Promise.resolve(provider.api);
    const view = await renderWidget();

    expect(provider.api.reset).not.toHaveBeenCalled();
    expect(provider.api.remove).toHaveBeenCalledWith('widget-1');
    expect(view.availability).not.toContain('ready');
    expect(view.availability.at(-1)).toBe('unavailable');
  });

  it.each([
    { os: 'ios', siteKey: SITE_KEY, label: 'native' },
    { os: 'web', siteKey: null, label: 'missing site key' },
  ])('fails closed for $label without a provider or a retry token', async ({ os, siteKey }) => {
    harness.os = os;
    harness.siteKey = siteKey;
    let loads = 0;
    harness.loadTurnstileApi = () => {
      loads += 1;
      return Promise.resolve(fakeProvider().api);
    };
    const view = await renderWidget();

    expect(loads).toBe(0);
    expect(view.availability).toEqual(['unavailable']);
    expect(view.tokens).toEqual([null]);
    expect(textIncludes(view.container, AUTH_TURNSTILE_UNAVAILABLE_COPY)).toBe(true);
    expect(textIncludes(view.container, LOADING_COPY)).toBe(false);
    expect(view.container.querySelector('button')).toBeNull();
    expect(view.container.querySelector('[data-min-width="300"]')).toBeNull();
    expect(view.tokens.some((token) => typeof token === 'string')).toBe(false);
  });

  it('retries the current widget without inventing a proof', async () => {
    const provider = fakeProvider();
    let loads = 0;
    harness.loadTurnstileApi = () => {
      loads += 1;
      if (loads === 1) return Promise.reject(new Error('offline'));
      return Promise.resolve(provider.api);
    };
    const view = await renderWidget('password_reset');
    const retry = view.container.querySelector('button');
    if (!(retry instanceof HTMLButtonElement)) throw new Error('missing retry');

    expect(textIncludes(view.container, AUTH_TURNSTILE_UNAVAILABLE_COPY)).toBe(true);
    expect(view.tokens.some((token) => typeof token === 'string')).toBe(false);

    await act(async () => {
      retry.click();
      await Promise.resolve();
    });

    expect(loads).toBe(2);
    expect(provider.widgets).toHaveLength(1);
    expect(provider.widgets[0]?.options.action).toBe('password_reset');
    expect(provider.widgets[0]?.options.language).toBe('ru');
    expect(view.availability.at(-1)).toBe('ready');
    expect(view.tokens.some((token) => typeof token === 'string')).toBe(false);

    provider.widgets[0]?.options.callback('synthetic-turnstile-token');
    expect(view.tokens.at(-1)).toBe('synthetic-turnstile-token');
  });

  it('uses compact when 250px is available and rerenders on resize without another script load', async () => {
    const provider = fakeProvider();
    let loads = 0;
    harness.loadTurnstileApi = () => {
      loads += 1;
      return Promise.resolve(provider.api);
    };
    const view = await renderWidget('login', 250);

    expect(loads).toBe(1);
    expect(provider.widgets[0]?.options.size).toBe('compact');
    expect(provider.widgets[0]?.options.action).toBe('login');
    expect(provider.widgets[0]?.options.language).toBe('ru');
    expect(view.container.querySelector('[data-min-height="140"]')).toBeTruthy();
    expect(view.container.querySelector('[data-min-width="300"]')).toBeNull();
    provider.widgets[0]?.options.callback('synthetic-turnstile-token');

    await act(async () => {
      harness.onLayout?.({ nativeEvent: { layout: { width: 250, height: 140 } } });
    });
    expect(provider.api.render).toHaveBeenCalledTimes(1);

    const stale = provider.widgets[0]?.options.callback;
    await act(async () => {
      harness.onLayout?.({ nativeEvent: { layout: { width: 360, height: 65 } } });
    });
    stale?.('stale-token');

    expect(loads).toBe(1);
    expect(provider.api.remove).toHaveBeenCalledWith('widget-1');
    expect(provider.widgets[1]?.options.size).toBe('flexible');
    expect(provider.widgets[1]?.options.action).toBe('login');
    expect(view.tokens).toContain('synthetic-turnstile-token');
    expect(view.tokens).not.toContain('stale-token');
    expect(view.tokens.at(-1)).toBeNull();
    expect(view.container.querySelector('[data-min-height="65"]')).toBeTruthy();
    expect(view.container.querySelector('[data-min-width="300"]')).toBeNull();
  });
});
