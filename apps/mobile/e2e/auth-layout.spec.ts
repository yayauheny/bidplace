import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { assignAuthClientIp } from './support/auth-client-ip';
import {
  AUTH_BROWSER_VIEWPORTS,
  viewportLabel,
} from './support/auth-viewports';
import { e2eEvidenceDir } from './support/evidence-dir';
import { expectPasswordVisibility } from './support/fill-control';
import { finishRegistrationEmailProof } from './support/auth-browser-flow';
import {
  expectTurnstileReady,
  installTurnstileFixture,
} from './support/turnstile-fixture';
import {
  acceptRegistrationConsents,
  installLegalDocumentsFixture,
} from './support/legal-documents-fixture';

const artifactDir = resolve(e2eEvidenceDir, 'stabilization');
const nicknameArtifactDir = resolve(
  e2eEvidenceDir,
  '2026-10-09-nickname-suggestions',
);
const removedIntro = 'Искусство встречает своего следующего владельца.';

test.beforeEach(async ({ context }) => {
  await assignAuthClientIp(context);
});

test('filled login closes without confirmation and providers stay unavailable', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && /does not recognize/.test(message.text()))
      errors.push(message.text());
  });
  await page.setViewportSize({ width: 390, height: 874 });
  await installLegalDocumentsFixture(page);
  await page.goto('/login');
  const email = page.getByRole('textbox', { name: 'Электронная почта', exact: true });
  const password = page.getByLabel('Пароль', { exact: true });
  const loginTitle = page.getByText('Вход на Bidplace', { exact: true });
  const privacyLinkName = 'политикой персональных данных и cookies';
  await expect(page.getByRole('textbox', { name: 'Электронная почта', exact: true })).toBeFocused();
  await email.fill('a');
  await password.fill('visual-password-123');
  await expectPasswordVisibility(password);
  await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);
  await page.getByRole('button', { name: 'Закрыть', exact: true }).focus();
  await page.getByRole('button', { name: 'Закрыть', exact: true }).press('Enter');
  await expect(page.getByText('Прервать вход', { exact: true })).toHaveCount(0);
  await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);
  await expect(loginTitle).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/login');
  await expect(loginTitle).toBeVisible();
  await email.fill('escape@example.com');
  await password.fill('visual-password-123');
  await page.keyboard.press('Escape');
  await expect(page.getByText('Прервать вход', { exact: true })).toHaveCount(0);
  await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);
  await expect(loginTitle).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/login');
  await expect(loginTitle).toBeVisible();
  await email.fill('backdrop@example.com');
  await password.fill('visual-password-123');
  const sheet = page.locator('#auth-sheet');
  await expect(sheet).toBeVisible();
  // Actionability probe: trial click waits for a stable bounding box (same box
  // across two animation frames) without dispatching the click, so the
  // measured sheet is at rest and the point above it is real backdrop.
  await sheet.click({ trial: true });
  const sheetBox = await sheet.boundingBox();
  expect(sheetBox).not.toBeNull();
  await page.mouse.click(
    sheetBox!.x + sheetBox!.width / 2,
    Math.max(8, sheetBox!.y - 20),
  );
  await expect(page.getByText('Прервать вход', { exact: true })).toHaveCount(0);
  await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);
  await expect(loginTitle).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/login');
  await expect(loginTitle).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Электронная почта', exact: true })).toBeFocused();
  await email.fill('a');
  await password.fill('visual-password-123');
  await page
    .getByRole('button', { name: 'Войти с Google', exact: true })
    .click();
  await expect(
    page.getByText('Вход через Google пока недоступен'),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Войти с Telegram', exact: true })
    .click();
  await expect(
    page.getByText('Вход через Telegram пока недоступен'),
  ).toBeVisible();
  await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);
  await expect(loginTitle).toBeVisible();

  await mkdir(artifactDir, { recursive: true });
  const loginUrl = page.url();
  const seen = new Set<string>();
  for (const viewport of [
    ...AUTH_BROWSER_VIEWPORTS,
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    seen.add(viewportLabel(viewport));
    await page.setViewportSize(viewport);
    expect(page.url()).toBe(loginUrl);
    await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);
    await expect(loginTitle).toBeVisible();
    await page
      .getByRole('link', { name: privacyLinkName, exact: true })
      .click();
    await expectCenteredSurface(page, '#app-dialog-content');
    const policy = page
      .locator('#app-dialog-content')
      .getByText('Политика персональных данных и cookies', {
        exact: true,
      });
    const content = page.locator('#app-dialog-content');
    const titleBox = await policy.boundingBox();
    const contentBox = await content.boundingBox();
    expect(titleBox).not.toBeNull();
    expect(contentBox).not.toBeNull();
    expect(titleBox!.x).toBeGreaterThanOrEqual(contentBox!.x);
    expect(titleBox!.x + titleBox!.width).toBeLessThanOrEqual(
      contentBox!.x + contentBox!.width,
    );
    await expect(content).toHaveJSProperty('scrollLeft', 0);
    expect(
      await content.evaluate((node) => node.scrollWidth <= node.clientWidth),
    ).toBe(true);
    await captureAuthSurface(
      page,
      content,
      resolve(
        artifactDir,
        `${engine(page)}-auth-policy-${viewport.width}x${viewport.height}.png`,
      ),
    );
    await page.keyboard.press('Escape');
    await expect(policy).toHaveCount(0);
    await expect(
      page.getByRole('link', {
        name: privacyLinkName,
        exact: true,
      }),
    ).toBeFocused();
    await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);
    await expect(loginTitle).toBeVisible();
  }
  await page
    .getByRole('link', { name: 'пользовательским соглашением', exact: true })
    .click();
  await expectCenteredSurface(page, '#app-dialog-content');
  await expect(
    page.getByText('Пользовательское соглашение', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Закрыть окно', exact: true }).click();
  await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);
  await expect(loginTitle).toBeVisible();
  await page.setViewportSize({ width: 390, height: 874 });
  // Reflow uses CSS viewport size; CSS zoom does not emulate browser zoom.
  await page.setViewportSize({ width: 320, height: 583 });
  const privacyAtZoom = page
    .locator('#auth-sheet')
    .getByRole('link', { name: privacyLinkName, exact: true });
  await clickAtHitCenter(page, privacyAtZoom);
  expect(
    await page
      .locator('#app-dialog-content')
      // WebKit can round fractional layout widths up by one pixel.
      .evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
  ).toBe(true);
  const closeAtZoom = page.getByRole('button', {
    name: 'Закрыть окно',
    exact: true,
  });
  await expect(closeAtZoom).toBeInViewport();
  await clickAtHitCenter(page, closeAtZoom);
  await page.setViewportSize({ width: 390, height: 874 });
  await email.fill('login-layout@example.com');
  for (const failure of [
    {
      status: 401,
      code: 'unauthorized',
      message: 'Invalid credentials',
      copy: 'Неверная почта или пароль',
    },
    {
      status: 429,
      code: 'rate_limited',
      message: 'Слишком много запросов. Попробуйте немного позже.',
      copy: 'Слишком много запросов. Попробуйте немного позже.',
    },
    {
      status: 500,
      code: 'internal_error',
      message: 'Internal server error',
      copy: 'Проверьте соединение и попробуйте ещё раз.',
    },
  ]) {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: failure.status,
        json: {
          status: failure.status,
          code: failure.code,
          message: failure.message,
        },
      }),
    );
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
    await expect(
      page.getByText(failure.copy, { exact: true }).last(),
    ).toBeVisible();
    if (failure.status !== 401) {
      await expect(
        page.getByText('Неверная почта или пароль', { exact: true }),
      ).toHaveCount(0);
    }
    await page.unroute('**/api/auth/login');
  }
  expect([...seen]).toEqual(
    expect.arrayContaining(AUTH_BROWSER_VIEWPORTS.map(viewportLabel)),
  );
  await page.setViewportSize({ width: 390, height: 400 });
  // Reflow uses CSS viewport size; CSS zoom does not emulate browser zoom.
  await page.setViewportSize({ width: 320, height: 583 });
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({
      status: 429,
      json: { status: 429, code: 'rate_limited', message: 'Too many requests' },
    }),
  );
  await clickAtHitCenter(
    page,
    page.getByRole('button', { name: 'Войти', exact: true }),
  );
  const limited = page
    .getByText('Слишком много запросов. Попробуйте немного позже.', {
      exact: true,
    })
    .last();
  await expect(limited).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Войти', exact: true }),
  ).toBeInViewport();
  await page.setViewportSize({ width: 390, height: 874 });
  await page.unroute('**/api/auth/login');
  expect(errors).toEqual([]);
});

