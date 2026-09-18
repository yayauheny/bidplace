import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { e2eEvidenceDir } from './support/evidence-dir';

const apiPort = process.env.E2E_API_PORT ?? '3001';
const apiBaseURL = `http://localhost:${apiPort}`;

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('dock opens Search overlay over Home and Escape restores it', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByText('Новые работы', { exact: true })).toBeVisible();
  const overlay = await openSearchOverlay(page);
  await expect(page).toHaveURL(/\/$/);
  await expect(overlay.getByRole('tab', { name: 'Категории' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Найти' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('search-overlay')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Новые работы', { exact: true })).toBeVisible();
});

test('Search overlay tabs, live query, navigation, and close', async ({
  page,
  request,
}) => {
  const worksPayload = (await (
    await request.get(`${apiBaseURL}/api/works?limit=1`)
  ).json()) as {
    works: Array<{
      work: { publicId: string; title: string; categoryId: string };
    }>;
  };
  const authorsPayload = (await (
    await request.get(`${apiBaseURL}/api/authors?limit=1`)
  ).json()) as {
    authors: Array<{ author: { slug: string } }>;
  };
  const categoriesPayload = (await (
    await request.get(`${apiBaseURL}/api/categories`)
  ).json()) as {
    categories: Array<{ id: string; name: string }>;
  };
  const work = worksPayload.works[0]!.work;
  const author = authorsPayload.authors[0]!.author;
  const category = categoriesPayload.categories[0]!;

  await page.goto('/');
  const overlay = await openSearchOverlay(page);
  await expect(overlay.getByText(category.name).first()).toBeVisible();
  await page.screenshot({
    path: resolve(e2eEvidenceDir, 'search-overlay/categories-empty-q-390.png'),
  });

  await overlay.getByRole('tab', { name: 'Авторы' }).click();
  await expect(
    overlay.getByRole('link', { name: `@${author.slug}` }).first(),
  ).toBeVisible();
  await expect(overlay.locator('a[href^="/seller/"]').first()).toBeVisible();
  await page.screenshot({
    path: resolve(e2eEvidenceDir, 'search-overlay/authors-empty-q-390.png'),
  });

  await overlay.getByRole('tab', { name: 'Работы' }).click();
  await expect(overlay.locator('a[href^="/product/"]').first()).toBeVisible();
  await expect(
    overlay.getByRole('button', { name: /Показать ещё/ }),
  ).toHaveCount(0);
  await page.screenshot({
    path: resolve(e2eEvidenceDir, 'search-overlay/works-empty-q-390.png'),
  });

  const typedWorks = page.waitForResponse((response) =>
    isListResponse(response, '/api/works', work.title),
  );
  await overlay.getByTestId('search-overlay-query').fill(work.title);
  await typedWorks;
  await expect(overlay.getByText(work.title).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Найти' })).toHaveCount(0);

  const clearedWorks = page.waitForResponse((response) =>
    isListResponse(response, '/api/works'),
  );
  await overlay.getByTestId('search-overlay-query').fill('');
  await clearedWorks;
  await expect(overlay.locator('a[href^="/product/"]').first()).toBeVisible();

  await overlay.getByRole('tab', { name: 'Категории' }).click();
  await overlay.getByRole('link', { name: category.name }).click();
  await expect(page.getByTestId('search-overlay')).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`category=${category.id}`));
  await expect(page.getByRole('button', { name: /Фильтры/ })).toBeVisible();

  await page.goto('/');
  await openSearchOverlay(page);
  await page.getByTestId('search-overlay').getByRole('tab', { name: 'Авторы' }).click();
  await page
    .getByTestId('search-overlay')
    .getByRole('link', { name: `@${author.slug}` })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`/seller/${author.slug}`));
  await expect(page.getByTestId('search-overlay')).toHaveCount(0);

  await page.goto('/');
  await openSearchOverlay(page);
  await page.getByTestId('search-overlay').getByRole('tab', { name: 'Работы' }).click();
  await page
    .getByTestId('search-overlay')
    .locator(`a[href="/product/${work.publicId}"]`)
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`/product/${work.publicId}`));
  await expect(page.getByTestId('search-overlay')).toHaveCount(0);

  await page.goto('/');
  await openSearchOverlay(page);
  await page.getByRole('button', { name: 'Закрыть поиск' }).click();
  await expect(page.getByTestId('search-overlay')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Новые работы', { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('typed empty results and active-tab inline retry stay in the overlay', async ({
  page,
}) => {
  await page.goto('/');
  const overlay = await openSearchOverlay(page);
  await overlay.getByTestId('search-overlay-query').fill('no-results-zzzz');
  await expect(overlay.getByText('Категории не найдены')).toBeVisible();

  await overlay.getByRole('tab', { name: 'Авторы' }).click();
  await expect(overlay.getByText('Авторы не найдены')).toBeVisible();

  await overlay.getByRole('tab', { name: 'Работы' }).click();
  await expect(overlay.getByText('Работы не найдены')).toBeVisible();
  await page.screenshot({
    path: resolve(e2eEvidenceDir, 'search-overlay/empty-results-390.png'),
  });

  await overlay.getByRole('button', { name: 'Закрыть поиск' }).click();
  await page.route('**/api/authors?**', (route) => route.abort('connectionrefused'));
  const failed = await openSearchOverlay(page);
  await failed.getByRole('tab', { name: 'Авторы' }).click();
  await expect(failed.getByTestId('infrastructure-error-state-inline')).toBeVisible();
  await expect(page.getByTestId('infrastructure-error-state-page')).toHaveCount(0);
  await expect(failed.getByRole('tab', { name: 'Категории' })).toBeVisible();
  await expect(failed.getByTestId('search-overlay-query')).toBeVisible();
  await page.screenshot({
    path: resolve(e2eEvidenceDir, 'search-overlay/inline-error-390.png'),
  });

  await page.unroute('**/api/authors?**');
  await failed.getByRole('button', { name: 'Повторить', exact: true }).click();
  await expect(failed.getByTestId('infrastructure-error-state-inline')).toHaveCount(
    0,
  );
  await expect(failed.locator('a[href^="/seller/"]').first()).toBeVisible();
});

