import { expect, test } from '@playwright/test';

const authorSlug = 'telegram-author';

const telegramAuthor = {
  id: '10000000-0000-4000-8000-000000000014',
  slug: authorSlug,
  fullName: 'Автор с Telegram',
  country: 'Беларусь',
  city: 'Минск',
  discipline: 'Живопись',
  practice: null,
  profilePhotoUrl: `/api/sellers/${authorSlug}/photo`,
  telegramUrl: 'https://t.me/telegramauthor',
  instagramUrl: null,
  websiteUrl: null,
  shortDescription: 'Автор только с Telegram',
  achievements: [],
  sharePath: `/authors/${authorSlug}`,
};

test('author copy uses a named icon button and omits missing socials', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
  });
  await page.route(`**/api/authors/${authorSlug}**`, async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        author: telegramAuthor,
        works: [],
        pagination: { page: 1, limit: 20, total: 0 },
      },
    });
  });
  await page.route(`**/api/sellers/${authorSlug}/photo`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#d9d9d9"/></svg>`,
    });
  });

  await page.goto(`/seller/${authorSlug}`);

  await expect(page.getByText('Автор с Telegram')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Поделиться профилем' }),
  ).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Telegram автора' })).toHaveCount(
    1,
  );
  await expect(
    page.getByRole('link', { name: 'Instagram автора' }),
  ).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Instagram автора' })).toHaveCount(
    0,
  );
  await expect(page.getByRole('link', { name: 'Сайт автора' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Сайт автора' })).toHaveCount(0);
});

test('search failure retries through the shared page state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
  });
  await page.route('**/api/works**', async (route) => {
    await route.abort('connectionrefused');
  });
  await page.route(/\/api\/authors(\?|$)/, async (route) => {
    await route.abort('connectionrefused');
  });

  await page.goto('/search?q=glass');

  await expect(page.getByText('Не удалось выполнить поиск')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Повторить' })).toHaveCount(1);
  await expect(page.getByRole('alert')).toHaveCount(1);
});
