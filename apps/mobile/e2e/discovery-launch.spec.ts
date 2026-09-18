import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import { e2eEvidenceDir } from './support/evidence-dir';

const apiPort = process.env.E2E_API_PORT ?? '3001';
const apiBaseURL = `http://localhost:${apiPort}`;

type WorksPage = {
  works: Array<{
    work: {
      publicId: string;
      title: string;
      categoryId: string;
      materials: string | null;
    };
  }>;
  pagination: { page: number; limit: number; total: number };
};

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('Works keeps filters in the URL and paginates without duplicates', async ({
  page,
  request,
}) => {
  const worksResponse = await request.get(`${apiBaseURL}/api/works?limit=100`);
  const worksPayload = (await worksResponse.json()) as WorksPage;
  const target = worksPayload.works.find((item) => item.work.materials);
  expect(target).toBeDefined();
  const categoriesResponse = await request.get(`${apiBaseURL}/api/categories`);
  const categoriesPayload = (await categoriesResponse.json()) as {
    categories: Array<{ id: string; name: string }>;
  };
  const category = categoriesPayload.categories.find(
    (item) => item.id === target?.work.categoryId,
  );
  expect(category).toBeDefined();

  const firstPageResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/works' && response.ok(),
  );
  await page.goto('/works');
  const firstPage = (await (await firstPageResponse).json()) as WorksPage;
  expect(firstPage.pagination.page).toBe(1);
  expect(firstPage.pagination.limit).toBeGreaterThan(0);
  expect(firstPage.works).toHaveLength(
    Math.min(firstPage.pagination.limit, firstPage.pagination.total),
  );
  const hasNextPage =
    firstPage.pagination.page * firstPage.pagination.limit <
    firstPage.pagination.total;

  const workLinks = page.locator('a[href^="/product/"]');
  await expect(workLinks).toHaveCount(firstPage.works.length);
  if (hasNextPage) {
    const nextPageResponse = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.pathname === '/api/works' &&
        url.searchParams.get('page') === '2' &&
        response.ok()
      );
    });
    await page.getByRole('button', { name: 'Показать ещё' }).click();
    const nextPage = (await (await nextPageResponse).json()) as WorksPage;
    await expect(workLinks).toHaveCount(
      firstPage.works.length + nextPage.works.length,
    );
    expect(firstPage.works.length + nextPage.works.length).toBeGreaterThan(
      firstPage.works.length,
    );
  } else {
    await expect(page.getByRole('button', { name: 'Показать ещё' })).toHaveCount(
      0,
    );
  }
  await expectNoHorizontalOverflow(page);
  const hrefs = await workLinks.evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')),
  );
  expect(hrefs.every((href) => typeof href === 'string' && href.length > 0)).toBe(
    true,
  );
  expect(new Set(hrefs).size).toBe(hrefs.length);
  await page.screenshot({
    path: resolve(e2eEvidenceDir, 'discovery/works-390.png'),
    fullPage: true,
  });

  await page.getByRole('button', { name: 'Фильтры' }).click();
  await page.getByRole('button', { name: /^Категория,/ }).click();
  await page.getByRole('radio', { name: category!.name }).click();
  await page.getByRole('button', { name: 'Назад' }).click();
  await page.getByRole('button', { name: /^Материал,/ }).click();
  await page.getByRole('radio', { name: target!.work.materials! }).click();
  await page.getByRole('button', { name: 'Назад' }).click();
  await page.getByRole('button', { name: 'Применить' }).click();

  await expect(page).toHaveURL(
    new RegExp(
      `category=${target!.work.categoryId}.*material=${encodeURIComponent(
        target!.work.materials!,
      )}`,
    ),
  );
  await expect(page.getByText(target!.work.title).first()).toBeVisible();

  await page.goto('/authors');
  await page.goBack();
  await expect(page).toHaveURL(/\/works\?.*category=.*material=/);

  await page.getByRole('button', { name: /^Фильтры · 2$/ }).click();
  await page.getByRole('button', { name: 'Сбросить' }).click();
  await page.getByRole('button', { name: 'Применить' }).click();
  await expect(page).toHaveURL(/\/works(?:\?sort=newest)?$/);
});

test('Authors filters and sort are server-backed and URL-owned', async ({
  page,
  request,
}) => {
  const response = await request.get(`${apiBaseURL}/api/authors?limit=1`);
  const payload = (await response.json()) as {
    authors: Array<{
      author: {
        fullName: string;
        discipline: string;
        city: string;
      };
    }>;
  };
  const target = payload.authors[0]!.author;

  await page.goto('/authors');
  await page.getByRole('button', { name: 'Фильтры' }).click();
  await page.getByRole('button', { name: /^Направление,/ }).click();
  await page.getByRole('radio', { name: target.discipline, exact: true }).click();
  await page.getByRole('button', { name: 'Назад' }).click();
  await page.getByRole('button', { name: /^Город,/ }).click();
  await page.getByRole('radio', { name: target.city, exact: true }).click();
  await page.getByRole('button', { name: 'Назад' }).click();
  await page.getByRole('button', { name: 'Применить' }).click();
  await expect(page).toHaveURL(/\/authors\?.*tag=.*city=/);
  await expect(page.getByText(target.fullName).first()).toBeVisible();

  await page.getByRole('button', { name: 'Сортировка' }).click();
  await page.getByRole('radio', { name: 'По имени' }).click();
  await page.getByRole('button', { name: 'Применить' }).click();
  await expect(page).toHaveURL(/\/authors\?.*sort=name/);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: resolve(e2eEvidenceDir, 'discovery/authors-390.png'),
    fullPage: true,
  });
});

test('Search overlay live-updates without submit', async ({
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
  await expect(page).toHaveURL(/\/$/);
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
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: resolve(e2eEvidenceDir, 'discovery/search-390.png'),
    fullPage: true,
  });

  await overlay.getByTestId('search-overlay-query').fill('no-results-zzzz');
  await expect(overlay.getByText('Работы не найдены', { exact: true })).toBeVisible();
});

async function expectNoHorizontalOverflow(
  page: import('@playwright/test').Page,
) {
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
}
