import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { e2eEvidenceDir } from './support/evidence-dir';
import { expect, test } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { moderateSeller } from './support/admin-moderation';
import {
  assertFixtureDatabaseIsolation,
  e2eApiBaseURL,
} from './support/e2e-env';
import { fillControl, selectCalendarMonth } from './support/fill-control';
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
    await expect(
      guest
        .getByTestId('creator-meta')
        .getByText(author.fullName, { exact: true }),
    ).toBeVisible();
    await expect(guest.getByText(author.achievement.body)).toBeVisible();
    await expect(guest.getByText(draftBody)).toHaveCount(0);
    const publishedImage = await guest.request.get(
      `${e2eApiBaseURL}/api/author-achievements/${author.achievement.id}/image`,
    );
    expect(publishedImage.status()).toBe(200);

    // The write contract is { occurredDate, body } since 3d9b4a87 — achievement
    // photos no longer upload through the application form.
    await page.bringToFront();
    const dateField = page.getByRole('button', {
      name: 'Дата достижения',
      exact: true,
    });
    await expect(
      page.getByRole('textbox', { name: 'Дата достижения', exact: true }),
    ).toHaveCount(0);
    await dateField.click();
    const calendarDialog = page.getByRole('dialog', {
      name: 'Дата достижения',
      exact: true,
    });
    await calendarDialog
      .getByLabel('Год календаря', { exact: true })
      .fill('2024');
    await calendarDialog
      .getByLabel('Год календаря', { exact: true })
      .press('Tab');
    await calendarDialog
      .getByLabel('Месяц календаря', { exact: true })
      .selectOption('2');
    expect(
      (
        await calendarDialog
          .getByLabel('Месяц календаря', { exact: true })
          .boundingBox()
      )?.height,
    ).toBeCloseTo(44, 1);
    expect(
      (
        await calendarDialog
          .getByLabel('Год календаря', { exact: true })
          .boundingBox()
      )?.height,
    ).toBeCloseTo(44, 1);
    const leapDay = calendarDialog.getByRole('button', {
      name: /29 февраля 2024/,
    });
    await leapDay.focus();
    await leapDay.press('Enter');
    await expect(
      calendarDialog.getByText('Выбрано: 29.02.2024', { exact: true }),
    ).toBeVisible();
    const evidence = resolve(e2eEvidenceDir, 'date-picker');
    await mkdir(evidence, { recursive: true });
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 390, height: 874 },
      { width: 440, height: 956 },
    ]) {
      await page.setViewportSize(viewport);
      await expect
        .poll(() =>
          page.evaluate(() => document.body.scrollWidth <= window.innerWidth),
        )
        .toBe(true);
      const applyDate = calendarDialog.getByRole('button', {
        name: 'Выбрать',
        exact: true,
      });
      await applyDate.scrollIntoViewIfNeeded();
      await expect(applyDate).toBeInViewport();
    }
    await page.setViewportSize({ width: 390, height: 874 });
    await calendarDialog
      .getByRole('button', { name: 'Предыдущий месяц', exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: resolve(evidence, `${test.info().project.name}-calendar.png`),
    });
    await calendarDialog
      .getByRole('button', { name: 'Закрыть окно', exact: true })
      .click();
    await expect(dateField).toBeFocused();
    await expect(dateField).toContainText('Выбрать дату');
    await selectCalendarMonth(page, 'Дата достижения', 2026, 4);
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

test('fixture writes require isolated storage before opening a database client', () => {
  for (const path of [
    'bidplace_dev',
    'bidplace_dev?schema=public',
    'bidplace',
  ]) {
    expect(() =>
      assertFixtureDatabaseIsolation(`postgresql://localhost/${path}`),
    ).toThrow('Fixture writes require');
  }
  for (const path of [
    'bidplace_e2e',
    'bidplace_e2e?schema=public',
    'bidplace_dev?schema=e2e_calendar',
    'bidplace_dev?schema=auth_browser_acceptance',
  ]) {
    expect(() =>
      assertFixtureDatabaseIsolation(`postgresql://localhost/${path}`),
    ).not.toThrow();
  }
  expect(() => assertFixtureDatabaseIsolation('invalid')).toThrow(
    'Fixture database URL is invalid',
  );
});
