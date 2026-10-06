import { expect, test, type Page } from '@playwright/test';

const now = '2026-10-06T14:14:00.000Z';
const userId = '11111111-1111-4111-8111-111111111111';
const profileId = '22222222-2222-4222-8222-222222222222';
const revisionId = '33333333-3333-4333-8333-333333333333';
const nicknameError =
  'Используйте маленькие латинские буквы и цифры. Между ними можно поставить дефис или подчёркивание.';
const portrait = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const createdProfile = {
  sellerProfile: {
    id: profileId,
    userId,
    slug: 'synthetic-author',
    sellerType: 'creator',
    discipline: null,
    fullName: 'Synthetic Author',
    country: 'BY',
    city: 'Minsk',
    practice: null,
    biography: null,
    profilePhotoUrl: '/api/sellers/synthetic-author/photo',
    socialLink: null,
    telegramUrl: null,
    instagramUrl: null,
    websiteUrl: null,
    publicEmail: null,
    shortDescription: null,
    handoffContactType: null,
    handoffContactValue: null,
    handoffInitiator: null,
    status: 'DRAFT',
    applicationStage: null,
    createdAt: now,
    updatedAt: now,
  },
  editingRevision: {
    id: revisionId,
    version: 1,
    status: 'DRAFT',
    updatedAt: now,
  },
};

async function mockApi(page: Page) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.port !== '3001') {
      await route.continue();
      return;
    }
    const key = `${route.request().method()} ${url.pathname}`;
    if (key === 'GET /api/auth/me') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: userId,
            email: 'synthetic-author@bidplace.test',
            phone: null,
            emailVerifiedAt: now,
            phoneVerifiedAt: null,
            acceptedRulesVersion: null,
            displayName: 'Synthetic Author',
            role: 'user',
            status: 'active',
            createdAt: now,
            updatedAt: now,
          },
        }),
      });
      return;
    }
    if (key === 'GET /api/seller/profile') {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'not_found', message: 'Not found' }),
      });
      return;
    }
    if (key === 'POST /api/seller/profile') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(createdProfile),
      });
      return;
    }
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'not stubbed' }),
    });
  });
}

test('an invalid nickname stays on step 1 until it matches the slug contract', async ({
  page,
}) => {
  const posts: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.port === '3001' && request.method() === 'POST' && url.pathname === '/api/seller/profile') {
      posts.push(request.postData() ?? '');
    }
  });
  await mockApi(page);
  await page.goto('/profile?step=1');
  const nickname = page.getByRole('textbox', { name: 'Никнейм *' });
  await expect(nickname).toBeVisible();
  await nickname.fill('БЕ');
  await page.getByRole('textbox', { name: 'Имя или название *' }).fill('Synthetic Author');
  await page.getByRole('textbox', { name: 'Страна *' }).fill('BY');
  await page.getByRole('textbox', { name: 'Город *' }).fill('Minsk');
  await expect(page.getByText(nicknameError)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Продолжить' })).toBeDisabled();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Добавить фото' }).click();
  await (await chooser).setFiles({
    name: 'portrait.png',
    mimeType: 'image/png',
    buffer: portrait,
  });
  await expect(page.getByRole('button', { name: 'Изменить фото' })).toBeVisible();
  await expect(nickname).toHaveValue('БЕ');
  await expect(page.getByRole('textbox', { name: 'Имя или название *' })).toHaveValue(
    'Synthetic Author',
  );
  await expect(page.getByRole('textbox', { name: 'Город *' })).toHaveValue('Minsk');
  expect(posts).toEqual([]);
  await expect(page.getByText('Не удалось сохранить профиль')).toHaveCount(0);

  await nickname.fill('synthetic-author');
  await expect(page.getByText(nicknameError)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Изменить фото' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Продолжить' })).toBeEnabled();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await expect(page.getByText('Шаг 2 из 4')).toBeVisible();
  await expect(page.getByText('Контакты', { exact: true })).toBeVisible();
  expect(posts).toHaveLength(1);
  expect(posts[0]).toContain('name="slug"');
  expect(posts[0]).toContain('synthetic-author');
  expect(posts[0]).toContain('Synthetic Author');
  expect(posts[0]).toContain('name="profilePhoto"');
});