async function expectCenteredSurface(page: Page, selector: string) {
  const surface = page.locator(selector);
  await expect(surface).toBeVisible();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  await expect
    .poll(async () => {
      const box = await surface.boundingBox();
      return (
        box !== null &&
        Math.abs(box.x - (viewport!.width - box.width) / 2) <= 1 &&
        box.y >= 0 &&
        box.y + box.height <= viewport!.height
      );
    })
    .toBe(true);
}

test('browser back leaves a filled login and confirms a filled registration', async ({
  page,
}) => {
  await expectAuthBrowserHistory(page, true);
});

test('browser back leaves a filled login without the Navigation API', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'navigation', {
      configurable: true,
      get: () => undefined,
    });
  });
  await expectAuthBrowserHistory(page, false);
});

test('after aborting a filled registration the next Back and Forward walk real history', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('app-shell-content')).toBeVisible();
  await openWorksCatalog(page);
  await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?redirectTo=%2Fworks$/);
  await page.route('**/api/auth/legal', (route) =>
    route.fulfill({
      json: {
        version: 'history-test',
        documents: [
          {
            id: 'agreement',
            title: 'Пользовательское соглашение',
            markdown: 'Текст соглашения.',
            version: 'history-test',
          },
          {
            id: 'privacy',
            title: 'Политика персональных данных и cookies',
            markdown: 'Текст политики.',
            version: 'history-test',
          },
          {
            id: 'data-consent',
            title: 'Согласие на обработку персональных данных',
            markdown: 'Текст согласия.',
            version: 'history-test',
          },
          {
            id: 'author-rules',
            title: 'Правила авторов',
            markdown: 'Текст правил.',
            version: 'history-test',
          },
          {
            id: 'prohibited',
            title: 'Запрещённый контент',
            markdown: 'Текст.',
            version: 'history-test',
          },
        ],
      },
    }),
  );
  await page.route('**/api/auth/rules', (route) =>
    route.fulfill({
      json: {
        rules: {
          version: 'history-test',
          owner: 'Synthetic',
          contact: 'test@example.com',
          text: 'Synthetic layout fixture',
        },
      },
    }),
  );
  await page.getByRole('link', { name: 'Регистрация', exact: true }).click();
  await expect(page).toHaveURL(/\/register\?redirectTo=%2Fworks$/);
  const registerEmail = page.locator('#auth-sheet').getByLabel('Электронная почта', { exact: true });
  await expect(page.getByRole('textbox', { name: 'Электронная почта', exact: true })).toBeFocused();
  await registerEmail.fill(`history-${Date.now()}@example.com`);
  await acceptRegistrationConsents(page);
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  const nickname = page.getByLabel('Никнейм', { exact: true });
  await expect(nickname).toBeVisible();
  await nickname.fill('historyauthor');

  // Multi-step Back lands on the remembered screen and asks to abort.
  await historyStep(page, -2);
  await expect(
    page.getByText('Прервать регистрацию', { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/register\?redirectTo=%2Fworks$/);
  await page.getByRole('button', { name: 'Прервать', exact: true }).click();
  await expect(page).toHaveURL(/\/works$/);

  // Back walks the real entries (the original works entry, then Home) and
  // Forward replays the remaining entries as fresh screens — the aborted
  // registration form never comes back.
  const registerStep = page.getByText('Выберите имя пользователя', {
    exact: true,
  });
  await historyStep(page, -1);
  await expect(page).toHaveURL(/\/$/);
  await expect(registerStep).toHaveCount(0);
  await historyStep(page, 1);
  await expect(page).toHaveURL(/\/works$/);
  await expect(registerStep).toHaveCount(0);
  await historyStep(page, 1);
  await expect(page).toHaveURL(/\/login\?redirectTo=%2Fworks$/);
  await expect(registerStep).toHaveCount(0);
  await historyStep(page, 1);
  await expect(
    page.getByText('Введите вашу почту', { exact: true }),
  ).toBeVisible();
  await expect(registerStep).toHaveCount(0);
});

