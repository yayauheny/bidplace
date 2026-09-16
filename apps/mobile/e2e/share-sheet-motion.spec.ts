import { expect, test, type Page } from '@playwright/test';

const PUBLIC_ID = 'daliEstate1';
const checksum = 'a'.repeat(64);
const categoryId = '10000000-0000-4000-8000-000000000099';

function image(id: string, position: number) {
  return {
    id,
    position,
    url: `/api/images/${id}`,
    mimeType: 'image/svg+xml',
    byteLength: 120,
    checksum,
    width: 390,
    height: 520,
  };
}

function workFixture() {
  const author = {
    id: '10000000-0000-4000-8000-000000000014',
    slug: 'motion-author',
    fullName: 'Анна Морозова',
    country: 'BY',
    city: 'Минск',
    discipline: 'Живопись',
    practice: null,
    profilePhotoUrl: '/api/sellers/motion-author/photo',
    telegramUrl: null,
    instagramUrl: null,
    websiteUrl: null,
    shortDescription: 'Короткая биография.',
    biography: null,
    achievements: [],
    sharePath: '/authors/motion-author',
  };
  const work = {
    id: '20000000-0000-4000-8000-000000000021',
    publicId: PUBLIC_ID,
    title: 'The First Days of Spring in Cadaqués, 1922',
    story: 'История работы для шаринга.',
    categoryId,
    technique: 'Масло',
    materials: 'Холст',
    dimensions: '40x50',
    year: 1922,
    uniqueness: 'Единственный экземпляр',
    images: [
      image('30000000-0000-4000-8000-0000000000a1', 0),
      image('30000000-0000-4000-8000-0000000000a2', 1),
    ],
    publishedAt: '2026-09-16T00:00:00.000Z',
    sharePath: `/works/${PUBLIC_ID}`,
  };
  return {
    work,
    author,
    relatedWorks: [],
  };
}

function authorFixture(slug: string) {
  const author = {
    id: '10000000-0000-4000-8000-000000000004',
    slug,
    fullName: 'Анна Морозова',
    country: 'BY',
    city: 'Минск',
    discipline: 'Живопись,Картины,Масло',
    practice: 'Практика автора',
    profilePhotoUrl: `/api/sellers/${slug}/photo`,
    telegramUrl: 'https://t.me/anna',
    instagramUrl: 'https://instagram.com/anna',
    websiteUrl: 'https://anna.example',
    shortDescription: 'Короткая биография для проверки шапки.',
    biography: null,
    achievements: [],
    sharePath: `/authors/${slug}`,
  };
  return {
    author,
    works: [],
    pagination: { page: 1, limit: 20, total: 0 },
  };
}

async function mockWork(page: Page) {
  const payload = workFixture();
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 401, json: { message: 'Unauthorized' } }),
  );
  await page.route('**/api/categories', (route) =>
    route.fulfill({ json: { categories: [] } }),
  );
  await page.route('**/api/portfolio/facets', (route) =>
    route.fulfill({
      json: { materials: [], cities: ['Минск'], tags: ['Живопись'] },
    }),
  );
  await page.route(`**/api/works/${PUBLIC_ID}`, (route) =>
    route.fulfill({ json: payload }),
  );
  await page.route('**/api/images/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="366" height="488"><rect width="366" height="488" fill="#888888"/></svg>',
    }),
  );
}

async function mockAuthor(page: Page, slug: string) {
  const payload = authorFixture(slug);
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 401, json: { message: 'Unauthorized' } }),
  );
  await page.route('**/api/categories', (route) =>
    route.fulfill({ json: { categories: [] } }),
  );
  await page.route('**/api/portfolio/facets', (route) =>
    route.fulfill({
      json: { materials: [], cities: ['Минск'], tags: ['Живопись'] },
    }),
  );
  await page.route(`**/api/authors/${slug}?**`, (route) =>
    route.fulfill({ json: payload }),
  );
  await page.route(`**/api/authors/${slug}`, (route) =>
    route.fulfill({ json: payload }),
  );
  await page.route(`**/api/sellers/${slug}/photo`, (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112"><rect width="112" height="112" fill="#cccccc"/></svg>',
    }),
  );
  await page.route('**/api/images/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112"><rect width="112" height="112" fill="#cccccc"/></svg>',
    }),
  );
}

function dialog(page: Page) {
  return page.getByRole('dialog', { name: 'Поделиться' });
}

async function expectOneSheet(page: Page) {
  await expect(dialog(page)).toHaveCount(1);
  await expect(dialog(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Закрыть окно' })).toHaveCount(
    1,
  );
}

async function closeWithX(page: Page) {
  await page.getByRole('button', { name: 'Закрыть окно' }).click();
  await expect(dialog(page)).toHaveCount(0, { timeout: 2000 });
}

async function expectClosed(page: Page) {
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Закрыть окно' })).toHaveCount(
    0,
  );
}

test.describe('share sheet motion', () => {
  test('opens one Work sheet and closes it with X', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockWork(page);
    await page.goto(`/product/${PUBLIC_ID}`);
    await expect(
      page.getByRole('button', { name: 'Поделиться работой' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Поделиться работой' }).click();
    await expectOneSheet(page);
    await closeWithX(page);
    await expectClosed(page);
  });

  test('does not duplicate the Work sheet on rapid open and close', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockWork(page);
    await page.goto(`/product/${PUBLIC_ID}`);
    const share = page.getByRole('button', { name: 'Поделиться работой' });
    await expect(share).toBeVisible();
    await share.evaluate((button) => {
      if (!(button instanceof HTMLElement)) {
        throw new Error('missing share control');
      }
      button.click();
      button.click();
    });
    await expectOneSheet(page);
    await closeWithX(page);
    await share.click();
    await expectOneSheet(page);
    await page.getByRole('button', { name: 'Закрыть окно' }).click();
    await share.click();
    await expectOneSheet(page);
    await closeWithX(page);
    await expectClosed(page);
  });

  test('opens one Creator sheet and closes it with X', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockAuthor(page, 'motion-share');
    await page.goto('/seller/motion-share');
    const share = page.getByRole('button', { name: 'Поделиться профилем' });
    await expect(share).toBeVisible();
    await share.evaluate((button) => {
      if (!(button instanceof HTMLElement)) {
        throw new Error('missing share control');
      }
      button.click();
      button.click();
    });
    await expectOneSheet(page);
    await closeWithX(page);
    await share.click();
    await expectOneSheet(page);
    await closeWithX(page);
    await expectClosed(page);
  });
});
