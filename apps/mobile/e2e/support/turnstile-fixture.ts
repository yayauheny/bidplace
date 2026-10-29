import { expect, type Page } from '@playwright/test';

const TURNSTILE_SCRIPT =
  'https://challenges.cloudflare.com/turnstile/v0/api.js**';
export type TurnstileFixtureMode =
  | 'pass'
  | 'error'
  | 'unavailable'
  | 'error-once';

function fixtureScript(mode: TurnstileFixtureMode): string {
  return `
(() => {
  const widgets = new Map();
  let next = 1;
  let attempts = 0;
  window.turnstile = {
    render(container, options) {
      if (options.execution !== 'execute') throw new Error('Expected submit-time execution');
      const id = String(next++);
      widgets.set(id, { container, options });
      return id;
    },
    execute(id) {
      const widget = widgets.get(id);
      if (!widget) throw new Error('Missing widget');
      attempts += 1;
      document.body.dataset.turnstileExecutions = String(attempts);
      queueMicrotask(() => {
        if (!widgets.has(id)) return;
        if ('${mode}' === 'error' || ('${mode}' === 'error-once' && attempts === 1)) {
          widget.options['error-callback']();
          return;
        }
        widget.options.callback('pass:' + widget.options.action + ':localhost:' + crypto.randomUUID());
      });
    },
    remove(id) { widgets.delete(id); },
    reset() { throw new Error('Each submission requires a fresh execution'); },
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
      body: fixtureScript(mode),
    });
  });
}

export function assertScriptedProof(token: unknown, action: string): void {
  const pattern = new RegExp(`^pass:${action}:localhost:[0-9a-f-]{36}$`, 'i');
  if (typeof token !== 'string' || !pattern.test(token)) {
    throw new Error(`Expected a fresh scripted ${action} proof`);
  }
}

export async function expectInvisibleTurnstile(page: Page): Promise<void> {
  await expect(page.getByLabel('Проверка безопасности')).toHaveCount(0);
  const hosts = page.locator('[data-invisible-turnstile]');
  for (const host of await hosts.all()) {
    const box = await host.boundingBox();
    expect(box?.height ?? 0).toBe(0);
  }
}
