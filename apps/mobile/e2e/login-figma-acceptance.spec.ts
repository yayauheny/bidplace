import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { e2eEvidenceDir } from './support/evidence-dir';

const evidence = resolve(e2eEvidenceDir, '2026-10-21-login-sheet');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Unauthorized' }),
    }),
  );
});

async function openLogin(page: Page, width = 390, height = 874) {
  await page.setViewportSize({ width, height });
  await page.goto('/login?redirectTo=%2Fseller%2Fvex');
  const email = page.getByRole('textbox', {
    name: 'Электронная почта',
    exact: true,
  });
  await expect(email).toBeVisible();
  return email;
}

test('login uses one responsive form and preserves values and errors across the breakpoint', async ({
  page,
}) => {
  await mkdir(evidence, { recursive: true });
  const email = await openLogin(page);
  const password = page.getByRole('textbox', { name: 'Пароль', exact: true });
  await email.fill('bad-email');
  await password.fill('synthetic-test-input');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(
    page.getByText('Введите корректный email', { exact: true }),
  ).toBeVisible();
  for (const width of [320, 390, 414, 440, 767, 768, 1023, 1024, 1440, 1800]) {
    await page.setViewportSize({ width, height: 874 });
    await expect(email).toHaveValue('bad-email');
    await expect(password).toHaveValue('synthetic-test-input');
    await expect(
      page.getByText('Введите корректный email', { exact: true }),
    ).toBeVisible();
    const shell = page.locator('#auth-sheet');
    await expect
      .poll(async () => Math.round((await shell.boundingBox())!.width))
      .toBe(width < 768 ? width : 420);
    const box = (await shell.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(875);
    await expect(page.getByTestId('auth-sheet-handle')).toHaveCount(
      width < 768 ? 1 : 0,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 480 });
  await expect
    .poll(async () => (await page.locator('#auth-sheet').boundingBox())!.height)
    .toBeLessThanOrEqual(480);
  await page
    .getByRole('link', { name: 'пользовательским соглашением', exact: true })
    .scrollIntoViewIfNeeded();
});

test('login reference geometry uses shared field and button metrics', async ({
  page,
}) => {
  await mkdir(evidence, { recursive: true });
  for (const width of [390, 1440]) {
    const email = await openLogin(page, width);
    await email.click({ trial: true });
    await page.evaluate(() => document.fonts.ready);
    const field = await email.evaluate(
      (node) =>
        node.closest('[data-figma-field-shell]')?.getBoundingClientRect()
          .height ?? node.parentElement?.getBoundingClientRect().height,
    );
    expect(field).toBe(51);
    expect(
      (await page
        .getByRole('button', { name: 'Войти', exact: true })
        .boundingBox())!.height,
    ).toBe(width < 768 ? 51 : 47);
    await expect(page.getByText('или', { exact: true })).toHaveCount(
      width < 768 ? 1 : 0,
    );
    await expect(
      page.getByRole('link', {
        name: 'пользовательским соглашением',
        exact: true,
      }),
    ).toHaveCSS('color', 'rgb(0, 30, 202)');
    await page.screenshot({
      path: resolve(evidence, `${test.info().project.name}-${width}.png`),
    });
    await page
      .locator('#auth-sheet')
      .screenshot({
        path: resolve(
          evidence,
          `${test.info().project.name}-${width}-surface.png`,
        ),
      });
  }
});

test('login closes by backdrop keyboard and handle without losing the return page', async ({
  page,
}) => {
  for (const method of [
    'backdrop',
    'Escape',
    'keyboard-close',
    'swipe',
  ] as const) {
    await openLogin(page);
    if (method === 'backdrop') await page.mouse.click(5, 5);
    if (method === 'Escape') await page.keyboard.press('Escape');
    if (method === 'keyboard-close') {
      const close = page.getByRole('button', { name: 'Закрыть', exact: true });
      await close.focus();
      await expect(close).toHaveCSS('opacity', '1');
      await close.press('Enter');
    }
    if (method === 'swipe') {
      const handle = page.getByTestId('auth-sheet-handle');
      await handle.click({ trial: true });
      const box = (await handle.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + 8);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + 140, { steps: 12 });
      await page.mouse.up();
    }
    await expect(page).toHaveURL(/\/seller\/vex$/);
    await expect(page.getByTestId('creator-avatar')).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.activeElement?.closest(
              '[data-testid="figma-floating-dock"]',
            ) !== null,
        ),
      )
      .toBe(true);
  }
  await openLogin(page, 1440);
  await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await expect(page).toHaveURL(/\/seller\/vex$/);
});


test('late focus-trap fallback returns to the active form control', async ({ page }) => {
  const email = await openLogin(page);
  await expect(email).toBeFocused();
  const password = page.getByRole('textbox', { name: 'Пароль', exact: true });
  await password.focus();
  await expect(password).toBeFocused();
  await page.locator('#auth-sheet').evaluate(sheet => {
    const dialog = sheet.closest<HTMLElement>('[role="dialog"]');
    if (!dialog) throw new Error('Missing dialog focus owner');
    dialog.focus();
  });
  await expect(password).toBeFocused();
});