test('history position stays one number per entry', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('app-shell-content')).toBeVisible();
  const pushed = await page.evaluate(() => {
    const href = window.location.href;
    const state = window.history.state as {
      id?: string;
      index?: number;
    } | null;
    const id = state?.id;
    const start = state?.index ?? 0;
    const copied = Array.from({ length: 81 }, (_, step) => `entry-${step}`);
    for (let step = 0; step < 80; step += 1) {
      window.history.pushState(
        {
          ...(window.history.state ?? {}),
          id,
          entries: copied.slice(0, step + 1),
          __bidplaceProductDraftGuard: `g${step}`,
        },
        '',
        href,
      );
    }
    const stored = window.history.state as Record<string, unknown> | null;
    return {
      id,
      start,
      length: window.history.length,
      index: stored?.index,
      guard: stored?.__bidplaceProductDraftGuard,
      storedId: stored?.id,
      hasEntries: stored != null && 'entries' in stored,
    };
  });
  expect(pushed.hasEntries).toBe(false);
  expect(pushed.storedId).toBe(pushed.id);
  expect(pushed.guard).toBe('g79');
  expect(pushed.index).toBe(pushed.start + 80);
  if (page.context().browser()?.browserType().name() === 'chromium') {
    expect(pushed.length).toBe(50);
    expect(Number(pushed.index)).toBeGreaterThan(pushed.length);
  }

  await historyStep(page, -1);
  await expect
    .poll(() => page.evaluate(() => window.history.state?.index))
    .toBe(Number(pushed.index) - 1);
  await expect
    .poll(() => page.evaluate(() => 'entries' in (window.history.state ?? {})))
    .toBe(false);

  const branched = await page.evaluate((id) => {
    window.history.pushState(
      {
        ...(window.history.state ?? {}),
        id,
        entries: Array.from({ length: 90 }, (_, step) => `entry-${step}`),
        __bidplaceProductDraftGuard: 'branch',
      },
      '',
      window.location.href,
    );
    const stored = window.history.state as Record<string, unknown> | null;
    return {
      index: stored?.index,
      guard: stored?.__bidplaceProductDraftGuard,
      storedId: stored?.id,
      hasEntries: stored != null && 'entries' in stored,
    };
  }, pushed.id);
  expect(branched.hasEntries).toBe(false);
  expect(branched.storedId).toBe(pushed.id);
  expect(branched.guard).toBe('branch');
  expect(branched.index).toBe(pushed.index);

  const replaced = await page.evaluate((id) => {
    window.history.replaceState(
      { id, entries: ['a', 'b', 'c'] },
      '',
      window.location.href,
    );
    const stored = window.history.state as Record<string, unknown> | null;
    return {
      index: stored?.index,
      guard: stored?.__bidplaceProductDraftGuard,
      storedId: stored?.id,
      hasEntries: stored != null && 'entries' in stored,
    };
  }, pushed.id);
  expect(replaced.hasEntries).toBe(false);
  expect(replaced.storedId).toBe(pushed.id);
  expect(replaced.guard).toBe('branch');
  expect(replaced.index).toBe(branched.index);
});

