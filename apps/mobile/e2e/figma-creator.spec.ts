import { expect, test, type Page } from '@playwright/test';

const authorSlug = 'telegram-author';
const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="264" height="352"><rect width="264" height="352" fill="#d9d9d9"/></svg>`;

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

async function stubCreator(page: Page, author = telegramAuthor) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
  });
  await page.route(`**/api/authors/${author.slug}**`, async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        author,
        works: [],
        pagination: { page: 1, limit: 20, total: 0 },
      },
    });
  });
  await page.route(`**/api/sellers/${author.slug}/photo`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: placeholderSvg,
    });
  });
  await page.route('**/api/images/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: placeholderSvg,
    });
  });
}

test('creator omits missing socials and an empty timeline', async ({ page }) => {
  await stubCreator(page);
  await page.goto(`/seller/${authorSlug}`);

  await expect(page.getByText('Автор с Telegram')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Telegram автора' })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Instagram автора' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Сайт автора' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Поделиться профилем' })).toHaveCount(
    1,
  );
  await expect(page.getByText('Выставки и достижения')).toHaveCount(0);
  await expect(page.getByText('Архив', { exact: true })).toHaveCount(0);
});

test('creator tabs switch by keyboard and keep the URL', async ({ page }) => {
  await stubCreator(page);
  await page.goto(`/seller/${authorSlug}`);

  const about = page.getByRole('tab', { name: 'Об авторе' });
  await about.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/seller/${authorSlug}\\?.*tab=about`));
  await expect(page.getByText('Биография')).toBeVisible();
  await expect(page.getByText('Выставки и достижения')).toHaveCount(0);

  await about.focus();
  await expect(about).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Работы 0' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

test('creator share sheet uses the server sharePath', async ({ page }) => {
  await stubCreator(page);
  await page.goto(`/seller/${authorSlug}`);
  await page.getByRole('button', { name: 'Поделиться профилем' }).click();
  await expect(page.getByRole('dialog', { name: 'Поделиться' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Поделиться' })).toHaveCount(0);
});
