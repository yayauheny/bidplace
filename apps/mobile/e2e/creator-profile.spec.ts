import { expect, test } from '@playwright/test';

import {
  createAuctionFixture,
  createBuyerFixture,
} from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';
import { fillControl } from './support/fill-control';

test('creator profile creation stages public identity, links and private handoff', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const { buyer } = await createBuyerFixture();
  const { context, page } = await authenticatedPage(browser, buyer);
  const slug = `creator-${Date.now()}`;

  try {
    await page.goto('/profile');
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить фото' }).click();
    await (await chooserPromise).setFiles('e2e/fixtures/profile-photo.png');
    await fillControl(page.getByLabel('Имя или название'), 'Новый автор');
    await fillControl(page.getByLabel('URL-slug'), slug);
    await fillControl(page.getByLabel('Дисциплина'), 'Керамика');
    await fillControl(page.getByLabel('Страна'), 'BY');
    await fillControl(page.getByLabel('Город'), 'Минск');
    await fillControl(
      page.getByLabel('Публичная ссылка'),
      `https://example.com/${slug}`,
    );
    await fillControl(
      page.getByLabel('Короткое описание'),
      'Авторская практика.',
    );
    await page.getByRole('button', { name: 'Продолжить' }).click();

    await expect(page.getByText('Шаг 2 из 3')).toBeVisible();
    await fillControl(page.getByLabel('Telegram'), 'not-a-url');
    await fillControl(page.getByLabel('Instagram'), 'not-a-url');
    await fillControl(page.getByLabel('Сайт'), 'not-a-url');
    await fillControl(
      page.getByLabel('Основная публичная ссылка'),
      'not-a-url',
    );
    await expect(
      page.getByText('Введите HTTPS-ссылку, начиная с https://'),
    ).toHaveCount(4);
    await expect(
      page.getByRole('button', { name: 'Продолжить' }),
    ).toBeDisabled();
    await fillControl(
      page.getByLabel('Telegram'),
      `https://t.me/${slug.replaceAll('-', '_')}`,
    );
    await fillControl(
      page.getByLabel('Instagram'),
      `https://instagram.com/${slug}`,
    );
    await fillControl(page.getByLabel('Сайт'), `https://example.com/${slug}`);
    await fillControl(
      page.getByLabel('Основная публичная ссылка'),
      `https://example.com/${slug}`,
    );
    await page.getByRole('button', { name: 'Продолжить' }).click();

    await expect(page.getByText('Шаг 3 из 3')).toBeVisible();
    await fillControl(page.getByLabel('Контакт для передачи'), 'creator');
    await expect(
      page.getByText('Введите Telegram @username или https://t.me/username'),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Создать профиль' }),
    ).toBeDisabled();
    await fillControl(
      page.getByLabel('Контакт для передачи'),
      '@handoff_creator',
    );
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

  await expect(page.getByTestId('author-header')).toBeVisible();
  await expect(
    page.getByText(fixture.sellerProfile.fullName, { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole('tab', { name: /Работы/ }).first(),
  ).toBeVisible();
  await expect(page.getByText(fixture.product.title)).toBeVisible();
  await expect(page.getByLabel('Сайт автора')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Поделиться профилем' }),
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