async function expectAuthBrowserHistory(page: Page, navigationApi: boolean) {
  await page.setViewportSize({ width: 390, height: 874 });
  await installLegalDocumentsFixture(page);
  await page.goto('/');
  expect(await page.evaluate(() => 'navigation' in window && window.navigation != null)).toBe(
    navigationApi,
  );
  await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  const loginTitle = page.getByText('Вход на Bidplace', { exact: true });
  await expect(loginTitle).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Основная навигация' }),
  ).toHaveCount(0);
  const email = page.getByRole('textbox', { name: 'Электронная почта', exact: true });
  const password = page.getByLabel('Пароль', { exact: true });
  await expect(page.getByRole('textbox', { name: 'Электронная почта', exact: true })).toBeFocused();
  await email.fill('a');
  await email.fill('');
  await historyStep(page, -1);
  await expect(page.getByText('Прервать вход', { exact: true })).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(loginTitle).toHaveCount(0);
  await expect(
    page.getByRole('navigation', { name: 'Основная навигация' }),
  ).toHaveCount(1);

  await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(loginTitle).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Электронная почта', exact: true })).toBeFocused();
  await email.fill('a');
  await password.fill('visual-password-123');
  await historyStep(page, -1);
  await expect(page.getByText('Прервать вход', { exact: true })).toHaveCount(0);
  await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(loginTitle).toHaveCount(0);
  await historyStep(page, 1);
  await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);

  await page.goto('/');
  await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(loginTitle).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  await expect(loginTitle).toBeVisible();
  await email.fill('r');
  await password.fill('visual-password-123');
  await historyStep(page, -1);
  await expect(page.getByText('Прервать вход', { exact: true })).toHaveCount(0);
  await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(loginTitle).toHaveCount(0);

  await page.goto('/login');
  await expect(loginTitle).toBeVisible();
  await page.getByRole('link', { name: 'Регистрация', exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(
    page.getByText('Введите вашу почту', { exact: true }),
  ).toBeVisible();
  await page.getByRole('textbox', { name: 'Электронная почта', exact: true }).fill('author@example.com');
  await historyStep(page, -1);
  await expect(
    page.getByText('Прервать регистрацию', { exact: true }),
  ).toHaveCount(0);
  await expect(page).toHaveURL(/\/login$/);
  await expect(loginTitle).toBeVisible();
  await expect(
    page.getByText('Введите вашу почту', { exact: true }),
  ).toHaveCount(0);

  await page.goto('/');
  await openWorksCatalog(page);
  await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?redirectTo=%2Fworks$/);
  await page.getByRole('link', { name: 'Регистрация', exact: true }).click();
  await expect(page).toHaveURL(/\/register\?redirectTo=%2Fworks$/);
  await historyStep(page, -2);
  await expect(
    page.getByText('Прервать регистрацию', { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);
  await expect(page).toHaveURL(/\/works$/);

  await page.goto('/');
  await openWorksCatalog(page);
  await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?redirectTo=%2Fworks$/);
  await page.getByRole('link', { name: 'Регистрация', exact: true }).click();
  await expect(page).toHaveURL(/\/register\?redirectTo=%2Fworks$/);
  const registerEmail = page.locator('#auth-sheet').getByLabel('Электронная почта', { exact: true });
  await expect(page.getByRole('textbox', { name: 'Электронная почта', exact: true })).toBeFocused();
  await registerEmail.fill('kept@example.com');
  await acceptRegistrationConsents(page);
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  const nickname = page.getByLabel('Никнейм', { exact: true });
  await expect(nickname).toBeVisible();
  await nickname.fill('author');
  await historyStep(page, -2);
  const registrationExit = page.getByText('Прервать регистрацию', {
    exact: true,
  });
  await expect(registrationExit).toBeVisible();
  await expect(page).toHaveURL(/\/register\?redirectTo=%2Fworks$/);
  await expect(
    page.getByText('Выберите имя пользователя', { exact: true }),
  ).toBeVisible();
  await expect(nickname).toHaveValue('author');
  const panel = page.locator('#auth-exit-confirm');
  await expect(panel).toBeVisible();
  const panelBox = await panel.boundingBox();
  expect(panelBox).not.toBeNull();
  expect(panelBox!.width).toBeCloseTo(366, 0);
  expect(panelBox!.x).toBeCloseTo((390 - panelBox!.width) / 2, 0);
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(page).toHaveURL(/\/register\?redirectTo=%2Fworks$/);
  await expect(
    page.getByText('Выберите имя пользователя', { exact: true }),
  ).toBeVisible();
  await expect(nickname).toHaveValue('author');
  await expect(nickname).toBeFocused();
  await expect(registerEmail).toHaveCount(0);
  await historyStep(page, -2);
  await page.getByRole('button', { name: 'Прервать', exact: true }).click();
  await expect(page).toHaveURL(/\/works$/);
  await expect(
    page.getByText('Выберите имя пользователя', { exact: true }),
  ).toHaveCount(0);

  await page.goto('/');
  await openWorksCatalog(page);
  await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  await page.getByRole('link', { name: 'Регистрация', exact: true }).click();
  await expect(page).toHaveURL(/\/register\?redirectTo=%2Fworks$/);
  await page.reload();
  await expect(page).toHaveURL(/\/register\?redirectTo=%2Fworks$/);
  await expect(
    page.getByText('Введите вашу почту', { exact: true }),
  ).toBeVisible();
  const reloadedEmail = page.locator('#auth-sheet').getByLabel('Электронная почта', { exact: true });
  await expect(reloadedEmail).toBeFocused();
  await reloadedEmail.fill('reloaded@example.com');
  await historyStep(page, -2);
  await expect(
    page.getByText('Прервать регистрацию', { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/register\?redirectTo=%2Fworks$/);
  await expect(
    page.getByText('Введите вашу почту', { exact: true }),
  ).toBeVisible();
  await expect(reloadedEmail).toHaveValue('reloaded@example.com');
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(page).toHaveURL(/\/register\?redirectTo=%2Fworks$/);
  await expect(reloadedEmail).toHaveValue('reloaded@example.com');
  await expect(reloadedEmail).toBeFocused();
  await historyStep(page, -2);
  await page.getByRole('button', { name: 'Прервать', exact: true }).click();
  await expect(page).toHaveURL(/\/works$/);

  await page.goto('/');
  await openWorksCatalog(page);
  await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?redirectTo=%2Fworks$/);
  await expect(loginTitle).toBeVisible();
  await email.fill('b');
  await password.fill('visual-password-123');
  await historyStep(page, -2);
  await expect(page.getByText('Прервать вход', { exact: true })).toHaveCount(0);
  await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(loginTitle).toHaveCount(0);

  await page.goto('/');
  await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(loginTitle).toBeVisible();
  await pushWorksFromBackground(page);
  await expect(page).toHaveURL(/\/works$/);
  await expect(
    page.getByText('Каталог работ на Bidplace', { exact: true }),
  ).toBeVisible();
  await expect(loginTitle).not.toBeVisible();
  await historyStep(page, -1);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Прервать вход', { exact: true })).toHaveCount(0);
  await expect(loginTitle).toBeVisible();
  await email.fill('c');
  await password.fill('visual-password-123');
  await historyStep(page, 1);
  await expect(page.getByText('Прервать вход', { exact: true })).toHaveCount(0);
  await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);
  await expect(page).toHaveURL(/\/works$/);
  await expect(loginTitle).not.toBeVisible();
  await expect(
    page.getByText('Каталог работ на Bidplace', { exact: true }),
  ).toBeVisible();

  await page.goto('/register');
  await expect(
    page.getByText('Введите вашу почту', { exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByText('Прервать регистрацию', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText('Введите вашу почту', { exact: true }),
  ).toHaveCount(0);

  await page.goto('/register');
  await expect(
    page.getByText('Введите вашу почту', { exact: true }),
  ).toBeVisible();
  const escapeEmail = page.locator('#auth-sheet').getByLabel('Электронная почта', { exact: true });
  await expect(escapeEmail).toBeFocused();
  await escapeEmail.fill('escape-register@example.com');
  await page.keyboard.press('Escape');
  await expect(
    page.getByText('Прервать регистрацию', { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
  await expect(escapeEmail).toHaveValue('escape-register@example.com');
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(
    page.getByText('Введите вашу почту', { exact: true }),
  ).toBeVisible();
  await expect(escapeEmail).toHaveValue('escape-register@example.com');
  await expect(escapeEmail).toBeFocused();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Прервать', exact: true }).click();
  await expect(
    page.getByText('Прервать регистрацию', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText('Введите вашу почту', { exact: true }),
  ).toHaveCount(0);
}

test('register email title layout is stable across viewport resize', async ({
  page,
}) => {
  await installLegalDocumentsFixture(page);
  const title = () => page.getByText('Введите вашу почту', { exact: true });

  async function titleMarkLayout() {
    return page.evaluate(() => {
      const titleEl = [...document.querySelectorAll('*')].find(
        (node) => node.textContent?.trim() === 'Введите вашу почту',
      );
      if (!(titleEl instanceof HTMLElement)) return null;
      const titleTop = titleEl.getBoundingClientRect().top;
      const markSvg = [...document.querySelectorAll('svg')].find((svg) => {
        const rect = svg.getBoundingClientRect();
        return rect.width > 25 && rect.width < 36 && rect.top < 120;
      });
      const markBottom = markSvg?.getBoundingClientRect().bottom ?? 0;
      return { titleTop, markBottom };
    });
  }

  async function expectTitleClearOfMark() {
    await expect
      .poll(async () => {
        const layout = await titleMarkLayout();
        return layout !== null && layout.titleTop >= layout.markBottom - 0.5;
      })
      .toBe(true);
  }

  async function emailTitleY() {
    const box = await title().boundingBox();
    expect(box).not.toBeNull();
    return box!.y;
  }

  async function settledEmailTitleY() {
    let previous: number | null = null;
    await expect
      .poll(async () => {
        const y = await emailTitleY();
        if (previous !== null && Math.abs(y - previous) < 0.5) return y;
        previous = y;
        return Number.NaN;
      })
      .not.toBeNaN();
    return emailTitleY();
  }

  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/register');
  await expect(title()).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Электронная почта', exact: true })).toBeFocused();
  await page.evaluate(() => document.fonts.ready);
  const initialTitleY = await settledEmailTitleY();
  await expectTitleClearOfMark();
  await expect(
    page.getByRole('navigation', { name: 'Основная навигация' }),
  ).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 437 });
  await expectTitleClearOfMark();

  await page.setViewportSize({ width: 390, height: 400 });
  await expectTitleClearOfMark();
  const shortAfterShrink = await settledEmailTitleY();

  await page.setViewportSize({ width: 390, height: 600 });
  await expectTitleClearOfMark();
  const mediumAfterShrink = await settledEmailTitleY();

  await page.setViewportSize({ width: 390, height: 874 });
  await expectTitleClearOfMark();
  await expect.poll(emailTitleY).toBeCloseTo(initialTitleY, 0);

  await page.setViewportSize({ width: 390, height: 400 });
  await page.goto('/register');
  await expectTitleClearOfMark();
  const freshShort = await settledEmailTitleY();
  expect(shortAfterShrink).toBeCloseTo(freshShort, 0);

  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto('/register');
  await expectTitleClearOfMark();
  const freshMedium = await settledEmailTitleY();
  expect(mediumAfterShrink).toBeCloseTo(freshMedium, 0);

  await page.setViewportSize({ width: 390, height: 400 });
  await page.goto('/register');
  await expectTitleClearOfMark();
  await acceptRegistrationConsents(page);
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await expect(
    page.getByText('Введите корректный email', { exact: true }),
  ).toBeVisible();
  const submit = page.getByRole('button', { name: 'Дальше', exact: true });
  await submit.scrollIntoViewIfNeeded();
  await expect(submit).toBeVisible();
  expect(
    await page.evaluate(() => document.body.scrollWidth <= window.innerWidth),
  ).toBe(true);

  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/register');
  await expect(title()).toBeVisible();
  await expectTitleClearOfMark();
  expect(
    await page.evaluate(() => document.body.scrollWidth <= window.innerWidth),
  ).toBe(true);
  await expect(
    page.getByRole('navigation', { name: 'Основная навигация' }),
  ).toHaveCount(0);

  await page.setViewportSize({ width: 440, height: 956 });
  await page.goto('/register');
  await expect(title()).toBeVisible();
  await expectTitleClearOfMark();
  expect(
    await page.evaluate(() => document.body.scrollWidth <= window.innerWidth),
  ).toBe(true);
  // Wave-1 width policy: at <=600 the dialog host fills the viewport width,
  // the 390 column starts above 600 (03-DESIGN-SYSTEM).
  const frame = await page.getByRole('dialog').boundingBox();
  const viewport = page.viewportSize();
  expect(frame).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(frame!.width).toBeCloseTo(viewport!.width, 1);
  expect(frame!.x).toBe(0);
});

test('auth composition keeps a centered form inside the fullscreen registration', async ({ page }) => {
  await mkdir(artifactDir, { recursive: true });
  await installTurnstileFixture(page);
  await installLegalDocumentsFixture(page);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/register');
  await expectS4Register(page);
  await expectCenteredPhoneColumn(page);
  // The fullscreen register screen renders its own mark; the home page logo
  // behind it is fully covered, so the auth composition is scoped to the dialog.
  const authSurface = page.getByRole('dialog');
  for (const brand of [
    authSurface.getByTestId('bidplace-brand-mark'),
    authSurface.getByTestId('bidplace-brand-wordmark'),
  ]) {
    await expect(brand).toHaveCount(1);
    expect(
      await brand.evaluate((svg) => {
        const style = getComputedStyle(svg);
        return {
          tagName: svg.tagName,
          tabIndex: svg.getAttribute('tabindex'),
          userSelect: style.userSelect || style.webkitUserSelect,
          webkitUserSelect: style.webkitUserSelect,
        };
      }),
    ).toEqual({
      tagName: 'svg',
      tabIndex: null,
      userSelect: 'none',
      webkitUserSelect: 'none',
    });
  }
  await page.screenshot({
    path: resolve(artifactDir, `${engine(page)}-register-1440.png`),
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/register');
  await expectS4Register(page);
  await expectCenteredPhoneColumn(page);
  expect(
    await page.evaluate(() => document.body.scrollWidth <= window.innerWidth),
  ).toBe(true);
  await page.screenshot({
    path: resolve(artifactDir, `${engine(page)}-register-390.png`),
  });

  let availabilityRequests = 0;
  await page.route('**/api/auth/slug-availability?*', (route) => {
    availabilityRequests += 1;
    return route.fulfill({ json: { available: true } });
  });
  await expect(page.getByRole('textbox', { name: 'Электронная почта', exact: true })).toBeFocused();
  await page.getByRole('textbox', { name: 'Электронная почта', exact: true }).fill('layout-only@example.com');
  await acceptRegistrationConsents(page);
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  const nickname = page.getByLabel('Никнейм', { exact: true });
  const suggestionButtons = page
    .locator('#nickname-suggestions')
    .getByRole('button');
  await expect(suggestionButtons).toHaveCount(3);
  const suggestionLabels = await suggestionButtons.allTextContents();
  expect(new Set(suggestionLabels).size).toBe(3);
  expect(
    suggestionLabels.every(
      (suggestion) =>
        /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(suggestion) &&
        suggestion.length >= 3 &&
        suggestion.length <= 20,
    ),
  ).toBe(true);
  await suggestionButtons.first().click();
  await expect(nickname).toHaveValue(suggestionLabels[0]!);
  expect(availabilityRequests).toBe(0);
  await page.setViewportSize({ width: 390, height: 874 });
  await mkdir(nicknameArtifactDir, { recursive: true });
  await page.screenshot({
    path: resolve(
      nicknameArtifactDir,
      `${engine(page)}-register-nickname-390x874.png`,
    ),
  });
  for (const slug of ['ab', 'a'.repeat(21)]) {
    await nickname.fill(slug);
    await page.getByRole('button', { name: 'Дальше', exact: true }).click();
    await expect(
      page.getByText('Никнейм должен содержать от 3 до 20 символов', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(nickname).toBeVisible();
  }
  expect(availabilityRequests).toBe(0);
  await nickname.fill('a'.repeat(20));
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  const password = page.getByLabel('Введите пароль', { exact: true });
  await expect(password).toBeVisible();
  expect(availabilityRequests).toBe(1);
  await expectTurnstileReady(page, 'register');
  const confirmation = page.getByLabel('Подтвердите пароль', { exact: true });
  await password.fill('layout-password-123');
  await confirmation.fill('layout-password-123');
  await expectPasswordVisibility(password);
  await expectPasswordVisibility(confirmation);
  await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 400 });
  await captureAuthSurface(
    page,
    page.getByText('Создайте пароль', { exact: true }),
    resolve(artifactDir, `${engine(page)}-register-password-390x400.png`),
  );

  await page.goto('/reset-password?token=layout-only-synthetic');
  const resetPassword = page.getByRole('textbox', {
    name: 'Новый пароль',
    exact: true,
  });
  const resetConfirmation = page.getByLabel('Подтверждение пароля', {
    exact: true,
  });
  await resetPassword.fill('layout-password-123');
  await resetConfirmation.fill('layout-password-123');
  await expectPasswordVisibility(resetPassword);
  await expectPasswordVisibility(resetConfirmation);
  await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);
  await page.getByRole('button', { name: 'Закрыть', exact: true }).focus();
  await page.getByRole('button', { name: 'Закрыть', exact: true }).press('Enter');
  await expect(
    page.getByText('Новый пароль не сохранится, пока форма не отправлена.', {
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByText('Прервать восстановление', { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);
  await expect(resetPassword).toHaveCount(0);

  await page.goto('/forgot-password');
  await expect(
    page.getByText('Восстановление пароля', { exact: true }),
  ).toBeVisible();
  await page.getByRole('textbox', { name: 'Электронная почта', exact: true }).fill('recover@example.com');
  await page.getByRole('button', { name: 'Закрыть', exact: true }).focus();
  await page.getByRole('button', { name: 'Закрыть', exact: true }).press('Enter');
  await expect(
    page.getByText('Прервать восстановление', { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);
  await expect(
    page.getByText('Восстановление пароля', { exact: true }),
  ).toHaveCount(0);
});

test('nickname suggestions check availability only on explicit Next', async ({
  page,
}) => {
  await installTurnstileFixture(page);
  await mkdir(nicknameArtifactDir, { recursive: true });
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 401,
      json: {
        status: 401,
        code: 'unauthorized',
        message: 'Authentication required',
      },
    }),
  );
  await installLegalDocumentsFixture(page);

  let availabilityRequests = 0;
  let availabilityMode: 'available' | 'taken' | 'error' | 'delayed' = 'taken';
  const delayedAvailability = {
    release: null as (() => void) | null,
  };
  await page.route('**/api/auth/slug-availability?*', async (route) => {
    availabilityRequests += 1;
    const mode = availabilityMode;
    if (mode === 'delayed') {
      await new Promise<void>((resolve) => {
        delayedAvailability.release = resolve;
      });
    }
    if (mode === 'error') {
      await route.fulfill({
        status: 429,
        json: {
          status: 429,
          code: 'rate_limited',
          message: 'Too many checks',
        },
      });
      return;
    }
    await route.fulfill({
      json: { available: mode === 'available' || mode === 'delayed' },
    });
  });

  let registerRequests = 0;
  await page.route('**/api/auth/register', async (route) => {
    registerRequests += 1;
    await route.fulfill({
      status: 409,
      json: {
        status: 409,
        code: 'conflict',
        message: 'Nickname is already taken',
        details: { reason: 'slug_taken' },
      },
    });
  });

  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/register');
  await expect(page.getByRole('textbox', { name: 'Электронная почта', exact: true })).toBeFocused();
  await page.getByRole('textbox', { name: 'Электронная почта', exact: true }).fill('nickname-only@example.com');
  await acceptRegistrationConsents(page);
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();

  const nickname = page.getByLabel('Никнейм', { exact: true });
  const suggestions = page.locator('#nickname-suggestions').getByRole('button');
  await expect(suggestions).toHaveCount(3);
  const fieldGeometry = await nickname.evaluate((input) => {
    const shell = input.parentElement;
    const icon = shell?.querySelector('svg');
    const iconSlot = icon?.parentElement;
    const path = icon?.querySelector('path');
    const rect = (node: Element | null | undefined) => {
      const box = node?.getBoundingClientRect();
      return box
        ? { x: box.x, y: box.y, width: box.width, height: box.height }
        : null;
    };
    return {
      shell: rect(shell),
      input: rect(input),
      icon: rect(icon),
      iconSlot: rect(iconSlot),
      iconColor: icon ? getComputedStyle(icon).color : null,
      pathStroke: path ? getComputedStyle(path).stroke : null,
      pathStrokeWidth: path ? getComputedStyle(path).strokeWidth : null,
    };
  });
  expect(fieldGeometry.shell).not.toBeNull();
  expect(fieldGeometry.input).not.toBeNull();
  expect(fieldGeometry.icon).not.toBeNull();
  expect(fieldGeometry.iconSlot).not.toBeNull();
  expect(fieldGeometry.shell!.width).toBeCloseTo(350, 0);
  expect(fieldGeometry.shell!.height).toBeCloseTo(50, 0);
  expect(fieldGeometry.icon!.width).toBeCloseTo(18, 1);
  expect(fieldGeometry.icon!.height).toBeCloseTo(18, 1);
  expect(fieldGeometry.iconSlot!.width).toBeCloseTo(22, 1);
  expect(fieldGeometry.iconSlot!.height).toBeCloseTo(22, 1);
  expect(fieldGeometry.input!.x - fieldGeometry.shell!.x).toBeCloseTo(39, 1);
  expect(fieldGeometry.iconColor).toBe('rgb(133, 133, 133)');
  expect(fieldGeometry.pathStroke).toBe('rgb(133, 133, 133)');
  expect(Number.parseFloat(fieldGeometry.pathStrokeWidth ?? '')).toBeCloseTo(
    1.13,
    2,
  );
  const mappedGeometry = {
    title: await page
      .getByText('Выберите имя пользователя', { exact: true })
      .boundingBox(),
    caption: await page
      .getByText('Можете выбрать свой никнейм или предложенный', { exact: true })
      .boundingBox(),
    status: await page.locator('#nickname-status-slot').boundingBox(),
    action: await page
      .getByRole('button', { name: 'Дальше', exact: true })
      .boundingBox(),
    suggestionsLabel: await page
      .getByText('Предложения:', { exact: true })
      .boundingBox(),
    firstChip: await suggestions.first().boundingBox(),
    mark: await page
      .getByRole('dialog', { name: 'Регистрация' })
      .getByTestId('bidplace-brand-mark')
      .boundingBox(),
    wordmark: await page
      .getByRole('dialog', { name: 'Регистрация' })
      .getByTestId('bidplace-brand-wordmark')
      .boundingBox(),
  };
  expect(mappedGeometry.title?.y).toBeCloseTo(277, 0);
  expect(mappedGeometry.caption?.y).toBeCloseTo(305, 0);
  expect(mappedGeometry.status?.y).toBeCloseTo(351, 0);
  expect(fieldGeometry.shell!.y).toBeCloseTo(387, 0);
  expect(mappedGeometry.action?.y).toBeCloseTo(449, 0);
  expect(mappedGeometry.action?.width).toBeCloseTo(350, 0);
  expect(mappedGeometry.action?.height).toBeCloseTo(51, 0);
  expect(mappedGeometry.suggestionsLabel?.y).toBeCloseTo(524, 0);
  expect(mappedGeometry.firstChip?.y).toBeCloseTo(548, 0);
  expect(mappedGeometry.firstChip?.height).toBeCloseTo(37, 0);
  expect(mappedGeometry.mark?.y).toBeCloseTo(67, 0);
  expect(mappedGeometry.wordmark?.y).toBeCloseTo(793, 0);
  const initialSuggestions = await suggestions.allTextContents();
  expect(new Set(initialSuggestions).size).toBe(3);
  await suggestions.first().focus();
  await expect(suggestions.first()).toBeFocused();
  await suggestions.first().press('Enter');
  await expect(nickname).toHaveValue(initialSuggestions[0]!);
  expect(availabilityRequests).toBe(0);

  for (const viewport of [
    { width: 375, height: 667 },
    { width: 440, height: 956 },
    { width: 1280, height: 720 },
    { width: 390, height: 400 },
    { width: 390, height: 874 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(suggestions).toHaveCount(3);
    await expect.poll(
      () => page.evaluate(() => document.body.scrollWidth <= window.innerWidth),
      { message: `Nickname step must reflow at ${viewport.width}×${viewport.height}` },
    ).toBe(true);
    await suggestions.last().scrollIntoViewIfNeeded();
    await expect(suggestions.last()).toBeInViewport();
  }

  // Reflow uses CSS viewport size; CSS zoom does not emulate browser zoom.
  await page.setViewportSize({ width: 320, height: 583 });
  expect(
    await page.evaluate(() => document.body.scrollWidth <= window.innerWidth),
  ).toBe(true);
  for (let index = 0; index < 3; index += 1) {
    await suggestions.nth(index).scrollIntoViewIfNeeded();
    await expect(suggestions.nth(index)).toBeInViewport();
  }
  await page.setViewportSize({ width: 390, height: 874 });

  await nickname.fill('taken-author');
  const nextAction = page.getByRole('button', { name: 'Дальше', exact: true });
  await nextAction.click({ trial: true });
  const beforeStatus = {
    field: await nickname.boundingBox(),
    action: await nextAction.boundingBox(),
  };
  expect(beforeStatus.field).not.toBeNull();
  expect(beforeStatus.action).not.toBeNull();
  await nextAction.click();
  await expect(
    page.getByText('@taken-author недоступен', { exact: true }),
  ).toBeVisible();
  await expect(nickname).toHaveValue('taken-author');
  await expect(nextAction).toBeEnabled();
  await nextAction.click({ trial: true });
  await expect.poll(async () => (await nickname.boundingBox())?.y).toBeCloseTo(
    beforeStatus.field!.y,
    1,
  );
  await expect.poll(async () => (await nextAction.boundingBox())?.y).toBeCloseTo(
    beforeStatus.action!.y,
    1,
  );
  const refreshedSuggestions = await suggestions.allTextContents();
  expect(refreshedSuggestions).toHaveLength(3);
  expect(new Set(refreshedSuggestions).size).toBe(3);
  expect(
    refreshedSuggestions.every(
      (suggestion) => !initialSuggestions.includes(suggestion),
    ),
  ).toBe(true);
  await page.screenshot({
    path: resolve(
      nicknameArtifactDir,
      `${engine(page)}-register-nickname-taken-390x874.png`,
    ),
  });

  availabilityMode = 'error';
  await nickname.fill('retry-author');
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await expect(
    page.getByText('Слишком много проверок. Подождите и попробуйте снова.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(nickname).toHaveValue('retry-author');

  availabilityMode = 'taken';
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await expect(
    page.getByText('@retry-author недоступен', { exact: true }),
  ).toBeVisible();
  await expect(nickname).toHaveValue('retry-author');

  availabilityMode = 'delayed';
  await nickname.fill('stale-author');
  const delayedResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/api/auth/slug-availability') &&
      new URL(response.url()).searchParams.get('slug') === 'stale-author',
  );
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await expect.poll(() => availabilityRequests).toBe(4);
  await nickname.fill('current-author');
  delayedAvailability.release?.();
  const completedDelayedResponse = await delayedResponse;
  expect(await completedDelayedResponse.json()).toEqual({ available: true });
  expect(await completedDelayedResponse.finished()).toBeNull();
  await expect(
    page.getByText('@stale-author доступен', { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel('Введите пароль', { exact: true })).toHaveCount(
    0,
  );

  availabilityMode = 'available';
  await nickname.fill('available-author');
  const suggestionsBeforePassword = await suggestions.allTextContents();
  const next = page.getByRole('button', { name: 'Дальше', exact: true });
  await next.evaluate((button) => {
    button.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );
    button.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );
  });
  await expect(
    page.getByLabel('Введите пароль', { exact: true }),
  ).toBeVisible();
  expect(availabilityRequests).toBe(5);
  await page
    .getByLabel('Введите пароль', { exact: true })
    .fill('registration-password-123');
  await page
    .getByLabel('Подтвердите пароль', { exact: true })
    .fill('registration-password-123');
  await expectTurnstileReady(page, 'register');
  expect((await finishRegistrationEmailProof(page, 'nickname-only@example.com')).status()).toBe(409);
  await expect(
    page.getByText('Этот никнейм уже занят. Выберите другой.', { exact: true }),
  ).toBeVisible();
  expect(registerRequests).toBe(1);
  expect(await suggestions.allTextContents()).toEqual(
    suggestionsBeforePassword,
  );

  await nickname.fill('replacement-author');
  await next.click();
  await expect(page.getByLabel('Введите пароль', { exact: true })).toHaveValue(
    'registration-password-123',
  );
  await expect(
    page.getByLabel('Подтвердите пароль', { exact: true }),
  ).toHaveValue('registration-password-123');
  expect(registerRequests).toBe(1);

  // Reflow uses CSS viewport size; CSS zoom does not emulate browser zoom.
  await page.setViewportSize({ width: 320, height: 583 });
  await page
    .getByLabel('Введите пароль', { exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByLabel('Введите пароль', { exact: true }),
  ).toBeInViewport();
  await page.setViewportSize({ width: 390, height: 874 });
});

async function clickAtHitCenter(
  page: Page,
  target: ReturnType<Page['locator']>,
) {
  await target.scrollIntoViewIfNeeded();
  await target.click({ trial: true });
  const point = await target.evaluate((node) => {
    const reaches = (x: number, y: number) => {
      const hit = document.elementFromPoint(x, y);
      return hit === node || (hit !== null && node.contains(hit));
    };
    for (const rect of node.getClientRects()) {
      const left = Math.max(rect.left, 0);
      const top = Math.max(rect.top, 0);
      const right = Math.min(rect.right, window.innerWidth);
      const bottom = Math.min(rect.bottom, window.innerHeight);
      if (right - left < 1 || bottom - top < 1) continue;
      const x = left + (right - left) / 2;
      const y = top + (bottom - top) / 2;
      if (reaches(x, y)) return { x, y, reached: true };
    }
    return { x: 0, y: 0, reached: false };
  });
  expect(point.reached).toBe(true);
  await page.mouse.click(point.x, point.y);
}

async function historyStep(page: Page, delta: number) {
  await page.evaluate((step) => {
    window.history.go(step);
  }, delta);
}

async function worksCatalogButton(page: Page) {
  // Feed may still load: either the populated-state or the empty-state button wins.
  const populated = page.getByRole('button', { name: 'Смотреть все' });
  const empty = page.getByRole('button', { name: 'Все работы', exact: true });
  await expect(populated.or(empty).first()).toBeVisible();
  return (await populated.count()) > 0 ? populated.first() : empty;
}

async function openWorksCatalog(page: Page) {
  const catalog = await worksCatalogButton(page);
  await catalog.scrollIntoViewIfNeeded();
  await catalog.click();
  await expect(page).toHaveURL(/\/works$/);
}

async function pushWorksFromBackground(page: Page) {
  const nonce = await page.evaluate(() => {
    const value = crypto.randomUUID();
    document.documentElement.dataset.bidplaceLayoutNonce = value;
    return value;
  });
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const buttons = [...document.querySelectorAll('[role="button"]')];
        const works =
          buttons.find(
            (element) => element.getAttribute('aria-label') === 'Смотреть все',
          ) ??
          buttons.find(
            (element) => element.getAttribute('aria-label') === 'Все работы',
          );
        if (!works) return false;
        works.dispatchEvent(
          new MouseEvent('click', { bubbles: true, cancelable: true }),
        );
        return true;
      }),
    )
    .toBe(true);
  await expect(page).toHaveURL(/\/works$/);
  expect(
    await page.evaluate(
      () => document.documentElement.dataset.bidplaceLayoutNonce,
    ),
  ).toBe(nonce);
}

async function expectS4Register(page: Page) {
  await expect(page.getByText(removedIntro, { exact: true })).toHaveCount(0);
  const title = page.getByText('Введите вашу почту', { exact: true });
  await expect(title).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Электронная почта', exact: true })).toBeVisible();
  await expect(page.getByLabel('Никнейм')).toHaveCount(0);
  await expect(page.getByLabel('Введите пароль')).toHaveCount(0);
  const submit = page.getByRole('button', { name: 'Дальше' });
  await submit.scrollIntoViewIfNeeded();
  await expect(submit).toBeVisible();
  const confirmation = page.getByRole('checkbox', { name: /^Мне есть 18 лет/ });
  await expect(confirmation).toHaveCount(1);
  await expect(confirmation).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Основная навигация' }),
  ).toHaveCount(0);

  const titleBox = await title.boundingBox();
  const emailBox = await page.getByRole('textbox', { name: 'Электронная почта', exact: true }).boundingBox();
  expect(titleBox).not.toBeNull();
  expect(emailBox).not.toBeNull();
  expect(titleBox!.y).toBeLessThan(emailBox!.y);
}

async function expectCenteredPhoneColumn(page: Page) {
  const frame = await page.getByRole('dialog').boundingBox();
  const viewport = page.viewportSize();
  expect(frame).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(frame!.width).toBeCloseTo(viewport!.width, 1);
  const form = await page.getByRole('textbox', { name: 'Электронная почта', exact: true }).locator('../..').boundingBox();
  expect(form!.width).toBeCloseTo(Math.min(viewport!.width - 40, 350), 1);
  expect(form!.x + form!.width / 2).toBeCloseTo(viewport!.width / 2, 1);
  expect(frame!.x).toBeCloseTo((viewport!.width - frame!.width) / 2, 0);
}

async function captureAuthSurface(
  page: Page,
  target: ReturnType<Page['locator']>,
  path: string,
) {
  if (process.env.E2E_REDACT_AUTH_ARTIFACTS === '1') {
    await target.screenshot({ path });
    return;
  }
  await page.screenshot({ path });
}

function engine(page: Page) {
  return page.context().browser()?.browserType().name() ?? 'browser';
}

test('registration email stays centered with one inline legal confirmation', async ({ page }, info) => {
  await installLegalDocumentsFixture(page);
  for (const width of [320, 390, 440]) {
    await page.setViewportSize({ width, height: 874 });
    await page.goto('/register');
    const email = page.getByRole('textbox', { name: 'Электронная почта' });
    await expect(email).toBeVisible();
    const box = await email.boundingBox();
    expect(box!.x + box!.width / 2).toBeCloseTo(width / 2, 0);
    expect(box!.width).toBeLessThanOrEqual(350);
    const checkbox = page.getByRole('checkbox');
    await expect(checkbox).toHaveCount(1);
    await expect(checkbox).not.toBeChecked();
    const agreement = page.getByRole('link', { name: 'пользовательское соглашение', exact: true });
    await expect(agreement).toHaveCount(1);
    await expect(agreement).toHaveCSS('color', 'rgb(18, 18, 18)');
    await expect(page.getByText('Редакция документов:', { exact: false })).toHaveCount(0);
    await expect(page.getByText('Сессия изменилась. Повторите регистрацию.', { exact: true })).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    await mkdir(artifactDir, { recursive: true });
    await page.screenshot({ path: resolve(artifactDir, `${info.project.name}-register-centered-${width}.png`) });
  }
  await page.getByRole('textbox', { name: 'Электронная почта' }).fill('layout@example.com');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await expect(page.getByText('Выберите имя пользователя', { exact: true })).toBeVisible();
});

test('registration continues when document reading is unavailable', async ({ page }, info) => {
  await installTurnstileFixture(page);
  const unique = Date.now().toString();
  const registrationEmail = `register-${unique}-${info.project.name}@example.com`;
  let documentReads = 0;
  await page.route('**/api/auth/legal', (route) => {
    documentReads += 1;
    return route.fulfill({ status: 503, json: { message: 'legal not published' } });
  });
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/register');
  const next = page.getByRole('button', { name: 'Дальше', exact: true });
  await expect(next).toBeVisible();
  expect(documentReads).toBe(0);
  await expect(page.getByRole('checkbox')).toBeEnabled();
  const email = page.getByRole('textbox', { name: 'Электронная почта' });
  await email.fill(registrationEmail);
  await page.getByRole('checkbox').check();
  await page.getByRole('link', { name: 'пользовательское соглашение', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Юридический документ', exact: true });
  await expect(dialog.getByText('Не удалось открыть документ. Попробуйте позже.', { exact: true })).toBeVisible();
  expect(documentReads).toBe(1);
  await dialog.getByRole('button', { name: 'Закрыть окно', exact: true }).click();
  await expect(email).toHaveValue(registrationEmail);
  await expect(page.getByRole('checkbox')).toBeChecked();
  await expect(page.getByRole('button', { name: /Повторить/ })).toHaveCount(0);
  await next.click();
  await expect(page.getByText('Выберите имя пользователя', { exact: true })).toBeVisible();
  await page.getByLabel('Никнейм', { exact: true }).fill(`ui${info.project.name[0]}${unique}`);
  await next.click();
  await page.getByLabel('Введите пароль', { exact: true }).fill('browser-registration-test-2026');
  await page.getByLabel('Подтвердите пароль', { exact: true }).fill('browser-registration-test-2026');
  expect((await finishRegistrationEmailProof(page, registrationEmail)).status()).toBe(201);
  await expect(page).toHaveURL(/\/$/);

});
