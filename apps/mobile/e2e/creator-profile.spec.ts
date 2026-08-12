import { expect, test } from '@playwright/test';

import {
  createAuctionFixture,
  createBuyerFixture,
} from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';

test('creator profile creation stages public identity, links and private handoff', async ({
  browser,
}) => {
  const { buyer } = await createBuyerFixture();
  const { context, page } = await authenticatedPage(browser, buyer);
  const slug = `creator-${Date.now()}`;

  try {
    await page.goto('/profile');
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить фото' }).click();
    await (await chooserPromise).setFiles('e2e/fixtures/profile-photo.png');
    await page.getByLabel('Имя или название').fill('Новый автор');
    await page.getByLabel('URL-slug').fill(slug);
    await page.getByLabel('Дисциплина').fill('Керамика');
    await page.getByLabel('Страна').fill('BY');
    await page
      .getByLabel('Публичная ссылка')
      .fill(`https://example.com/${slug}`);
    await page.getByLabel('Короткое описание').fill('Авторская практика.');
    await page.getByRole('button', { name: 'Продолжить' }).click();

    await expect(page.getByText('Шаг 2 из 3')).toBeVisible();
    await page
      .getByLabel('Telegram')
      .fill(`https://t.me/${slug.replaceAll('-', '_')}`);
    await page.getByRole('button', { name: 'Продолжить' }).click();

    await expect(page.getByText('Шаг 3 из 3')).toBeVisible();
    await page.getByLabel('Контакт для передачи').fill('@handoff_creator');
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/seller/profile') &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Создать профиль' }).click();
    expect((await responsePromise).ok()).toBeTruthy();
    await expect(page.getByText('На модерации')).toBeVisible();
  } finally {
    await context.close();
  }
});

test('public creator profile shows only public data and remains responsive', async ({
  page,
}) => {
  const fixture = await createAuctionFixture({
    additionalTitles: ['Вторая работа', 'Третья работа', 'Четвёртая работа'],
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/seller/${fixture.sellerProfile.slug}`);

  await expect(page.getByTestId('ambient-image-background')).toBeVisible();
  await expect(
    page.getByText(fixture.sellerProfile.fullName, { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByTestId('app-shell-content').getByText('Работы', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(fixture.product.title)).toBeVisible();
  await expect(page.getByLabel('Сайт автора')).toHaveCount(0);
  await expect(
    page.getByRole('button', {
      name: `Скопировать ссылку на профиль ${fixture.sellerProfile.fullName}`,
    }),
  ).toBeVisible();

  await expect(page.locator('body')).not.toContainText(
    fixture.sellerProfile.privateContact,
  );
  await expect(page.locator('body')).not.toContainText(fixture.buyerA.email);
  await expect(page.locator('body')).not.toContainText(fixture.buyerB.email);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByText(fixture.sellerProfile.fullName, { exact: true }).first(),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => document.body.scrollWidth <= window.innerWidth),
    )
    .toBe(true);
});
