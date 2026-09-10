import { expect, test, type Page } from '@playwright/test';

const checksum = 'a'.repeat(64);
const imageId = '10000000-0000-4000-8000-000000000001';
const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="264" height="352"><rect width="264" height="352" fill="#d9d9d9"/></svg>`;

const author = {
  id: '10000000-0000-4000-8000-000000000004',
  slug: 'test-author',
  fullName: 'Тестовый автор',
  country: 'Беларусь',
  city: 'Минск',
  discipline: 'Живопись',
  practice: 'Практика автора',
  profilePhotoUrl: '/api/sellers/test-author/photo',
  telegramUrl: 'https://t.me/testauthor',
  instagramUrl: null,
  websiteUrl: null,
  shortDescription: 'Описание автора',
  achievements: [],
  sharePath: '/authors/test-author',
};

const work = {
  id: '10000000-0000-4000-8000-000000000002',
  publicId: 'ABCDEFGHIJK',
  title: 'Работа для визуальной матрицы',
  story: 'Короткий текст истории.',
  categoryId: '10000000-0000-4000-8000-000000000003',
  technique: 'Масло',
  materials: 'Холст',
  dimensions: '40×50',
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
};

async function stubPublicApi(page: Page) {
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
  });
  await page.route('**/api/portfolio/home', async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        curatorSelection: { work, author },
        newWorks: [{ work, author }],
        newAuthors: [author],
      },
    });
  });
  await page.route('**/api/works/ABCDEFGHIJK**', async (route) => {
    if (route.request().url().includes('/api/images/')) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      json: { work, author, relatedWorks: [] },
    });
  });
  await page.route('**/api/works**', async (route) => {
    if (route.request().url().includes(`/api/works/${work.publicId}`)) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      json: {
        works: [{ work, author }],
        pagination: { page: 1, limit: 20, total: 1 },
      },
    });
  });
  await page.route('**/api/authors/test-author**', async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        author,
        works: [{ work, author }],
        pagination: { page: 1, limit: 20, total: 1 },
      },
    });
  });
  await page.route(/\/api\/authors(\?|$)/, async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        authors: [{ author, workCount: 1 }],
        pagination: { page: 1, limit: 20, total: 1 },
      },
    });
  });
  await page.route('**/api/categories**', async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        categories: [
          {
            id: work.categoryId,
            slug: 'painting',
            name: 'Живопись',
            description: null,
          },
        ],
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

async function assertPhoneColumn(page: Page) {
  const box = await page.getByTestId('app-shell-content').boundingBox();
  expect(box?.width).toBeLessThanOrEqual(390);
}

test('visual fixtures cover Home Works Authors creator and work', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await stubPublicApi(page);

  const shots = [
    ['/', 'home'],
    ['/works', 'works'],
    ['/authors', 'authors'],
    ['/seller/test-author', 'creator'],
    ['/product/ABCDEFGHIJK', 'work'],
  ] as const;

  for (const [path, name] of shots) {
    await page.goto(path);
    await assertPhoneColumn(page);
    await page.screenshot({
      path: testInfo.outputPath(`${name}-390.png`),
      fullPage: true,
    });
  }

  await page.goto('/');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.screenshot({
    path: testInfo.outputPath('home-reduced-motion.png'),
    fullPage: true,
  });

  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await page.screenshot({
    path: testInfo.outputPath('home-zoom-200.png'),
  });

  await page.keyboard.press('Tab');
  await page.screenshot({
    path: testInfo.outputPath('home-keyboard.png'),
  });
});
