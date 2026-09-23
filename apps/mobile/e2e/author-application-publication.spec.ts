import { expect, test, type Page } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { e2eApiBaseURL } from './support/e2e-env';
import {
  createAdminModerationFixture,
  createBuyerFixture,
} from './support/e2e-fixtures';

async function fillAuthorApplication(page: Page, slug: string, city: string) {
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Добавить фото' }).click();
  await (await chooserPromise).setFiles('e2e/fixtures/profile-photo.png');
  await page.getByLabel('Имя или название').fill('Автор с городом');
  await page.getByLabel('URL-slug').fill(slug);
  await page.getByLabel('Дисциплина').fill('Керамика');
  await page.getByLabel('Страна').fill('BY');
  await page.getByLabel('Город').fill(city);
  await page.getByLabel('Короткое описание').fill('Авторская практика.');
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await expect(page).toHaveURL(/\/profile\?step=2/);
  await expect(page.getByText('Шаг 2 из 2')).toBeVisible();
}

test('author application without city cannot continue and city=null is rejected', async ({
  browser,
}) => {
  const { buyer } = await createBuyerFixture();
  const { context, page } = await authenticatedPage(browser, buyer);
  const slug = `no-city-${Date.now()}`;

  try {
    await page.goto('/profile');
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить фото' }).click();
    await (await chooserPromise).setFiles('e2e/fixtures/profile-photo.png');
    await page.getByLabel('Имя или название').fill('Без города');
    await page.getByLabel('URL-slug').fill(slug);
    await page.getByLabel('Дисциплина').fill('Керамика');
    await page.getByLabel('Страна').fill('BY');
    await page.getByLabel('Короткое описание').fill('Авторская практика.');
    await expect(page.getByRole('button', { name: 'Продолжить' })).toBeDisabled();

    const rejected = await context.request.post(
      `${e2eApiBaseURL}/api/seller/profile`,
      {
        multipart: {
          slug,
          fullName: 'Без города',
          country: 'BY',
          city: '',
          discipline: 'Керамика',
          shortDescription: 'Авторская практика.',
          profilePhoto: 'e2e/fixtures/profile-photo.png',
        },
      },
    );
    expect(rejected.status()).toBe(400);
  } finally {
    await context.close();
  }
});

test('city application is approved and appears in the public authors catalog', async ({
  browser,
}) => {
  const { buyer } = await createBuyerFixture();
  const { admin } = await createAdminModerationFixture();
  const { context, page } = await authenticatedPage(browser, buyer);
  const slug = `city-author-${Date.now()}`;

  try {
    await page.goto('/profile');
    await fillAuthorApplication(page, slug, 'Минск');
    await expect(page.getByRole('button', { name: 'Сохранить черновик' })).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(/\/profile\?step=2/);
    await page.getByRole('button', { name: 'Сохранить черновик' }).click();
    await page.getByRole('button', { name: 'Отправить на проверку' }).click();
    await expect(page.getByText('На модерации')).toBeVisible();

    const mine = await context.request.get(`${e2eApiBaseURL}/api/seller/profile`);
    expect(mine.ok()).toBeTruthy();
    const body = (await mine.json()) as { sellerProfile: { id: string } };

    const { context: adminContext } = await authenticatedPage(browser, admin);
    const approved = await adminContext.request.patch(
      `${e2eApiBaseURL}/api/admin/seller-profiles/${body.sellerProfile.id}/status`,
      { data: { status: 'APPROVED' } },
    );
    expect(approved.ok()).toBeTruthy();
    await adminContext.close();

    await page.goto('/authors');
    await expect(page.getByText('Автор с городом')).toBeVisible();
    await page.getByRole('link', { name: /Автор с городом/ }).first().click();
    await expect(page).toHaveURL(new RegExp(`/authors/${slug}|/seller/${slug}`));
    await expect(
      page.getByTestId('creator-meta').getByText('Автор с городом'),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
