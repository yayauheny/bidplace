import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { e2eEvidenceDir } from './support/evidence-dir';

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

async function mockApi(page: Page, failFirstCreate = false) {
  let exists = false;
  let createAttempts = 0;
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
            slug: null,
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
      if (exists) return route.fulfill({ json: createdProfile });
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'not_found', message: 'Not found' }),
      });
      return;
    }
    if (key === 'GET /api/countries') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          countries: [{ code: 'BY', name: 'Беларусь' }],
        }),
      });
      return;
    }
    if (key === 'POST /api/auth/slug') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ slug: 'synthetic-author' }),
      });
      return;
    }
    if (key === 'POST /api/seller/profile') {
      createAttempts += 1;
      if (failFirstCreate && createAttempts === 1)
        return route.fulfill({
          status: 503,
          json: { message: 'Не удалось сохранить профиль' },
        });
      exists = true;
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
    if (
      url.port === '3001' &&
      request.method() === 'POST' &&
      url.pathname === '/api/seller/profile'
    ) {
      posts.push(request.postData() ?? '');
    }
  });
  await mockApi(page);
  await page.goto('/profile?step=1');
  const nickname = page.getByRole('textbox', { name: 'Никнейм', exact: true });
  await expect(nickname).toBeVisible();
  await nickname.fill('БЕ');
  await page
    .getByRole('textbox', { name: 'Имя или название', exact: true })
    .fill('Synthetic Author');
  await page.getByRole('button', { name: 'Страна' }).click();
  await page.getByRole('radio', { name: 'Беларусь' }).click();
  await page.getByRole('textbox', { name: 'Город', exact: true }).fill('Minsk');
  await expect(page.getByText(nicknameError)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Продолжить' })).toBeDisabled();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Назад', exact: true }).click();
  await page.getByRole('button', { name: 'Загрузить фото' }).click();
  await (
    await chooser
  ).setFiles({
    name: 'portrait.png',
    mimeType: 'image/png',
    buffer: portrait,
  });
  await expect(
    page.getByRole('button', { name: 'Изменить фото' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(nickname).toHaveValue('БЕ');
  await expect(
    page.getByRole('textbox', { name: 'Имя или название', exact: true }),
  ).toHaveValue('Synthetic Author');
  await expect(
    page.getByRole('textbox', { name: 'Город', exact: true }),
  ).toHaveValue('Minsk');
  expect(posts).toEqual([]);
  await expect(page.getByText('Не удалось сохранить профиль')).toHaveCount(0);

  await nickname.fill('synthetic-author');
  await expect(page.getByText(nicknameError)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Продолжить' })).toBeEnabled();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await expect(
    page.getByRole('progressbar', { name: 'Шаг 3 из 5' }),
  ).toBeVisible();
  await expect(page.getByText('Контакты', { exact: true })).toBeVisible();
  expect(posts).toHaveLength(1);
  expect(posts[0]).not.toContain('name="slug"');
  expect(posts[0]).toContain('Synthetic Author');
  expect(posts[0]).toContain('name="profilePhoto"');
});

test('author photo UI step preserves input and selected photo when creation fails', async ({
  page,
}) => {
  await mockApi(page, true);
  const creates: string[] = [];
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      new URL(request.url()).pathname === '/api/seller/profile'
    )
      creates.push(request.postData() ?? '');
  });
  await page.setViewportSize({ width: 390, height: 824 });
  await page.goto('/profile?step=photo');
  await expect(
    page.getByRole('progressbar', { name: 'Шаг 1 из 5' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Продолжить', exact: true }),
  ).toBeDisabled();
  await mkdir(resolve(e2eEvidenceDir, 'portfolio-design'), { recursive: true });
  for (const width of [320, 390, 414, 440, 1024, 1440]) {
    await page.setViewportSize({ width, height: width === 440 ? 480 : 824 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: resolve(
        e2eEvidenceDir,
        'portfolio-design',
        `author-photo-${test.info().project.name}-${width}.png`,
      ),
    });
  }
  await page.setViewportSize({ width: 390, height: 824 });
  const chooser = page.waitForEvent('filechooser');
  await page
    .getByRole('button', { name: 'Загрузить фото', exact: true })
    .click();
  await (
    await chooser
  ).setFiles({ name: 'portrait.png', mimeType: 'image/png', buffer: portrait });
  await expect(
    page.getByRole('button', { name: 'Изменить фото' }),
  ).toBeVisible();
  expect(creates).toHaveLength(0);
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(
    page.getByRole('progressbar', { name: 'Шаг 2 из 5' }),
  ).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Никнейм', exact: true })
    .fill('synthetic-author');
  await page
    .getByRole('textbox', { name: 'Имя или название', exact: true })
    .fill('Synthetic Author');
  await page.getByRole('button', { name: 'Страна', exact: true }).click();
  await page.getByRole('radio', { name: 'Беларусь', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Страна' })).toHaveCount(0);
  await page.screenshot({
    path: resolve(
      e2eEvidenceDir,
      'portfolio-design',
      `author-basics-${test.info().project.name}-390.png`,
    ),
  });
  await page.getByRole('button', { name: 'Назад', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Изменить фото' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'Имя или название', exact: true }),
  ).toHaveValue('Synthetic Author');
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(
    page.getByTestId('form-page').getByText('Проверьте соединение и попробуйте ещё раз.', {
      exact: true,
    }),
  ).toBeVisible();
  expect(creates).toHaveLength(1);
  await expect(
    page.getByRole('textbox', { name: 'Имя или название', exact: true }),
  ).toHaveValue('Synthetic Author');
  await page.getByRole('button', { name: 'Назад', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Изменить фото' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(
    page.getByRole('progressbar', { name: 'Шаг 3 из 5' }),
  ).toBeVisible();
  expect(creates).toHaveLength(2);
  expect(creates.every((body) => body.includes('name="profilePhoto"'))).toBe(
    true,
  );
  await page.screenshot({
    path: resolve(
      e2eEvidenceDir,
      'portfolio-design',
      `author-contacts-${test.info().project.name}-390.png`,
    ),
  });
});
