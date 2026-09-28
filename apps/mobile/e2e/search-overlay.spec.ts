import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { e2eEvidenceDir } from './support/evidence-dir';

const apiPort = process.env.E2E_API_PORT ?? '3001';
const apiBaseURL = `http://localhost:${apiPort}`;

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('focused Search input Escape closes Search once', async ({ page }) => {
  await page.goto('/works');
  await expect(page.getByTestId('catalog-scroll-view')).toBeVisible();
  await page.getByTestId('figma-floating-dock').getByLabel('Главная').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page).not.toHaveURL(/\/works/);
  const overlay = await openSearchOverlay(page);
  await expect(page).toHaveURL(/overlay=search/);
  await overlay.getByTestId('search-overlay-query').focus();
  await expect(overlay.getByTestId('search-overlay-query')).toBeFocused();
  await page.keyboard.press('Escape');
  await expectSearchClosed(page);
  await expect(page).toHaveURL(/\/$/);
  await expect(page).not.toHaveURL(/overlay=search/);
  await page.goBack();
  await expect(page).toHaveURL(/\/works/);
});

test('Search dimmer click consumes exactly one history step', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 860 });
  await page.goto('/works');
  await expect(page.getByTestId('catalog-scroll-view')).toBeVisible();
  await page.getByTestId('figma-floating-dock').getByLabel('Главная').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page).not.toHaveURL(/\/works/);
  await openSearchOverlay(page);
  await page.getByTestId('overlay-dimmer').click({ position: { x: 8, y: 200 } });
  await expectSearchClosed(page);
  await expect(page).toHaveURL(/\/$/);
  await expect(page).not.toHaveURL(/overlay=search/);
  await page.goBack();
  await expect(page).toHaveURL(/\/works/);
});

