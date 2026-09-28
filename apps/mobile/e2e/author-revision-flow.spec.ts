import { expect, test } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { moderateSeller } from './support/admin-moderation';
import { e2eApiBaseURL } from './support/e2e-env';
import {
  createAdminModerationFixture,
  createBuyerFixture,
} from './support/e2e-fixtures';

test('approved author edits a draft revision without changing the public page until approve', async ({
  browser,
}) => {
  test.setTimeout(90_000);
  const { buyer } = await createBuyerFixture();
  const { admin } = await createAdminModerationFixture();
  const { context, page } = await authenticatedPage(browser, buyer);
  const slug = `revision-${Date.now()}`;

  try {
    await page.goto('/profile');
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить фото' }).click();
    await (await chooserPromise).setFiles('e2e/fixtures/profile-photo.png');
    await expect(page.getByRole('button', { name: 'Изменить фото' })).toBeVisible();
    await page.getByLabel('Имя или название').fill('Опубликованное имя');
    await page.getByLabel('URL-slug').fill(slug);
    await page.getByLabel('Дисциплина').fill('Керамика');
    await page.getByLabel('Страна').fill('BY');
    await page.getByLabel('Город').fill('Минск');
    await page.getByLabel('Публичная ссылка').fill(`https://example.com/${slug}`);
    await page.getByLabel('Короткое описание').fill('Первая биография.');
    await expect(page.getByLabel('Имя или название')).toHaveValue(
      'Опубликованное имя',
    );
    await page.getByRole('button', { name: 'Продолжить' }).click();
    await page
      .getByLabel('Telegram')
      .fill(`https://t.me/${slug.replaceAll('-', '_')}`);
    await page.getByLabel('Instagram').fill(`https://instagram.com/${slug}`);
    await page.getByLabel('Сайт').fill(`https://example.com/${slug}`);
    await page
      .getByLabel('Основная публичная ссылка')
      .fill(`https://example.com/${slug}`);
    await page.getByRole('button', { name: 'Продолжить' }).click();
    await page.getByLabel('Контакт для передачи').fill('@handoff_creator');
    await page.getByRole('button', { name: 'Создать профиль' }).click();
    await expect(page.getByText('На модерации')).toBeVisible();

    const mine = await context.request.get(`${e2eApiBaseURL}/api/seller/profile`);
    const created = (await mine.json()) as { sellerProfile: { id: string } };
    const { context: adminContext } = await authenticatedPage(browser, admin);
    expect(
      (
        await moderateSeller(
          adminContext.request,
          created.sellerProfile.id,
        )
      ).ok(),
    ).toBeTruthy();

    await page.goto(`/authors/${slug}`);
    await expect(page.getByText('Опубликованное имя')).toBeVisible();

    await page.goto('/profile');
    await page.getByLabel('Имя или название').fill('Черновик имени');
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
    await expect(page.getByLabel('Имя или название')).toHaveValue(
      'Черновик имени',
    );
    await expect(
      page.getByRole('button', { name: 'Отправить на проверку', exact: true }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Отправить на проверку', exact: true })
      .click();
    await expect(
      page.getByText('Заявка на проверке', { exact: false }),
    ).toBeVisible();

    const guest = await browser.newPage();
    await guest.goto(`/authors/${slug}`);
    await expect(guest.getByText('Опубликованное имя')).toBeVisible();
    await expect(guest.getByText('Черновик имени')).toHaveCount(0);
    await guest.close();

    expect(
      (
        await moderateSeller(
          adminContext.request,
          created.sellerProfile.id,
        )
      ).ok(),
    ).toBeTruthy();
    await adminContext.close();

    await page.goto(`/authors/${slug}`);
    await expect(page.getByText('Черновик имени')).toBeVisible();
  } finally {
    await context.close();
  }
});
