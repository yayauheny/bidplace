import { expect, test, type Page } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { moderateSeller } from './support/admin-moderation';
import {
  createAdminModerationFixture,
  createApprovedAuthorFixture,
  createBuyerFixture,
} from './support/e2e-fixtures';

async function completeAuthorApplication(page: Page, slug: string) {
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Добавить фото' }).click();
  await (await chooserPromise).setFiles('e2e/fixtures/profile-photo.png');
  await page.getByLabel('Имя или название').fill('Новый автор');
  await page.getByLabel('Никнейм').fill(slug);
  await page.getByLabel('Страна').fill('BY');
  await page.getByLabel('Город').fill('Минск');
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await expect(page).toHaveURL(/\/profile\?step=2/);
  await expect(page.getByRole('progressbar').getByText('Шаг 2 из 4')).toBeVisible();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await expect(page).toHaveURL(/\/profile\?step=3/);
  await page.getByRole('textbox', { name: 'Дисциплина *', exact: true }).last().fill('Керамика');
  await page.getByRole('textbox', { name: 'Короткое описание *', exact: true }).last().fill('Первая биография.');
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await expect(page).toHaveURL(/\/profile\?step=4/);
  const submitted = page.waitForResponse(response => response.url().endsWith('/api/author/application/submit') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Отправить на проверку' }).click();
  expect((await submitted).status()).toBe(201);
  await expect(page.getByText('На модерации', { exact: true }).last()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Отправить на проверку' })).toHaveCount(0);
}

test('new author submits the four-step application', async ({ browser }) => {
  test.setTimeout(90_000);
  const { buyer } = await createBuyerFixture();
  const { context, page } = await authenticatedPage(browser, buyer);
  const slug = `onboard-${Date.now()}`;

  try {
    await page.goto('/profile');
    await completeAuthorApplication(page, slug);
  } finally {
    await context.close();
  }
});

test('approved author submits an editing revision without changing the public page until approve', async ({
  browser,
}) => {
  test.setTimeout(90_000);
  const { admin } = await createAdminModerationFixture();
  const author = await createApprovedAuthorFixture();
  const { context, page } = await authenticatedPage(browser, author.author);
  const draftName = `Черновик имени ${author.slug}`;

  try {
    await page.goto('/profile');
    await expect(page.getByText('Одобрен', { exact: true }).last()).toBeVisible();
    await page.getByLabel('Имя или название').fill(draftName);
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
    await expect(page.getByLabel('Имя или название')).toHaveValue(draftName);
    const submit = page.getByRole('button', { name: 'Отправить на проверку', exact: true });
    await expect(submit).toBeVisible();
    await submit.click();
    await expect(page.getByText('Заявка на проверке')).toBeVisible();
    await expect(page.getByText('Одобрен', { exact: true }).last()).toBeVisible();
    await expect(submit).toHaveCount(0);
    await expect(page.getByLabel('Имя или название')).not.toBeEditable();

    const guest = await browser.newPage();
    await guest.goto(`/authors/${author.slug}`);
    await expect(guest.getByText(author.fullName)).toBeVisible();
    await expect(guest.getByText(draftName)).toHaveCount(0);
    await guest.close();

    const { context: adminContext } = await authenticatedPage(browser, admin);
    expect(
      (await moderateSeller(adminContext.request, author.sellerProfileId)).ok(),
    ).toBeTruthy();
    await adminContext.close();

    await page.goto(`/authors/${author.slug}`);
    await expect(page.getByText(draftName)).toBeVisible();
  } finally {
    await context.close();
  }
});
