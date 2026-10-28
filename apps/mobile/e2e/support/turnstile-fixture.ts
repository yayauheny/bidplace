import { expect, type Page } from '@playwright/test';

const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js**';
const FLEXIBLE_MIN_WIDTH = 300;
const FLEXIBLE_MIN_HEIGHT = 65;
const COMPACT_MIN_HEIGHT = 140;

export type TurnstileFixtureMode = 'pass' | 'error' | 'unavailable';

function fixtureScript(failClosed: boolean): string {
  const fail = failClosed ? 'true' : 'false';
  return `
(() => {
  const widgets = new Map();
  let next = 1;
  window.turnstile = {
    render(container, options) {
      const id = String(next++);
      const node = document.createElement('div');
      node.dataset.turnstileAction = options.action;
      node.dataset.turnstileSize = options.size;
      node.dataset.turnstileReady = 'false';
      node.style.boxSizing = 'border-box';
      node.style.display = 'block';
      if (options.size === 'compact') {
        node.style.width = '150px';
        node.style.height = '140px';
      } else {
        node.style.width = '100%';
        node.style.minWidth = '300px';
        node.style.height = '65px';
        node.style.minHeight = '65px';
      }
      container.append(node);
      widgets.set(id, { node, options });
      queueMicrotask(() => {
        const widget = widgets.get(id);
        if (!widget) return;
        if (${fail}) {
          widget.options['error-callback']();
          return;
        }
        widget.options.callback(
          'pass:' + widget.options.action + ':localhost:' + crypto.randomUUID(),
        );
        widget.node.dataset.turnstileReady = 'true';
      });
      return id;
    },
    remove(id) {
      const widget = widgets.get(id);
      if (widget) widget.node.remove();
      widgets.delete(id);
    },
    reset(id) {
      const widget = widgets.get(id);
      if (!widget || ${fail}) return;
      widget.node.dataset.turnstileReady = 'false';
      queueMicrotask(() => {
        const current = widgets.get(id);
        if (!current) return;
        current.options.callback(
          'pass:' + current.options.action + ':localhost:' + crypto.randomUUID(),
        );
        current.node.dataset.turnstileReady = 'true';
      });
    },
  };
})();
`;
}

export async function installTurnstileFixture(
  page: Page,
  mode: TurnstileFixtureMode = 'pass',
): Promise<void> {
  await page.unroute(TURNSTILE_SCRIPT);
  await page.route(TURNSTILE_SCRIPT, async (route) => {
    if (mode === 'unavailable') {
      await route.abort('failed');
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: fixtureScript(mode === 'error'),
    });
  });
}

export function assertScriptedProof(token: unknown, action: string): void {
  const pattern = new RegExp(`^pass:${action}:localhost:[0-9a-f-]{36}$`, 'i');
  if (typeof token !== 'string' || !pattern.test(token)) {
    throw new Error(`Expected a fresh scripted ${action} proof`);
  }
}

export async function expectTurnstileReady(page: Page, action: string): Promise<void> {
  await expect(
    page.locator(`[data-turnstile-action="${action}"][data-turnstile-ready="true"]`),
  ).toBeVisible();
}

export async function expectTurnstileSizeForHost(page: Page): Promise<void> {
  const frame = page.getByLabel('Проверка безопасности');
  await expect(frame).toBeVisible();
  const marker = frame.locator('[data-turnstile-size]');
  const size = await marker.getAttribute('data-turnstile-size');
  const markerBox = await marker.boundingBox();
  const hostWidth = await marker.evaluate((node) => node.parentElement?.getBoundingClientRect().width ?? 0);
  if (markerBox === null || hostWidth <= 0 || (size !== 'compact' && size !== 'flexible')) {
    throw new Error('Turnstile frame has no sized fixture');
  }
  const expected = hostWidth < FLEXIBLE_MIN_WIDTH ? 'compact' : 'flexible';
  expect(size).toBe(expected);
  if (size === 'compact') {
    expect(Math.round(markerBox.width)).toBe(150);
    expect(Math.round(markerBox.height)).toBe(COMPACT_MIN_HEIGHT);
    return;
  }
  expect(Math.round(markerBox.height)).toBe(FLEXIBLE_MIN_HEIGHT);
  expect(Math.round(markerBox.width)).toBe(Math.round(hostWidth));
  expect(markerBox.width).toBeGreaterThanOrEqual(FLEXIBLE_MIN_WIDTH);
}
