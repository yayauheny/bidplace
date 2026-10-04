import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { e2eApiBaseURL } from './support/e2e-env';
import { e2eEvidenceDir } from './support/evidence-dir';

const artifactDir = resolve(e2eEvidenceDir, 'stabilization');
const apiBaseURL = e2eApiBaseURL;

test.beforeEach(async ({ page }, info) => {
  await mkdir(artifactDir, { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  if (info.title.includes('reduced')) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  }
});

test('Works sort, URL, and back stay server-owned', async ({
  page,
}) => {
  await page.goto('/works');
  const workLinks = page.locator('a[href^="/product/"]');
  await expect(workLinks.first()).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: 'Сортировка' }).click();
  await page.getByRole('radio', { name: 'Сначала старые' }).click();
  await page.getByRole('button', { name: 'Применить' }).click();
  await expect(page).toHaveURL(/\/works\?.*sort=oldest/);
  await page.goto('/authors');
  await page.goBack();
  await expect(page).toHaveURL(/\/works\?.*sort=oldest/);

  await page.getByRole('button', { name: 'Сортировка' }).click();
  await page.getByRole('radio', { name: 'Сначала новые' }).click();
  await page.getByRole('button', { name: 'Применить' }).click();
  await expect(page).toHaveURL(/\/works(?:\?sort=newest)?$/);

  await page.screenshot({
    path: resolve(artifactDir, `${engine(page)}-works-sort-390.png`),
    fullPage: true,
  });
});

test('Authors date-added label, URL, and back stay server-owned', async ({
  page,
}) => {
  await page.goto('/authors');
  await page.getByRole('button', { name: 'Сортировка' }).click();
  await expect(page.getByRole('radio', { name: 'По дате добавления' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'По активности' })).toHaveCount(0);
  await page.getByRole('radio', { name: 'По имени' }).click();
  await page.getByRole('button', { name: 'Применить' }).click();
  await expect(page).toHaveURL(/\/authors\?.*sort=name/);
  await page.goto('/works');
  await page.goBack();
  await expect(page).toHaveURL(/\/authors\?.*sort=name/);

  const authorLinks = page.locator('a[href^="/seller/"]');
  await expect(authorLinks.first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: resolve(artifactDir, `${engine(page)}-authors-sort-390.png`),
    fullPage: true,
  });
});

test('Search overlay results, empty, and inline error', async ({
  page,
  request,
}) => {
  const response = await request.get(`${apiBaseURL}/api/works?limit=1`);
  const payload = (await response.json()) as {
    works: Array<{ work: { title: string } }>;
  };
  const title = payload.works[0]!.work.title;

  await page.goto('/');
  await page.getByTestId('figma-floating-dock').getByLabel('Поиск').click();
  const overlay = page.getByTestId('search-overlay');
  await expect(overlay).toBeVisible();
  await overlay.getByRole('tab', { name: 'Работы' }).click();
  const typed = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.pathname === '/api/works' &&
      url.searchParams.get('q') === title &&
      response.ok()
    );
  });
  await overlay.getByTestId('search-overlay-query').fill(title);
  await typed;
  await expect(overlay.getByText(title).first()).toBeVisible();
  await expect(
    overlay.getByRole('button', { name: 'Показать ещё работы' }),
  ).toHaveCount(0);

  await overlay.getByTestId('search-overlay-query').fill('no-results-zzzz');
  await expect(overlay.getByText('Работы не найдены', { exact: true })).toBeVisible();

  await overlay.getByRole('button', { name: 'Закрыть поиск' }).click();
  await page.route('**/api/works?**', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'test failure' }),
    }),
  );
  await page.getByTestId('figma-floating-dock').getByLabel('Поиск').click();
  const failed = page.getByTestId('search-overlay');
  await failed.getByRole('tab', { name: 'Работы' }).click();
  await expect(
    page.getByText('Проверьте соединение и попробуйте ещё раз.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: resolve(artifactDir, `${engine(page)}-search-partial-390.png`),
  });
});

test('Work page and ShareSheet focus, Escape, and download', async ({
  page,
  request,
}) => {
  const response = await request.get(`${apiBaseURL}/api/works?limit=1`);
  const payload = (await response.json()) as {
    works: Array<{ work: { publicId: string; sharePath: string } }>;
  };
  const work = payload.works[0]!.work;
  await page.goto(`/product/${work.publicId}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const share = page.getByRole('button', { name: 'Поделиться работой' });
  await share.click();
  const dialog = page.getByRole('dialog', { name: 'Поделиться' });
  await expect(dialog).toBeVisible();
  const dock = await page.evaluate(() => {
    const host = document.getElementById('app-dialog-host');
    const content = document.getElementById('app-dialog-content');
    if (!host || !content) {
      return null;
    }
    const hostStyle = getComputedStyle(host);
    const box = content.getBoundingClientRect();
    return {
      flexDirection: hostStyle.flexDirection,
      justifyContent: hostStyle.justifyContent,
      contentBottom: box.bottom,
      viewportHeight: window.innerHeight,
    };
  });
  expect(dock).not.toBeNull();
  expect(dock?.flexDirection).toBe('column');
  expect(dock?.justifyContent).toBe('flex-end');
  expect(dock!.contentBottom).toBeGreaterThan(dock!.viewportHeight - 8);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const active = document.activeElement;
        return Boolean(active?.closest('[role="dialog"]'));
      }),
    )
    .toBe(true);

  const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });
  await page.getByRole('button', { name: 'Скачать QR' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^bidplace-.+\.png$/);
  const path = await download.path();
  expect(path).toBeTruthy();

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(share).toBeFocused();
  await page.screenshot({
    path: resolve(artifactDir, `${engine(page)}-share-work-390.png`),
  });
});

test('auth forms fit 390 without overflow', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('Вход на Bidplace')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.goto('/register');
  await expect(page.getByText('Регистрация', { exact: true }).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.goto('/forgot-password');
  await expect(page.getByText('Восстановление пароля')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: resolve(artifactDir, `${engine(page)}-login-390.png`),
  });
});

test('card hover and focus keep geometry', async ({ page }) => {
  await page.goto('/works');
  const card = page.locator('a[href^="/product/"]').first();
  await expect(card).toBeVisible();
  const idleBox = await card.boundingBox();
  await card.hover();
  const hoverBox = await card.boundingBox();
  expect(idleBox?.width).toBeCloseTo(hoverBox?.width ?? 0, 1);
  await card.focus();
  await expect(card).toBeFocused();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: resolve(artifactDir, `${engine(page)}-card-hover-390.png`),
  });
});

test('390 zoom 200% and reduced motion keep Home and Works usable', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByText('Новые работы', { exact: true })).toBeVisible();
  await page.evaluate(() => {
    document.body.style.zoom = '2';
  });
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: resolve(artifactDir, `${engine(page)}-home-zoom200-390.png`),
  });
  await page.goto('/works');
  await expect(page.getByRole('button', { name: 'Фильтры' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

function engine(page: Page) {
  return page.context().browser()?.browserType().name() ?? 'browser';
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
}
