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
    // Section heading and the photo upload were removed in 3d9b4a87 (onboarding fix);
    // anchor on the achievements block contract instead.
    await expect(
      page.getByRole('button', { name: 'Добавить событие', exact: true }),
    ).toBeVisible();
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

    // The write contract is { occurredDate, body } since 3d9b4a87 — achievement
    // photos no longer upload through the application form.
    await fillControl(page.getByLabel('Дата достижения'), '04.2026');
    await fillControl(page.getByLabel('Описание достижения'), draftBody);
    const [savedResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url() ===
            `${e2eApiBaseURL}/api/author/application/achievements`,
      ),
      page
        .getByRole('button', { name: 'Добавить событие', exact: true })
        .click(),
    ]);
    expect(savedResponse.ok()).toBeTruthy();
    expect(savedResponse.request().postDataJSON()).toMatchObject({
      occurredDate: { year: 2026, month: 4, day: null },
      body: draftBody,
    });
    await expect(page.getByLabel('Описание достижения')).toHaveValue('');
    await expect(page.getByText(draftBody, { exact: true })).toBeVisible();

    const application = await context.request.get(
      `${e2eApiBaseURL}/api/author/application`,
    );
    expect(application.ok()).toBeTruthy();
    const draft = (await application.json()) as {
      achievements: Array<{ id: string; body: string }>;
    };
    expect(
      draft.achievements.some((item) => item.body === draftBody),
    ).toBeTruthy();
    await guest.reload();
    await guest.getByRole('tab', { name: 'Об авторе' }).click();
    await expect(guest.getByText(author.achievement.body)).toBeVisible();
    await expect(guest.getByText(draftBody)).toHaveCount(0);
    await guest.close();

    await page
      .getByRole('button', { name: 'Отправить на проверку', exact: true })
      .click();
    await expect(
      page.getByText('Заявка на проверке', { exact: true }),
    ).toBeVisible();
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
  } finally {
    await context.close();
  }
});
