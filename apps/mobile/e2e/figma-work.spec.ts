import { expect, test, type Page } from '@playwright/test';

const checksum = 'a'.repeat(64);
const imageId = '10000000-0000-4000-8000-000000000001';
const publicId = 'ABCDEFGHIJK';
const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="390" height="520"><rect width="390" height="520" fill="#d9d9d9"/></svg>`;

function work(overrides: Record<string, unknown> = {}) {
  return {
    id: '10000000-0000-4000-8000-000000000002',
    publicId,
    title: 'Работа без истории',
    story: null,
    categoryId: '10000000-0000-4000-8000-000000000003',
    technique: 'Масло',
    materials: null,
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
        width: 390,
        height: 520,
      },
    ],
    publishedAt: '2026-09-10T00:00:00.000Z',
    sharePath: `/works/${publicId}`,
    ...overrides,
  };
}

const author = {
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
};

async function stubWork(
  page: Page,
  body: { work: unknown; author: unknown; relatedWorks?: unknown[] },
  imageStatus = 200,
) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
  });
  await page.route(`**/api/works/${publicId}**`, async (route) => {
    if (route.request().url().includes('/api/images/')) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      json: {
        relatedWorks: [],
        ...body,
      },
    });
  });
  await page.route(`**/api/images/${imageId}`, async (route) => {
    if (imageStatus !== 200) {
      await route.fulfill({ status: imageStatus, body: 'missing' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: placeholderSvg,
    });
  });
}

test('work error retries through the shared page state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
  });
  await page.route(`**/api/works/${publicId}**`, async (route) => {
    await route.abort('connectionrefused');
  });

  await page.goto(`/product/${publicId}`);

  await expect(page.getByText('Не удалось загрузить работу')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Повторить' })).toHaveCount(1);
});

test('work hides the story tab and empty facts', async ({ page }) => {
  await stubWork(page, { work: work(), author });
  await page.goto(`/product/${publicId}`);

  await expect(page.getByText('Работа без истории')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'История' })).toHaveCount(0);
  await expect(page.getByText('Техника')).toBeVisible();
  await expect(page.getByText('Материал')).toHaveCount(0);
  await expect(page.getByText('Размеры')).toHaveCount(0);
  await expect(page.getByText('Оплата и доставка', { exact: true })).toBeVisible();
  await expect(page.getByText('купить', { exact: false })).toHaveCount(0);
});

test('work shows a long title and failed media fallback', async ({ page }) => {
  const longTitle =
    'Очень длинное название работы для проверки колонки на карточке и в идентичности';
  await stubWork(
    page,
    {
      work: work({ title: longTitle }),
      author,
    },
    500,
  );
  await page.goto(`/product/${publicId}`);

  await expect(page.getByText(longTitle)).toBeVisible();
  await expect(page.getByLabel(/Изображение недоступно/).first()).toBeVisible({
    timeout: 20_000,
  });
});