test('FilterSheet Escape closes the sheet once and keeps Works', async ({
  page,
}) => {
  await page.goto('/works');
  await expect(page.getByRole('button', { name: /Фильтры/ })).toBeVisible();
  await page.getByRole('button', { name: /Фильтры/ }).click();
  await expect(page.getByRole('dialog', { name: 'Фильтры' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Фильтры' })).toHaveCount(0);
  await expect(page).toHaveURL(/\/works/);
  await expect(page.getByRole('button', { name: /Фильтры/ })).toBeVisible();
});

test('Search overlay tabs, live query, navigation, and close', async ({
  page,
  request,
}) => {
  const { work, author, category } = await publicSearchFixtures(request);

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
  await expect(page).toHaveURL(/otab=authors/);
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
  await expect.poll(() => page.url()).toMatch(/oq=/);

  const clearedWorks = page.waitForResponse((response) =>
    isListResponse(response, '/api/works'),
  );
  await overlay.getByTestId('search-overlay-query').fill('');
  await clearedWorks;
  await expect(overlay.locator('a[href^="/product/"]').first()).toBeVisible();

  await overlay.getByRole('tab', { name: 'Категории' }).click();
  await overlay.getByRole('link', { name: category.name }).click();
  await expectSearchClosed(page);
  await expect(page).toHaveURL(new RegExp(`category=${category.id}`));
  await expect(page.getByRole('button', { name: /Фильтры/ })).toBeVisible();

  await page.goBack();
  await expect(page.getByTestId('search-overlay')).toBeVisible();
  await expect(
    page.getByTestId('search-overlay').getByRole('tab', { name: 'Категории' }),
  ).toHaveAttribute('aria-selected', 'true');

  await page.getByRole('button', { name: 'Закрыть поиск' }).click();
  await expectSearchClosed(page);
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

test('/search deep link hosts the overlay and close uses the Home fallback', async ({
  page,
}) => {
  await page.goto('/search?q=dali');
  const overlay = page.getByTestId('search-overlay');
  await expect(overlay).toBeVisible();
  await expect(overlay.getByTestId('search-overlay-query')).toHaveValue('dali');
  await overlay.getByRole('button', { name: 'Закрыть поиск' }).click();
  await expectSearchClosed(page);
  await expect(page).not.toHaveURL(/\/search/);
});

test('/search Escape leaves the dedicated Search route', async ({ page }) => {
  await page.goto('/search');
  const overlay = page.getByTestId('search-overlay');
  await expect(overlay).toBeVisible();
  await expect(overlay.getByTestId('search-overlay-query')).toHaveValue('');
  await page.keyboard.press('Escape');
  await expectSearchClosed(page);
  await expect(page).not.toHaveURL(/\/search/);
});

test('/search result navigation leaves Search without forcing Home', async ({
  page,
  request,
}) => {
  const { category } = await publicSearchFixtures(request);

  await page.goto('/search');
  const overlay = page.getByTestId('search-overlay');
  await expect(overlay).toBeVisible();
  await overlay.getByRole('link', { name: category.name }).click();
  await expectSearchClosed(page);
  await expect(page).toHaveURL(new RegExp(`category=${category.id}`));
  await expect(page).not.toHaveURL(/\/search/);
  await expect(page.getByRole('button', { name: /Фильтры/ })).toBeVisible();
});

test('client-side Back from Search returns the underlying route, not Home', async ({
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
  await expect(page).toHaveURL(/overlay=search/);
  await page.goBack();
  await expectSearchClosed(page);
  await expect(page).toHaveURL(/\/works/);
  await expect(page).not.toHaveURL(/overlay=search/);
  await expect(page.getByRole('button', { name: /Фильтры/ })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expectSearchClosed(page);
});

test('query and tab edits replace the current Search entry', async ({ page }) => {
  await page.goto('/');
  const overlay = await openSearchOverlay(page);
  await overlay.getByRole('tab', { name: 'Авторы' }).click();
  await overlay.getByTestId('search-overlay-query').fill('vex');
  await expect(page).toHaveURL(/otab=authors/);
  await expect.poll(() => page.url()).toMatch(/oq=vex/);
  await page.goBack();
  await expectSearchClosed(page);
  await expect(page).toHaveURL(/\/$/);
  await expect(page).not.toHaveURL(/oq=/);
});

test('Back from Author and Work restores the Search session', async ({
  page,
  request,
}) => {
  const { work, author } = await publicSearchFixtures(request);

  await page.goto('/');
  const overlay = await openSearchOverlay(page);
  await overlay.getByRole('tab', { name: 'Авторы' }).click();
  await overlay.getByTestId('search-overlay-query').fill(author.slug);
  await expect.poll(() => page.url()).toMatch(new RegExp(`oq=${author.slug}`));
  await overlay.getByRole('link', { name: `@${author.slug}` }).first().click();
  await expect(page).toHaveURL(new RegExp(`/seller/${author.slug}`));
  await expectSearchClosed(page);
  await page.getByRole('button', { name: 'Назад' }).click();
  const restored = page.getByTestId('search-overlay');
  await expect(restored).toBeVisible();
  await expect(restored.getByRole('tab', { name: 'Авторы' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(restored.getByTestId('search-overlay-query')).toHaveValue(author.slug);

  await restored.getByRole('tab', { name: 'Работы' }).click();
  await restored.getByTestId('search-overlay-query').fill(work.title);
  await expect.poll(() => page.url()).toMatch(/oq=/);
  await restored.locator(`a[href="/product/${work.publicId}"]`).first().click();
  await expect(page).toHaveURL(new RegExp(`/product/${work.publicId}`));
  await expectSearchClosed(page);
  await page.getByRole('button', { name: 'Назад' }).click();
  await expect(page.getByTestId('search-overlay')).toBeVisible();
  await expect(
    page.getByTestId('search-overlay').getByRole('tab', { name: 'Работы' }),
  ).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('search-overlay-query')).toHaveValue(work.title);
});

test('Back from a Category result restores Search, then keeps Works filters', async ({
  page,
  request,
}) => {
  const { category } = await publicSearchFixtures(request);

  await page.goto('/');
  const overlay = await openSearchOverlay(page);
  await overlay.getByRole('link', { name: category.name }).click();
  await expectSearchClosed(page);
  await expect(page).toHaveURL(new RegExp(`category=${category.id}`));
  await expect(page).toHaveURL(/\/works/);
  await expect(page.getByTestId('works-back')).toBeVisible();
  await page.getByTestId('works-back').getByRole('button', { name: 'Назад' }).click();
  const restored = page.getByTestId('search-overlay');
  await expect(restored).toBeVisible();
  await expect(restored.getByRole('tab', { name: 'Категории' })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  await restored.getByRole('link', { name: category.name }).click();
  await expect(page).toHaveURL(new RegExp(`category=${category.id}`));
  await page
    .getByTestId('catalog-scroll-view')
    .locator('a[href^="/product/"]')
    .first()
    .click();
  await expect(page).toHaveURL(/\/product\//);
  await page.getByRole('button', { name: 'Назад' }).click();
  await expect(page).toHaveURL(/\/works/);
  await expect(page).toHaveURL(new RegExp(`category=${category.id}`));
  await expect(page).not.toHaveURL(/\/product\//);
});

test('detail Back follows history from Home, Works, and Author', async ({
  page,
  request,
}) => {
  const { author } = await publicSearchFixtures(request);

  await page.goto('/');
  await page.locator('#home-new-works a[href^="/product/"]').first().click();
  await expect(page).toHaveURL(/\/product\//);
  await page.getByRole('button', { name: 'Назад' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Новые работы', { exact: true })).toBeVisible();

  await page
    .locator('#home-new-works')
    .getByRole('button', { name: 'Смотреть все' })
    .click();
  await expect(page).toHaveURL(/\/works/);
  await page
    .getByTestId('catalog-scroll-view')
    .locator('a[href^="/product/"]')
    .first()
    .click();
  await page.getByRole('button', { name: 'Назад' }).click();
  await expect(page).toHaveURL(/\/works/);
  await expect(page).not.toHaveURL(/\/product\//);

  await page.goto(`/seller/${author.slug}`);
  await page
    .locator('a[href^="/product/"]')
    .filter({ visible: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/product\//);
  await page.getByRole('button', { name: 'Назад' }).click();
  await expect(page).toHaveURL(new RegExp(`/seller/${author.slug}`));
});

test('browser Forward after Search → Author does not corrupt Search', async ({
  page,
  request,
}) => {
  const { author } = await publicSearchFixtures(request);
  await page.goto('/');
  const overlay = await openSearchOverlay(page);
  await overlay.getByRole('tab', { name: 'Авторы' }).click();
  await overlay.getByRole('link', { name: `@${author.slug}` }).first().click();
  await expect(page).toHaveURL(new RegExp(`/seller/${author.slug}`));
  await page.goBack();
  await expect(page.getByTestId('search-overlay')).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`/seller/${author.slug}`));
  await expectSearchClosed(page);
  await page.goBack();
  await expect(page.getByTestId('search-overlay')).toBeVisible();
  await expect(
    page.getByTestId('search-overlay').getByRole('tab', { name: 'Авторы' }),
  ).toHaveAttribute('aria-selected', 'true');
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
  await expectSearchClosed(page);
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

test('desktop pointer hover marks Author, Category, and Work hits', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const overlay = await openSearchOverlay(page);
  const category = overlay.getByTestId('category-search-tile').first();
  await category.hover();
  await expect.poll(async () => hoverFill(category)).not.toBe('rgba(0, 0, 0, 0)');
  await overlay.getByTestId('search-overlay-query').hover();
  await expect.poll(async () => hoverFill(category)).toBe('rgba(0, 0, 0, 0)');

  await overlay.getByRole('tab', { name: 'Авторы' }).click();
  const author = overlay.getByTestId('author-search-row').first();
  await expect
    .poll(async () =>
      author.evaluate((node) => {
        const row = node.firstElementChild;
        if (!(row instanceof HTMLElement)) return { display: 'none', direction: 'none' };
        const style = getComputedStyle(row);
        return {
          display: style.display,
          direction: style.flexDirection,
        };
      }),
    )
    .toMatchObject({ display: 'flex', direction: 'row' });
  const authorBox = await author.boundingBox();
  expect(authorBox?.height ?? 99).toBeLessThan(72);
  await author.hover();
  await expect.poll(async () => hoverFill(author)).not.toBe('rgba(0, 0, 0, 0)');
  await overlay.getByTestId('search-overlay-query').hover();
  await expect.poll(async () => hoverFill(author)).toBe('rgba(0, 0, 0, 0)');
  await overlay.getByTestId('search-overlay-query').focus();
  let authorFocused = false;
  for (let step = 0; step < 12; step += 1) {
    await page.keyboard.press('Tab');
    authorFocused = await author.evaluate(
      (node) => node === document.activeElement || node.contains(document.activeElement),
    );
    if (authorFocused) break;
  }
  expect(authorFocused).toBe(true);
  await expect
    .poll(async () =>
      author.evaluate((node) => {
        const focused =
          node === document.activeElement
            ? node
            : node.querySelector(':focus');
        return focused ? getComputedStyle(focused).outlineStyle : 'none';
      }),
    )
    .not.toBe('none');

  await overlay.getByRole('tab', { name: 'Работы' }).click();
  const work = overlay.locator('[data-cover-hit]').first();
  await work.hover();
  await expect
    .poll(async () => work.evaluate((node) => getComputedStyle(node).boxShadow))
    .toMatch(/inset/);
  await overlay.getByTestId('search-overlay-query').hover();
  await expect
    .poll(async () => work.evaluate((node) => getComputedStyle(node).boxShadow))
    .not.toMatch(/inset/);
});

async function openSearchOverlay(page: Page) {
  await page.getByTestId('figma-floating-dock').getByLabel('Поиск').click();
  const overlay = page.getByTestId('search-overlay');
  await expect(overlay).toBeVisible();
  await expect(page).toHaveURL(/overlay=search|\/search/);
  return overlay;
}

async function expectSearchClosed(page: Page) {
  await expect(page.getByTestId('search-overlay')).toHaveCount(0);
}

async function publicSearchFixtures(
  request: {
    get: (url: string) => Promise<{ json: () => Promise<unknown> }>;
  },
) {
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
  const work = worksPayload.works[0]?.work;
  if (!work) throw new Error('Expected at least one published work for Search E2E');

  const category = categoriesPayload.categories.find(
    (candidate) => candidate.id === work.categoryId,
  );
  if (!category) {
    throw new Error(`Expected category ${work.categoryId} for Search E2E work ${work.publicId}`);
  }

  return {
    work,
    author: authorsPayload.authors[0]!.author,
    category,
  };
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

function hoverFill(locator: { evaluate: (fn: (node: Element) => string) => Promise<string> }) {
  return locator.evaluate((node) => getComputedStyle(node).backgroundColor);
}
