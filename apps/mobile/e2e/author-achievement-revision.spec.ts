import { expect, test } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { moderateSeller } from './support/admin-moderation';
import { e2eApiBaseURL } from './support/e2e-env';
import { fillControl } from './support/fill-control';
import {
  createAdminModerationFixture,
  createApprovedAuthorFixture,
} from './support/e2e-fixtures';

test('approved author replaces a published achievement without publishing the draft', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const { admin } = await createAdminModerationFixture();
  const author = await createApprovedAuthorFixture();
  const { context, page } = await authenticatedPage(browser, author.author);
  const draftBody = `Вторая выставка ${author.slug}`;

  try {
    await page.goto('/profile');
    await expect(page.getByText('Выставки и достижения')).toBeVisible();
    await expect(page.getByText(author.achievement.body)).toBeVisible();
    await page.getByRole('button', { name: 'Удалить' }).click();
    await expect(page.getByText(author.achievement.body)).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Отправить на проверку', exact: true }),
    ).toBeVisible();

    const guest = await browser.newPage();
    await guest.setViewportSize({ width: 390, height: 844 });
    await guest.goto(`/authors/${author.slug}`);
    await guest.getByRole('tab', { name: 'Об авторе' }).click();
    await expect(guest.getByText(author.fullName)).toBeVisible();
    await expect(guest.getByText(author.achievement.body)).toBeVisible();
    await expect(guest.getByText(draftBody)).toHaveCount(0);
    const publishedImage = await guest.request.get(
      `${e2eApiBaseURL}/api/author-achievements/${author.achievement.id}/image`,
    );
    expect(publishedImage.status()).toBe(200);

    const achievementPhoto = page.getByRole('button', { name: 'Добавить фото (необязательно)' });
    await expect(achievementPhoto).toBeEnabled();
    const chooserPromise = page.waitForEvent('filechooser');
    await achievementPhoto.click();
    await (await chooserPromise).setFiles('e2e/fixtures/profile-photo.png');
    await fillControl(page.getByLabel('Год'), '2026');
    await fillControl(page.getByLabel('Месяц'), '4');
    await fillControl(page.getByLabel('Описание достижения'), draftBody);
    await page.getByRole('button', { name: 'Сохранить достижение' }).click();
    await expect(page.getByText(draftBody)).toBeVisible();

    const application = await context.request.get(
      `${e2eApiBaseURL}/api/author/application`,
    );
    expect(application.ok()).toBeTruthy();
    const draft = (await application.json()) as {
      achievements: Array<{ id: string; body: string; image: { url: string } | null }>;
    };
    const pending = draft.achievements.find((item) => item.body === draftBody);
    expect(pending?.image?.url).toBeTruthy();
    const pendingImage = await guest.request.get(
      `${e2eApiBaseURL}${pending?.image?.url}`,
    );
    expect(pendingImage.status()).toBe(404);
    await guest.reload();
    await guest.getByRole('tab', { name: 'Об авторе' }).click();
    await expect(guest.getByText(author.achievement.body)).toBeVisible();
    await expect(guest.getByText(draftBody)).toHaveCount(0);
    await guest.close();

    await page.getByRole('button', { name: 'Отправить на проверку', exact: true }).click();
    await expect(page.getByText('Заявка на проверке')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Отправить на проверку', exact: true }),
    ).toHaveCount(0);

    const { context: adminContext } = await authenticatedPage(browser, admin);
    expect(
      (await moderateSeller(adminContext.request, author.sellerProfileId)).ok(),
    ).toBeTruthy();
    await adminContext.close();

    await page.goto(`/authors/${author.slug}`);
    await page.getByRole('tab', { name: 'Об авторе' }).click();
    await expect(page.getByText(draftBody)).toBeVisible();
    await expect(page.getByText(author.achievement.body)).toHaveCount(0);
    const reader = await browser.newPage();
    const publishedDraftImage = await reader.request.get(
      `${e2eApiBaseURL}${pending?.image?.url}`,
    );
    expect(publishedDraftImage.status()).toBe(200);
    await reader.close();
  } finally {
    await context.close();
  }
});
