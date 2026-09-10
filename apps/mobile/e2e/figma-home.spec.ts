import { expect, test, type Page } from '@playwright/test';

const checksum = 'a'.repeat(64);
const workImageId = '10000000-0000-4000-8000-000000000001';
const curatorImageId = '10000000-0000-4000-8000-000000000011';
const categoryId = '10000000-0000-4000-8000-000000000003';
const publishedAt = '2026-09-10T00:00:00.000Z';

const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="264" height="352"><rect width="264" height="352" fill="#d9d9d9"/></svg>`;

function work(input: {
  id: string;
  publicId: string;
  title: string;
  imageId: string;
}) {
  return {
    id: input.id,
    publicId: input.publicId,
    title: input.title,
    story: null,
    categoryId,
    technique: null,
    materials: null,
    dimensions: null,
    year: 2026,
    images: [
      {
        id: input.imageId,
        position: 0,
        url: `/api/images/${input.imageId}`,
        mimeType: 'image/svg+xml',
        byteLength: 1,
        checksum,
        width: 264,
        height: 352,
      },
    ],
    publishedAt,
    sharePath: `/works/${input.publicId}`,
  };
}

function author(input: {
  id: string;
  slug: string;
  fullName: string;
  shortDescription?: string;
}) {
  return {
    id: input.id,
    slug: input.slug,
    fullName: input.fullName,
    country: 'Беларусь',
    city: 'Минск',
    discipline: 'Живопись',
    practice: null,
    profilePhotoUrl: `/api/sellers/${input.slug}/photo`,
    telegramUrl: null,
    instagramUrl: null,
    websiteUrl: null,
    shortDescription: input.shortDescription ?? 'Описание автора',
    achievements: [],
    sharePath: `/authors/${input.slug}`,
  };
}

const catalogWork = work({
  id: '10000000-0000-4000-8000-000000000002',
  publicId: 'ABCDEFGHIJK',
  title: 'Работа с живым фоном',
  imageId: workImageId,
});

const catalogAuthor = author({
  id: '10000000-0000-4000-8000-000000000004',
  slug: 'test-author',
  fullName: 'Тестовый автор',
});

const curatorWork = work({
  id: '10000000-0000-4000-8000-000000000012',
  publicId: 'CURATORWORK',
  title: 'Внутренние миры',
  imageId: curatorImageId,
});

const curatorAuthor = author({
  id: '10000000-0000-4000-8000-000000000014',
  slug: 'vex',
  fullName: 'Vex',
  shortDescription: 'Ищу логику в абсурде.',
});

const longTitle =
  'Очень длинное название работы, которое не должно ломать колонку и остаётся читаемым на ширине телефона';

async function stubAuth(page: Page) {
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
  });
}

async function stubMedia(page: Page) {
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

async function stubHome(
  page: Page,
  body: {
    curatorSelection: unknown;
    newWorks: unknown[];
    newAuthors: unknown[];
  },
) {
  await stubAuth(page);
  await stubMedia(page);
  await page.route('**/api/portfolio/home', async (route) => {
    await route.fulfill({ status: 200, json: body });
  });
}

test('home shows curator only when the server sends a selection', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await stubHome(page, {
    curatorSelection: { work: curatorWork, author: curatorAuthor },
    newWorks: [{ work: catalogWork, author: catalogAuthor }],
    newAuthors: [catalogAuthor],
  });

  await page.goto('/');

  await expect(page.getByText('Открытие недели')).toBeVisible();
  await expect(page.getByText('Выбор куратора')).toBeVisible();
  await expect(page.getByText('Внутренние миры').first()).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Смотреть профиль' }),
  ).toHaveCount(1);
  await expect(page.getByText('Новые работы')).toBeVisible();
  await expect(page.getByText('Авторы')).toBeVisible();
  await expect(page.getByText('Активные торги')).toHaveCount(0);
  await expect(page.getByText('лот', { exact: false })).toHaveCount(0);

  const shell = page.getByTestId('app-shell-content');
  const box = await shell.boundingBox();
  expect(box?.width).toBeLessThanOrEqual(390);
});

test('home omits curator when the server selection is null', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await stubHome(page, {
    curatorSelection: null,
    newWorks: [{ work: catalogWork, author: catalogAuthor }],
    newAuthors: [catalogAuthor],
  });

  await page.goto('/');

  await expect(page.getByText('Новые работы')).toBeVisible();
  await expect(page.getByText('Работа с живым фоном')).toBeVisible();
  await expect(page.getByText('Авторы')).toBeVisible();
  await expect(page.getByText('Тестовый автор')).toBeVisible();
  await expect(page.getByText('Открытие недели')).toHaveCount(0);
  await expect(page.getByText('Выбор куратора')).toHaveCount(0);
});

test('home empty state appears when the catalog and curator are absent', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await stubHome(page, {
    curatorSelection: null,
    newWorks: [],
    newAuthors: [],
  });

  await page.goto('/');

  await expect(page.getByText('Пока здесь тихо')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Все работы' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Все авторы' })).toHaveCount(1);
  await expect(page.getByText('Открытие недели')).toHaveCount(0);
  await expect(page.getByText('Новые работы', { exact: true })).toHaveCount(0);
});

test('home error retries through the shared page state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await stubAuth(page);
  await page.route('**/api/portfolio/home', async (route) => {
    await route.abort('connectionrefused');
  });

  await page.goto('/');

  await expect(page.getByText('Не удалось загрузить главную')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Повторить' })).toHaveCount(1);
  await expect(page.getByRole('alert')).toHaveCount(1);
  await expect(page.getByText('Открытие недели')).toHaveCount(0);
});

test('home keeps the 390 column for long titles and wide windows', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await stubHome(page, {
    curatorSelection: null,
    newWorks: [
      {
        work: work({
          id: '10000000-0000-4000-8000-000000000022',
          publicId: 'LONGWRKTITL',
          title: longTitle,
          imageId: workImageId,
        }),
        author: catalogAuthor,
      },
    ],
    newAuthors: [
      author({
        id: '10000000-0000-4000-8000-000000000024',
        slug: 'long-name-author',
        fullName:
          'Очень длинное имя автора для проверки колонки на широком окне',
      }),
    ],
  });

  await page.goto('/');

  await expect(page.getByText(longTitle)).toBeVisible();
  const shell = page.getByTestId('app-shell-content');
  const box = await shell.boundingBox();
  expect(box?.width).toBeLessThanOrEqual(390);
});
