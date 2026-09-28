import { expect, test } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { moderateSeller } from './support/admin-moderation';
import { e2eApiBaseURL } from './support/e2e-env';
import { fillControl } from './support/fill-control';
import {
  createAdminModerationFixture,
  createBuyerFixture,
} from './support/e2e-fixtures';

test('approved author can delete a published achievement then add a draft', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const { buyer } = await createBuyerFixture();
  const { admin } = await createAdminModerationFixture();
  const { context, page } = await authenticatedPage(browser, buyer);
  const slug = `achieve-${Date.now()}`;

  try {
    await page.goto('/profile');
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить фото' }).click();
    await (await chooserPromise).setFiles('e2e/fixtures/profile-photo.png');
    await expect(
      page.getByRole('button', { name: 'Изменить фото' }),
    ).toBeVisible();
    await fillControl(page.getByLabel('Имя или название'), 'Автор достижений');
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
      'Первая биография.',
    );
    await page.getByRole('button', { name: 'Продолжить' }).click();
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
    await fillControl(
      page.getByLabel('Контакт для передачи'),
      '@handoff_creator',
    );
    await page.getByRole('button', { name: 'Создать профиль' }).click();
    await expect(page.getByText('На модерации')).toBeVisible();

    const mine = await context.request.get(
      `${e2eApiBaseURL}/api/seller/profile`,
    );
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

    await page.goto('/profile');
    await expect(page.getByText('Выставки и достижения')).toBeVisible();
    const achievementField = page.getByLabel('Описание достижения');
    await achievementField.scrollIntoViewIfNeeded();
    await fillControl(achievementField, 'Первая выставка');
    await page.getByRole('button', { name: 'Сохранить достижение' }).click();
    await expect(page.getByText('Первая выставка')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Отправить на проверку', exact: true }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Отправить на проверку', exact: true })
      .click();
    await expect(
      page.getByText('Заявка на проверке', { exact: false }),
    ).toBeVisible();
    expect(
      (
        await moderateSeller(
          adminContext.request,
          created.sellerProfile.id,
        )
      ).ok(),
    ).toBeTruthy();

    await page.goto('/profile');
    await expect(page.getByText('Первая выставка')).toBeVisible();
    await page.getByRole('button', { name: 'Удалить' }).click();
    await expect(page.getByText('Первая выставка')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Отправить на проверку', exact: true }),
    ).toBeVisible();

    const guest = await browser.newPage();
    await guest.setViewportSize({ width: 390, height: 844 });
    await guest.goto(`/authors/${slug}`);
    await guest.getByRole('tab', { name: 'Об авторе' }).click();
    await expect(guest.getByText('Автор достижений')).toBeVisible();
    await expect(guest.getByText('Первая выставка')).toBeVisible();
    await expect(guest.getByText('Вторая выставка')).toHaveCount(0);

    await fillControl(achievementField, 'Вторая выставка');
    await page.getByRole('button', { name: 'Сохранить достижение' }).click();
    await expect(page.getByText('Вторая выставка')).toBeVisible();
    await guest.reload();
    await guest.getByRole('tab', { name: 'Об авторе' }).click();
    await expect(guest.getByText('Первая выставка')).toBeVisible();
    await expect(guest.getByText('Вторая выставка')).toHaveCount(0);
    await guest.close();

    await page
      .getByRole('button', { name: 'Отправить на проверку', exact: true })
      .click();
    await expect(
      page.getByText('Заявка на проверке', { exact: false }),
    ).toBeVisible();

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
    await page.getByRole('tab', { name: 'Об авторе' }).click();
    await expect(page.getByText('Вторая выставка')).toBeVisible();
    await expect(page.getByText('Первая выставка')).toHaveCount(0);
  } finally {
    await context.close();
  }
});
