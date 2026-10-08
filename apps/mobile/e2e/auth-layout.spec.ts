import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { e2eEvidenceDir } from './support/evidence-dir';

const artifactDir = resolve(e2eEvidenceDir, 'stabilization');
const removedIntro = 'Искусство встречает своего следующего владельца.';

test('dirty login asks before closing and providers stay unavailable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/login');
  const email = page.getByLabel('Электронная почта');
  await email.fill('a');
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
});

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
  const email = page.getByLabel('Электронная почта');
  await email.fill('a');
  await email.fill('');
  await historyStep(page, -1);
  await expect(page.getByText('Прервать вход', { exact: true })).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(loginTitle).toHaveCount(0);

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

  const titleBox = await title.boundingBox();
  const emailBox = await page.getByLabel('Электронная почта').boundingBox();
  expect(titleBox).not.toBeNull();
  expect(emailBox).not.toBeNull();
  expect(titleBox!.y).toBeLessThan(emailBox!.y);
}

async function expectCenteredPhoneColumn(page: Page) {
  const shell = await page.getByTestId('app-shell-content').boundingBox();
  expect(shell).not.toBeNull();
  expect(shell!.width).toBeCloseTo(390, 1);
}

function engine(page: Page) {
  return page.context().browser()?.browserType().name() ?? 'browser';
}
