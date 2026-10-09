import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { e2eEvidenceDir } from './support/evidence-dir';
import { expectPasswordVisibility } from './support/fill-control';

const artifactDir = resolve(e2eEvidenceDir, 'stabilization');
const removedIntro = 'Искусство встречает своего следующего владельца.';

test('dirty login asks before closing and providers stay unavailable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && /does not recognize/.test(message.text())) errors.push(message.text());
  });
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/login');
  const email = page.getByLabel('Электронная почта');
  await email.fill('a');
  const password = page.getByLabel('Пароль', { exact: true });
  await password.fill('visual-password-123');
  await expectPasswordVisibility(password);
  await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);
  await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await expect(page.getByText('Прервать вход', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(email).toHaveValue('a');
  await page.getByRole('button', { name: 'Войти с Google', exact: true }).click();
  await expect(page.getByText('Вход через Google пока недоступен')).toBeVisible();
  await page.getByRole('button', { name: 'Войти с Telegram', exact: true }).click();
  await expect(page.getByText('Вход через Telegram пока недоступен')).toBeVisible();
  const panel = page.locator('#auth-exit-confirm');
  await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await expect(panel).toBeVisible();
  const panelBox = await panel.boundingBox();
  expect(panelBox).not.toBeNull();
  expect(panelBox!.width).toBeCloseTo(366, 0);
  expect(panelBox!.x).toBeCloseTo((390 - panelBox!.width) / 2, 0);
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();

  await mkdir(artifactDir, { recursive: true });
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
    { width: 375, height: 667 },
    { width: 440, height: 956 },
    { width: 390, height: 400 },
    { width: 390, height: 874 },
  ]) {
    await page.setViewportSize(viewport);
    await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
    await expectCenteredSurface(page, '#auth-exit-confirm');
    await page.screenshot({ path: resolve(artifactDir, `${engine(page)}-auth-exit-${viewport.width}x${viewport.height}.png`) });
    await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
    await page.getByRole('link', { name: 'политику конфиденциальности', exact: true }).click();
    await expectCenteredSurface(page, '#app-dialog-content');
    const policy = page.getByText('Политика конфиденциальности', { exact: true });
    const content = page.locator('#app-dialog-content');
    const titleBox = await policy.boundingBox();
    const contentBox = await content.boundingBox();
    expect(titleBox).not.toBeNull();
    expect(contentBox).not.toBeNull();
    expect(titleBox!.x).toBeGreaterThanOrEqual(contentBox!.x);
    expect(titleBox!.x + titleBox!.width).toBeLessThanOrEqual(contentBox!.x + contentBox!.width);
    await expect(content).toHaveJSProperty('scrollLeft', 0);
    expect(await content.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    await page.screenshot({ path: resolve(artifactDir, `${engine(page)}-auth-policy-${viewport.width}x${viewport.height}.png`) });
    await page.keyboard.press('Escape');
    await expect(policy).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'политику конфиденциальности', exact: true })).toBeFocused();
    await expect(panel).toHaveCount(0);
  }
  await page.getByRole('link', { name: 'правила сервиса', exact: true }).click();
  await expectCenteredSurface(page, '#app-dialog-content');
  await expect(page.getByText('Правила сервиса', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Закрыть окно', exact: true }).click();
  await expect(panel).toHaveCount(0);
  await page.evaluate(() => { document.documentElement.style.zoom = '1.5'; });
  await page.getByRole('link', { name: 'политику конфиденциальности', exact: true }).click();
  expect(await page.locator('#app-dialog-content').evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  await expect(page.getByRole('button', { name: 'Закрыть окно', exact: true })).toBeInViewport();
  await page.getByRole('button', { name: 'Закрыть окно', exact: true }).click();
  await page.evaluate(() => { document.documentElement.style.zoom = ''; });
  await email.fill('login-layout@example.com');
  for (const failure of [
    { status: 401, code: 'unauthorized', message: 'Invalid credentials', copy: 'Неверная почта или пароль' },
    { status: 429, code: 'rate_limited', message: 'Слишком много запросов. Попробуйте немного позже.', copy: 'Слишком много запросов. Попробуйте немного позже.' },
    { status: 500, code: 'internal_error', message: 'Internal server error', copy: 'Проверьте соединение и попробуйте ещё раз.' },
  ]) {
    await page.route('**/api/auth/login', (route) => route.fulfill({
      status: failure.status,
      json: { status: failure.status, code: failure.code, message: failure.message },
    }));
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
    await expect(page.getByText(failure.copy, { exact: true }).last()).toBeVisible();
    if (failure.status !== 401) {
      await expect(page.getByText('Неверная почта или пароль', { exact: true })).toHaveCount(0);
    }
    await page.unroute('**/api/auth/login');
  }
  expect(errors).toEqual([]);
});

async function expectCenteredSurface(page: Page, selector: string) {
  const surface = page.locator(selector);
  await expect(surface).toBeVisible();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  await expect.poll(async () => {
    const box = await surface.boundingBox();
    return box !== null && Math.abs(box.x - (viewport!.width - box.width) / 2) <= 1
      && box.y >= 0 && box.y + box.height <= viewport!.height;
  }).toBe(true);
}

test('browser back keeps a filled login until the user decides', async ({ page }) => {
  await expectAuthBrowserHistory(page, true);
});

test('browser back keeps a filled login without the Navigation API', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'navigation', {
      configurable: true,
      get: () => undefined,
    });
  });
  await expectAuthBrowserHistory(page, false);
});