test('/search deep link hosts the overlay and close returns Home', async ({
  page,
}) => {
  await page.goto('/search?q=dali');
  const overlay = page.getByTestId('search-overlay');
  await expect(overlay).toBeVisible();
  await expect(overlay.getByTestId('search-overlay-query')).toHaveValue('dali');
  await overlay.getByRole('button', { name: 'Закрыть поиск' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('search-overlay')).toHaveCount(0);
});

test('/search Escape returns Home', async ({ page }) => {
  await page.goto('/search');
  const overlay = page.getByTestId('search-overlay');
  await expect(overlay).toBeVisible();
  await expect(overlay.getByTestId('search-overlay-query')).toHaveValue('');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('search-overlay')).toHaveCount(0);
});

test('/search result navigation leaves Search without forcing Home', async ({
  page,
  request,
}) => {
  const categoriesPayload = (await (
    await request.get(`${apiBaseURL}/api/categories`)
  ).json()) as {
    categories: Array<{ id: string; name: string }>;
  };
  const category = categoriesPayload.categories[0]!;

  await page.goto('/search');
  const overlay = page.getByTestId('search-overlay');
  await expect(overlay).toBeVisible();
  await overlay.getByRole('link', { name: category.name }).click();
  await expect(page.getByTestId('search-overlay')).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`category=${category.id}`));
  await expect(page).not.toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: /Фильтры/ })).toBeVisible();
});

test('client-side Back closes Search and does not resurrect it', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByText('Новые работы', { exact: true })).toBeVisible();
  await page
    .locator('#home-new-works')
    .getByRole('button', { name: 'Смотреть все' })
    .click();
  await expect(page).toHaveURL(/\/works/);
  await expect(page.getByRole('button', { name: /Фильтры/ })).toBeVisible();
  await openSearchOverlay(page);
  await expect(page).toHaveURL(/\/works/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('search-overlay')).toHaveCount(0);
  await expect(page.getByText('Новые работы', { exact: true })).toBeVisible();
  await expect(
    page.getByTestId('figma-floating-dock').getByLabel('Поиск'),
  ).not.toHaveAttribute('aria-selected', 'true');
});

test('Search overlay focuses the field, traps Tab, and restores dock focus', async ({
  page,
}) => {
  await page.goto('/');
  const dockSearch = page.getByTestId('figma-floating-dock').getByLabel('Поиск');
  await dockSearch.click();
  const overlay = page.getByTestId('search-overlay');
  await expect(overlay).toBeVisible();
  await expect(overlay.getByTestId('search-overlay-query')).toBeFocused();

  for (let step = 0; step < 12; step += 1) {
    await page.keyboard.press('Tab');
    await expect
      .poll(async () =>
        overlay.evaluate((node) => node.contains(document.activeElement)),
      )
      .toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(page.getByTestId('search-overlay')).toHaveCount(0);
  await expect(dockSearch).toBeFocused();
});

test('Search overlay does not overflow at phone widths', async ({ page }) => {
  for (const viewport of [
    { width: 384, height: 832 },
    { width: 390, height: 860 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const overlay = await openSearchOverlay(page);
    await expectNoHorizontalOverflow(page);
    await overlay.getByRole('tab', { name: 'Авторы' }).click();
    await expectNoHorizontalOverflow(page);
    await overlay.getByRole('tab', { name: 'Работы' }).click();
    await expectNoHorizontalOverflow(page);
    await overlay.getByRole('button', { name: 'Закрыть поиск' }).click();
  }
});

async function openSearchOverlay(page: Page) {
  await page.getByTestId('figma-floating-dock').getByLabel('Поиск').click();
  const overlay = page.getByTestId('search-overlay');
  await expect(overlay).toBeVisible();
  return overlay;
}

function isListResponse(
  response: { url: () => string; ok: () => boolean },
  pathname: string,
  q?: string,
) {
  const url = new URL(response.url());
  if (url.pathname !== pathname || !response.ok()) return false;
  const actual = url.searchParams.get('q');
  return q ? actual === q : actual === null;
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
}
