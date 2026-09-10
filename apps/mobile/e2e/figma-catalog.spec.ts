import { expect, test, type Page } from '@playwright/test';

const checksum = 'a'.repeat(64);
const categoryId = '10000000-0000-4000-8000-000000000003';
const imageId = '10000000-0000-4000-8000-000000000001';
const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="264" height="352"><rect width="264" height="352" fill="#d9d9d9"/></svg>`;

const catalogWork = {
  work: {
    id: '10000000-0000-4000-8000-000000000002',
    publicId: 'ABCDEFGHIJK',
    title: 'Каталожная работа',
    story: null,
    categoryId,
    technique: null,
    materials: 'холст',
    dimensions: null,
    year: 2026,
    images: [
      {
        id: imageId,
        position: 0,
        url: `/api/images/${imageId}`,
        mimeType: 'image/svg+xml',
        byteLength: 1,
        checksum,
        width: 264,
        height: 352,
      },
    ],
    publishedAt: '2026-09-10T00:00:00.000Z',
    sharePath: '/works/ABCDEFGHIJK',
  },
  author: {
    id: '10000000-0000-4000-8000-000000000004',
    slug: 'test-author',
    fullName: 'Тестовый автор',
    country: 'Беларусь',
    city: 'Минск',
    discipline: 'Живопись',
    practice: null,
    profilePhotoUrl: '/api/sellers/test-author/photo',
    telegramUrl: null,
    instagramUrl: null,
    websiteUrl: null,
    shortDescription: 'Описание автора',
    achievements: [],
    sharePath: '/authors/test-author',
  },
};

async function stubCatalog(page: Page, total = 1) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
  });
  await page.route('**/api/categories**', async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        categories: [
          {
            id: categoryId,
            slug: 'painting',
            name: 'Живопись',
            description: null,
          },
        ],
      },
    });
  });
  await page.route('**/api/works**', async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        works: [catalogWork],
        pagination: { page: 1, limit: 20, total },
      },
    });
  });
  await page.route(/\/api\/authors(\?|$)/, async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        authors: [{ author: catalogWork.author, workCount: 1 }],
        pagination: { page: 1, limit: 20, total },
      },
    });
  });
  await page.route('**/api/images/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: placeholderSvg,
    });
  });
  await page.route('**/api/sellers/**/photo', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: placeholderSvg,
    });
  });
}

test('works catalog keeps URL query as the source of truth', async ({
  page,
}) => {
  await stubCatalog(page);
  await page.goto('/works?q=глина&sort=oldest');

  await expect(page.getByText('Каталожная работа')).toBeVisible();
  await expect(page).toHaveURL(/sort=oldest/);
  await expect(page).toHaveURL(/q=/);
  await page.getByRole('button', { name: 'Сортировка' }).click();
  await expect(page.getByRole('dialog', { name: 'Сортировка' })).toBeVisible();
  await page.getByRole('radio', { name: 'Сначала новые' }).click();
  await expect(page).not.toHaveURL(/sort=oldest/);
});

test('works catalog reset and pagination write the URL', async ({ page }) => {
  await stubCatalog(page, 40);
  await page.goto('/works?q=глина&page=1');

  await page.getByRole('button', { name: 'Фильтры' }).click();
  await expect(page.getByRole('dialog', { name: 'Фильтры' })).toBeVisible();
  await page.getByRole('button', { name: 'Очистить' }).click();
  await expect(page).toHaveURL(/\/works$/);

  await page.goto('/works');
  await expect(page.getByRole('button', { name: 'Дальше' })).toBeVisible();
  await page.getByRole('button', { name: 'Дальше' }).click();
  await expect(page).toHaveURL(/page=2/);
});

test('filter sheet dismisses from the keyboard', async ({ page }) => {
  await stubCatalog(page);
  await page.goto('/works');
  await page.getByRole('button', { name: 'Фильтры' }).click();
  await expect(page.getByRole('dialog', { name: 'Фильтры' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Фильтры' })).toHaveCount(0);
});