test('history position stays one number per entry', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('app-shell-content')).toBeVisible();
  const pushed = await page.evaluate(() => {
    const href = window.location.href;
    const state = window.history.state as { id?: string; index?: number } | null;
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
  await expect.poll(() => page.evaluate(() => window.history.state?.index)).toBe(Number(pushed.index) - 1);
  await expect.poll(() => page.evaluate(() => 'entries' in (window.history.state ?? {}))).toBe(false);

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
    window.history.replaceState({ id, entries: ['a', 'b', 'c'] }, '', window.location.href);
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
  await page.goto('/');
  expect(await page.evaluate(() => window.navigation != null)).toBe(navigationApi);
  await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  const loginTitle = page.getByText('Вход на Bidplace', { exact: true });
  await expect(loginTitle).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Основная навигация' })).toHaveCount(0);
  const email = page.getByLabel('Электронная почта');
  await email.fill('a');
  await email.fill('');
  await historyStep(page, -1);
  await expect(page.getByText('Прервать вход', { exact: true })).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(loginTitle).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Основная навигация' })).toHaveCount(1);

  await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(loginTitle).toBeVisible();
  await email.fill('a');
  await historyStep(page, -1);
  await expect(page.getByText('Прервать вход', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await expect(email).toHaveValue('a');
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(email).toHaveValue('a');
  await expect(email).toBeFocused();
  await historyStep(page, -1);
  await page.getByRole('button', { name: 'Прервать', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(loginTitle).toHaveCount(0);
  await historyStep(page, -1);
  await expect(loginTitle).toHaveCount(0);
  await historyStep(page, 1);
  await expect(loginTitle).toHaveCount(0);

  await page.goto('/');
  await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(loginTitle).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  await expect(loginTitle).toBeVisible();
  await email.fill('r');
  await historyStep(page, -1);
  await expect(page.getByText('Прервать вход', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await expect(loginTitle).toBeVisible();
  await expect(email).toHaveValue('r');
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(loginTitle).toBeVisible();
  await expect(email).toHaveValue('r');
  await expect(email).toBeFocused();
  await historyStep(page, -1);
  await page.getByRole('button', { name: 'Прервать', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(loginTitle).toHaveCount(0);

  await page.goto('/login');
  await expect(loginTitle).toBeVisible();
  await page.getByRole('button', { name: 'Регистрация', exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByText('Введите вашу почту', { exact: true })).toBeVisible();
  await page.getByPlaceholder('example@gmail.com').fill('author@example.com');
  await historyStep(page, -1);
  await expect(page.getByText('Прервать регистрацию', { exact: true })).toHaveCount(0);
  await expect(page).toHaveURL(/\/login$/);
  await expect(loginTitle).toBeVisible();
  await expect(page.getByText('Введите вашу почту', { exact: true })).toHaveCount(0);

  await page.goto('/');
  const catalog = page.getByRole('button', { name: 'Смотреть все' }).first();
  await catalog.scrollIntoViewIfNeeded();
  await catalog.click();
  await expect(page).toHaveURL(/\/works$/);
  await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(loginTitle).toBeVisible();
  await email.fill('b');
  await historyStep(page, -2);
  await expect(page.getByText('Прервать вход', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await expect(loginTitle).toBeVisible();
  await expect(email).toHaveValue('b');
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(email).toHaveValue('b');
  await expect(email).toBeFocused();
  await historyStep(page, -2);
  await page.getByRole('button', { name: 'Прервать', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(loginTitle).toHaveCount(0);

  await page.goto('/');
  await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(loginTitle).toBeVisible();
  await pushWorksFromBackground(page);
  await expect(page).toHaveURL(/\/works$/);
  await expect(page.getByText('Каталог работ на Bidplace', { exact: true })).toBeVisible();
  await expect(loginTitle).not.toBeVisible();
  await historyStep(page, -1);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Прервать вход', { exact: true })).toHaveCount(0);
  await expect(loginTitle).toBeVisible();
  await email.fill('c');
  await historyStep(page, 1);
  await expect(page.getByText('Прервать вход', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await expect(loginTitle).toBeVisible();
  await expect(email).toHaveValue('c');
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(email).toHaveValue('c');
  await expect(email).toBeFocused();
  await historyStep(page, 1);
  await page.getByRole('button', { name: 'Прервать', exact: true }).click();
  await expect(page).toHaveURL(/\/works$/);
  await expect(loginTitle).not.toBeVisible();
  await expect(page.getByText('Каталог работ на Bidplace', { exact: true })).toBeVisible();
}

test('register email title layout is stable across viewport resize', async ({ page }) => {
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
  await expect
    .poll(async () => {
      const y = await emailTitleY();
      return y >= 319 && y <= 321.5;
    })
    .toBe(true);
  await expectTitleClearOfMark();
  await expect(page.getByRole('navigation', { name: 'Основная навигация' })).toHaveCount(0);

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
  await expect
    .poll(async () => {
      const y = await emailTitleY();
      return y >= 319 && y <= 321.5;
    })
    .toBe(true);

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
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await expect(page.getByText('Введите корректный email', { exact: true })).toBeVisible();
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
  await expect(page.getByRole('navigation', { name: 'Основная навигация' })).toHaveCount(0);

  await page.setViewportSize({ width: 440, height: 956 });
  await page.goto('/register');
  await expect(title()).toBeVisible();
  await expectTitleClearOfMark();
  expect(
    await page.evaluate(() => document.body.scrollWidth <= window.innerWidth),
  ).toBe(true);
  const frame = await page.getByRole('dialog').boundingBox();
  const viewport = page.viewportSize();
  expect(frame).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(frame!.width).toBeCloseTo(390, 1);
  expect(frame!.x).toBeCloseTo((viewport!.width - frame!.width) / 2, 0);
});

test('auth composition is stacked in the S4 phone column', async ({ page }) => {
  await mkdir(artifactDir, { recursive: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/register');
  await expectS4Register(page);
  await expectCenteredPhoneColumn(page);
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

  await page.route('**/api/auth/rules', (route) => route.fulfill({
    json: { rules: { version: 'layout-test', owner: 'Synthetic', contact: 'test@example.com', text: 'Synthetic layout fixture' } },
  }));
  let availabilityRequests = 0;
  await page.route('**/api/auth/slug-availability?*', (route) => {
    availabilityRequests += 1;
    return route.fulfill({ json: { available: true } });
  });
  await page.getByLabel('Электронная почта').fill('layout-only@example.com');
  await page.getByRole('checkbox', { name: /соглашаюсь/ }).check();
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  const nickname = page.getByLabel('Никнейм', { exact: true });
  for (const slug of ['ab', 'a'.repeat(21)]) {
    await nickname.fill(slug);
    await page.getByRole('button', { name: 'Дальше', exact: true }).click();
    await expect(page.getByText('Никнейм должен содержать от 3 до 20 символов', { exact: true })).toBeVisible();
    await expect(nickname).toBeVisible();
  }
  expect(availabilityRequests).toBe(0);
  await nickname.fill('a'.repeat(20));
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  const password = page.getByLabel('Введите пароль', { exact: true });
  const confirmation = page.getByLabel('Подтвердите пароль', { exact: true });
  await password.fill('layout-password-123');
  await confirmation.fill('layout-password-123');
  await expectPasswordVisibility(password);
  await expectPasswordVisibility(confirmation);
  await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 400 });
  await page.screenshot({ path: resolve(artifactDir, `${engine(page)}-register-password-390x400.png`) });

  await page.goto('/reset-password?token=layout-only-synthetic');
  const resetPassword = page.getByRole('textbox', { name: 'Новый пароль', exact: true });
  const resetConfirmation = page.getByLabel('Подтверждение пароля', { exact: true });
  await resetPassword.fill('layout-password-123');
  await resetConfirmation.fill('layout-password-123');
  await expectPasswordVisibility(resetPassword);
  await expectPasswordVisibility(resetConfirmation);
  await expect(page.locator('#auth-exit-confirm')).toHaveCount(0);
  await page.screenshot({ path: resolve(artifactDir, `${engine(page)}-reset-password-390x400.png`) });
});

async function historyStep(page: Page, delta: number) {
  await page.evaluate((step) => {
    window.history.go(step);
  }, delta);
}

async function pushWorksFromBackground(page: Page) {
  await expect.poll(async () =>
    page.evaluate(() => {
      const buttons = [...document.querySelectorAll('[role="button"]')];
      const works =
        buttons.find((element) => element.getAttribute('aria-label') === 'Смотреть все') ??
        buttons.find((element) => element.getAttribute('aria-label') === 'Все работы');
      if (!works) return false;
      works.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return true;
    }),
  ).toBe(true);
}

async function expectS4Register(page: Page) {
  await expect(page.getByText(removedIntro, { exact: true })).toHaveCount(0);
  const title = page.getByText('Введите вашу почту', { exact: true });
  await expect(title).toBeVisible();
  await expect(page.getByLabel('Электронная почта')).toBeVisible();
  await expect(page.getByLabel('Никнейм')).toHaveCount(0);
  await expect(page.getByLabel('Введите пароль')).toHaveCount(0);
  const submit = page.getByRole('button', { name: 'Дальше' });
  await submit.scrollIntoViewIfNeeded();
  await expect(submit).toBeVisible();
  await expect(page.getByText('Я соглашаюсь с политикой конфиденциальности и правилами сервиса')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Основная навигация' })).toHaveCount(0);

  const titleBox = await title.boundingBox();
  const emailBox = await page.getByLabel('Электронная почта').boundingBox();
  expect(titleBox).not.toBeNull();
  expect(emailBox).not.toBeNull();
  expect(titleBox!.y).toBeLessThan(emailBox!.y);
}

async function expectCenteredPhoneColumn(page: Page) {
  const frame = await page.getByRole('dialog').boundingBox();
  const viewport = page.viewportSize();
  expect(frame).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(frame!.width).toBeCloseTo(390, 1);
  expect(frame!.x).toBeCloseTo((viewport!.width - frame!.width) / 2, 0);
}

function engine(page: Page) {
  return page.context().browser()?.browserType().name() ?? 'browser';
}
