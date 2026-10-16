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
  // Dev-only Expo fast-refresh indicator (@expo/log-box, fixed z-9999 bolt
  // button) overlaps captured regions after bundle reloads; it is dev chrome,
  // not app content, and re-mounts on refresh events. Must register before
  // the first navigation to apply to the initial load.
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent =
      '[class*="__expo_fast_refresh"] { display: none !important; }';
    const install = () => {
      if (!style.isConnected) document.documentElement.append(style);
    };
    install();
    new MutationObserver(install).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
  const hideDevOverlays = () =>
    page.evaluate(() => {
      document
        .querySelectorAll('[class*="__expo_fast_refresh"]')
        .forEach((node) => ((node as HTMLElement).style.display = 'none'));
    });
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/login');
  const sheet = page.locator('#auth-sheet');

  await expect(sheet).toBeVisible();
  const email = page.getByLabel('Электронная почта');
  await expect(email).toBeVisible();

  await hideDevOverlays();
  await page.screenshot({
    path: resolve(artifactDir, `${engine}-login-sheet-390x874.png`),
  });
  await hideDevOverlays();
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
  await hideDevOverlays();
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
    await hideDevOverlays();
    await page.screenshot({
      path: resolve(
        artifactDir,
        `${engine}-login-sheet-${viewportLabel(viewport)}.png`,
      ),
    });
  }

  // CSS zoom reflow (NOT browser zoom — see W11-01 note in the evidence
  // README): the sheet reflows without page overflow; the primary action
  // stays reachable without horizontal scrolling.
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

  // Short viewport: content taller than the sheet must stay reachable by
  // scrolling inside the sheet's scroll owner; legal links included.
  await page.setViewportSize({ width: 390, height: 400 });
  const hasScrollOwner = await page.evaluate(() => {
    const sheetEl = document.querySelector('#auth-sheet');
    if (!sheetEl) return false;
    const candidates = [
      sheetEl,
      ...sheetEl.querySelectorAll<HTMLElement>('*'),
      ...[...(sheetEl.parentElement?.children ?? [])].flatMap((node) =>
        node instanceof HTMLElement ? [node] : [],
      ),
    ];
    return candidates.some((node) => node.scrollHeight > node.clientHeight + 1);
  });
  expect(hasScrollOwner).toBe(true);
  for (const target of [
    page.getByLabel('Электронная почта'),
    page.getByLabel('Пароль', { exact: true }),
    page.getByRole('button', { name: 'Войти', exact: true }),
    page.getByRole('button', { name: 'Войти с Google', exact: true }),
    page.getByRole('link', {
      name: 'политикой персональных данных и cookies',
      exact: true,
    }),
    page.getByRole('link', {
      name: 'пользовательским соглашением',
      exact: true,
    }),
  ]) {
    await target.scrollIntoViewIfNeeded();
    await expect(target).toBeInViewport();
    await expect(target).toBeVisible();
  }

  // Keyboard walk: Tab can reach every interactive control inside the
  // sheet (legal links included) and Shift+Tab walks back — two-way keyboard
  // access. The Radix focus scope may park initial focus on the container,
  // so walk forward until the first field takes focus, then keep strict
  // DOM order from there.
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/login');
  await expect(sheet).toBeVisible();
  const visitOrder = [
    page.getByLabel('Электронная почта'),
    page.getByLabel('Пароль', { exact: true }),
    page.getByRole('button', { name: 'Показать пароль', exact: true }),
    page.getByRole('link', { name: 'Забыли пароль?', exact: true }),
    page.getByRole('button', { name: 'Войти', exact: true }),
    page.getByRole('link', { name: 'Регистрация', exact: true }),
    page.getByRole('button', { name: 'Войти с Telegram', exact: true }),
    page.getByRole('button', { name: 'Войти с Google', exact: true }),
    page.getByRole('link', {
      name: 'политикой персональных данных и cookies',
      exact: true,
    }),
    page.getByRole('link', {
      name: 'пользовательским соглашением',
      exact: true,
    }),
  ];
  for (
    let step = 0;
    step < 12 &&
    !(await visitOrder[0].evaluate((node) => node === document.activeElement));
    step += 1
  ) {
    await page.keyboard.press('Tab');
  }
  await expect(visitOrder[0]).toBeFocused();
  for (const target of visitOrder.slice(1)) {
    await page.keyboard.press('Tab');
    await expect(target).toBeFocused();
  }
  for (
    let step = 0;
    step < 12 &&
    !(await visitOrder[8].evaluate((node) => node === document.activeElement));
    step += 1
  ) {
    await page.keyboard.press('Shift+Tab');
  }
  await expect(visitOrder[8]).toBeFocused();
});
