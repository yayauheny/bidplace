import { expect, test, type Page } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { moderateSeller } from './support/admin-moderation';
import { e2eApiBaseURL } from './support/e2e-env';
import {
  createAdminModerationFixture,
  createBuyerFixture,
} from './support/e2e-fixtures';

async function selectCountry(page: Page, countryName: string) {
  await page.getByRole('button', { name: 'Страна' }).click();
  await page.getByRole('radio', { name: countryName }).click();
}

/** The nickname is the account slug assigned at registration: the author application shows it read-only. */
async function readAccountNickname(page: Page): Promise<string> {
  const nickname = page.getByLabel('Никнейм');
  await expect(nickname).not.toHaveValue('');
  return nickname.inputValue();
}

async function completeBasics(page: Page, city: string): Promise<string> {
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Загрузить фото' }).click();
  await (await chooserPromise).setFiles('e2e/fixtures/profile-photo.png');
  await page.getByLabel('Имя или название').fill('Автор с городом');
  const slug = await readAccountNickname(page);
  await selectCountry(page, 'Беларусь');
  await page.getByLabel('Город').fill(city);
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await expect(page).toHaveURL(/\/profile\?step=2/);
  await expect(page.getByRole('progressbar', { name: 'Шаг 2 из 4' })).toBeVisible();
  return slug;
}

test('author application without city continues and stores the city as null', async ({
  browser,
}) => {
  const { buyer } = await createBuyerFixture();
  const { context, page } = await authenticatedPage(browser, buyer);

  try {
    await page.goto('/profile');
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Загрузить фото' }).click();
    await (await chooserPromise).setFiles('e2e/fixtures/profile-photo.png');
    await page.getByLabel('Имя или название').fill('Без города');
    await readAccountNickname(page);
    await selectCountry(page, 'Беларусь');
    await page.getByRole('button', { name: 'Продолжить' }).click();
    await expect(page).toHaveURL(/\/profile\?step=2/);

    const mine = await context.request.get(`${e2eApiBaseURL}/api/seller/profile`);
    expect(mine.ok()).toBeTruthy();
    const body = (await mine.json()) as { sellerProfile: { city: string | null } };
    expect(body.sellerProfile.city).toBeNull();
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

  try {
    await page.goto('/profile');
    const slug = await completeBasics(page, 'Минск');
    await page.getByRole('button', { name: 'Закрыть' }).click();
    await page.goto('/profile');
    await expect(page.getByRole('progressbar', { name: 'Шаг 2 из 4' })).toBeVisible();
    await page.getByLabel('Telegram').fill('@city_author');
    await page.getByRole('button', { name: 'Закрыть' }).click();
    await page.getByRole('button', { name: 'Сохранить и выйти' }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/profile');
    await expect(page.getByRole('progressbar', { name: 'Шаг 2 из 4' })).toBeVisible();
    await expect(page.getByLabel('Telegram')).toHaveValue('https://t.me/city_author');
    await page.getByRole('button', { name: 'Продолжить' }).click();
    await expect(page).toHaveURL(/\/profile\?step=3/);
    await page.getByRole('textbox', { name: 'Дисциплина *', exact: true }).last().fill('Керамика');
    await page.getByRole('textbox', { name: 'Практика', exact: true }).last().fill('Авторская керамика');
    await page.getByRole('textbox', { name: 'Короткое описание *', exact: true }).last().fill('Авторская практика.');
    await page.getByRole('button', { name: 'Закрыть' }).click();
    await page.getByRole('button', { name: 'Сохранить и выйти' }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/profile');
    await expect(page.getByRole('progressbar', { name: 'Шаг 3 из 4' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Дисциплина *', exact: true }).last()).toHaveValue('Керамика');
    await page.getByRole('button', { name: 'Продолжить' }).click();
    await expect(page).toHaveURL(/\/profile\?step=4/);
    await expect(page.getByRole('button', { name: 'Сохранить черновик' })).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(/\/profile\?step=4/);
    await page.getByRole('button', { name: 'Сохранить черновик' }).click();
    await page.getByRole('button', { name: 'Отправить на проверку' }).click();
    await expect(page.getByText('На модерации')).toBeVisible();

    const mine = await context.request.get(`${e2eApiBaseURL}/api/seller/profile`);
    expect(mine.ok()).toBeTruthy();
    const body = (await mine.json()) as { sellerProfile: { id: string } };

    const { context: adminContext } = await authenticatedPage(browser, admin);
    const approved = await moderateSeller(
      adminContext.request,
      body.sellerProfile.id,
    );
    expect(approved.ok()).toBeTruthy();
    await adminContext.close();

    await page.goto('/authors');
    const publishedAuthor = page.getByRole('link', {
      name: new RegExp(`Автор с городом, @${slug},`),
    });
    await expect(publishedAuthor).toBeVisible();
    await publishedAuthor.click();
    await expect(page).toHaveURL(new RegExp(`/authors/${slug}|/seller/${slug}`));
    await expect(
      page.getByTestId('creator-meta').getByText('Автор с городом'),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
