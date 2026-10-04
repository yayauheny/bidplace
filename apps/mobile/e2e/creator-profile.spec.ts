import { expect, test } from '@playwright/test';

import {
  createAuctionFixture,
  createBuyerFixture,
} from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';
import { fillControl } from './support/fill-control';
import { e2eApiBaseURL } from './support/e2e-env';

test('four-step creator application validates public links before submit', async ({ browser }) => {
  const { buyer } = await createBuyerFixture();
  const { context, page } = await authenticatedPage(browser, buyer);
  const slug = `creator-${Date.now()}`;
  try {
    await page.goto('/profile');
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить фото' }).click();
    await (await chooser).setFiles('e2e/fixtures/profile-photo.png');
    await fillControl(page.getByLabel('Имя или название'), 'Новый автор');
    await fillControl(page.getByLabel('Никнейм'), slug);
    await fillControl(page.getByLabel('Страна'), 'BY');
    await fillControl(page.getByLabel('Город'), 'Минск');
    await page.getByRole('button', { name: 'Продолжить' }).click();
    await expect(page).toHaveURL(/\/profile\?step=2/);
    await fillControl(page.getByLabel('Сайт', { exact: true }).last(), 'not-a-url');
    await expect(page.getByRole('button', { name: 'Продолжить' })).toBeDisabled();
    await fillControl(page.getByLabel('Telegram', { exact: true }).last(), `https://t.me/${slug.replaceAll('-', '_')}`);
    await fillControl(page.getByLabel('Instagram', { exact: true }).last(), 'https://instagram.com/portfolio_author');
    await fillControl(page.getByLabel('Сайт', { exact: true }).last(), `https://example.com/${slug}`);
    await page.getByRole('button', { name: 'Продолжить' }).click();
    await expect(page).toHaveURL(/\/profile\?step=3/);
    await fillControl(page.getByRole('textbox', { name: 'Дисциплина *', exact: true }).last(), 'Керамика');
    await fillControl(page.getByRole('textbox', { name: 'Короткое описание *', exact: true }).last(), 'Авторская практика.');
    await page.getByRole('button', { name: 'Продолжить' }).click();
    await expect(page).toHaveURL(/\/profile\?step=4/);
    const submitted = page.waitForResponse(response => response.url().endsWith('/api/author/application/submit') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Отправить на проверку' }).click();
    expect((await submitted).status()).toBe(201);
    await expect(page.getByText('На модерации', { exact: true }).last()).toBeVisible();
    const profile = await (await context.request.get(`${e2eApiBaseURL}/api/seller/profile`)).json();
    expect(profile.sellerProfile.slug).toBe(slug);
    expect(profile.sellerProfile.websiteUrl).toBe(`https://example.com/${slug}`);
  } finally { await context.close(); }
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
