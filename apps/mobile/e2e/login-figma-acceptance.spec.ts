import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import { assignAuthClientIp } from './support/auth-client-ip';
import { viewportLabel } from './support/auth-viewports';
import { e2eEvidenceDir } from './support/evidence-dir';

// Wave 11 Figma 7008:20543 acceptance probe for the login sheet
// (form/shell only). Captures rendered evidence at the 390x874 reference
// plus robustness widths; assertions stay structural (overflow, reach).

const artifactDir = resolve(e2eEvidenceDir, '2026-10-16-login-sheet');

test.beforeEach(async ({ context }) => {
  await assignAuthClientIp(context);
});

test('login sheet matches the 7008:20543 contract at reference and stays robust', async ({
  page,
}) => {
  await mkdir(artifactDir, { recursive: true });
  const engine = test.info().project.name;
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/login');
  const sheet = page.locator('#auth-sheet');
  await expect(sheet).toBeVisible();
  const email = page.getByLabel('Электронная почта');
  await expect(email).toBeVisible();

  await page.screenshot({
    path: resolve(artifactDir, `${engine}-login-sheet-390x874.png`),
  });
  await sheet.screenshot({
    path: resolve(artifactDir, `${engine}-login-sheet-only-390.png`),
  });

  // Contract structure: title, fields, forgot link, actions, divider,
  // provider buttons, legal text — same order as the Figma sheet.
  await expect(
    page.getByText('Вход на Bidplace', { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Пароль', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Забыли пароль?', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Войти', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Регистрация', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('или', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Войти с Telegram', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Войти с Google', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', {
      name: 'политикой персональных данных и cookies',
      exact: true,
    }),
  ).toBeVisible();

  // Error state: invalid email surfaces the schema message in-sheet.
  await email.fill('not-an-email');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByText('Введите корректный email')).toBeVisible();
  await sheet.screenshot({
    path: resolve(artifactDir, `${engine}-login-sheet-error-390.png`),
  });

  // Robustness widths: no page-level horizontal overflow, sheet reachable.
  for (const viewport of [
    { width: 320, height: 874 },
    { width: 414, height: 874 },
    { width: 440, height: 956 },
    { width: 390, height: 400 },
  ] as const) {
    await page.setViewportSize(viewport);
    await expect(sheet).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: resolve(
        artifactDir,
        `${engine}-login-sheet-${viewportLabel(viewport)}.png`,
      ),
    });
  }

  // 200% zoom: sheet reflows without page overflow; primary action stays
  // reachable without horizontal scrolling.
  await page.setViewportSize({ width: 390, height: 874 });
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const submit = page.getByRole('button', { name: 'Войти', exact: true });
  await expect(submit).toBeInViewport();
  await page.evaluate(() => {
    document.documentElement.style.zoom = '';
  });
});
