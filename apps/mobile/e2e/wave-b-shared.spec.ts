import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { createAdminModerationFixture } from './support/e2e-fixtures';

const screenshotDir = resolve('/private/tmp', 'bidplace-wave-b-screenshots');
const viewports = [
  { width: 1440, height: 900 },
  { width: 1024, height: 900 },
  { width: 390, height: 844 },
] as const;

test('captures Wave B shared focus, motion, state and target hit-area evidence', async ({
  browser,
}) => {
  test.setTimeout(180_000);
  await mkdir(screenshotDir, { recursive: true });
  const fixture = await createAdminModerationFixture();
  const { context, page } = await authenticatedPage(browser, fixture.admin);
  const authStorageState = await context.storageState();

  try {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto('/');

      await page.getByRole('button', { name: 'Обзор' }).click();
      const worksLink = page.getByRole('link', { name: 'Работы' }).first();
      await worksLink.click();
      await expect
        .poll(() =>
          worksLink.evaluate((element) => element.matches(':focus-visible')),
        )
        .toBe(false);
      await page.goto('/');
      await page.getByRole('button', { name: 'Обзор' }).click();
      const keyboardWorksLink = page
        .getByRole('link', { name: 'Работы' })
        .first();
      await keyboardWorksLink.focus();
      await expect
        .poll(() =>
          keyboardWorksLink.evaluate(
            (element) => getComputedStyle(element).outlineWidth,
          ),
        )
        .toBe('2px');

      const account = page.getByRole('button', {
        name: /Открыть меню аккаунта/,
      });
      await account.focus();
      await expect
        .poll(() =>
          account.evaluate((element) => getComputedStyle(element).outlineWidth),
        )
        .toBe('2px');
      await page.keyboard.press('Enter');
      await expect(page.locator('#account-menu-dropdown')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('#account-menu-dropdown')).toBeHidden();
      await expect(account).toBeFocused();

      const brand = page.getByRole('link', { name: 'bidplace — на главную' });
      const brandBox = await brand.boundingBox();
      expect(brandBox).not.toBeNull();
      expect(brandBox!.width).toBeGreaterThanOrEqual(44);
      expect(brandBox!.height).toBeGreaterThanOrEqual(44);
      await page.screenshot({
        path: resolve(screenshotDir, `focus-visible-${viewport.width}.png`),
        fullPage: true,
      });

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');
      await expect
        .poll(() =>
          page
            .locator('body')
            .evaluate((element) => getComputedStyle(element).animationDuration),
        )
        .toBe('0s');
      await page.screenshot({
        path: resolve(screenshotDir, `reduced-motion-${viewport.width}.png`),
        fullPage: true,
      });

      const captureState = async (state: 'loading' | 'empty' | 'error') => {
        const stateContext = await browser.newContext({
          storageState: authStorageState,
        });
        const statePage = await stateContext.newPage();
        try {
          await statePage.setViewportSize(viewport);
          await statePage.addInitScript(
            (mode: 'loading' | 'empty' | 'error') => {
              const originalFetch = window.fetch.bind(window);
              window.fetch = async (input, init) => {
                const requestUrl =
                  typeof input === 'string'
                    ? input
                    : input instanceof Request
                      ? input.url
                      : input.toString();
                if (
                  new URL(requestUrl, window.location.origin).pathname !==
                  '/api/products'
                ) {
                  return originalFetch(input, init);
                }
                if (mode === 'loading') {
                  await new Promise((resolveDelay) =>
                    setTimeout(resolveDelay, 500),
                  );
                }
                return new Response(
                  JSON.stringify(
                    mode === 'error'
                      ? { message: 'test error' }
                      : {
                          products: [],
                          pagination: { page: 1, limit: 20, total: 0 },
                        },
                  ),
                  {
                    status: mode === 'error' ? 500 : 200,
                    headers: { 'Content-Type': 'application/json' },
                  },
                );
              };
            },
            state,
          );
          await statePage.goto('/');
          if (state === 'loading') {
            await expect(
              statePage.getByRole('progressbar').first(),
            ).toBeVisible();
          } else if (state === 'empty') {
            await expect(statePage.getByText('Пока нет работ')).toBeVisible();
          } else {
            await expect(
              statePage.getByText('Не удалось загрузить работы'),
            ).toBeVisible();
          }
          await statePage.screenshot({
            path: resolve(
              screenshotDir,
              `page-state-${state}-${viewport.width}.png`,
            ),
            fullPage: true,
          });
        } finally {
          await stateContext.close();
        }
      };

      await captureState('loading');
      await captureState('empty');
      await captureState('error');

      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto('/admin');
      await expect(page.getByText('Модерация').first()).toBeVisible();
      await page
        .getByText(fixture.sellerName, { exact: true })
        .first()
        .locator('..')
        .getByRole('button', { name: 'Приостановить' })
        .click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const suspendButton = page
        .getByText(fixture.sellerName, { exact: true })
        .first()
        .locator('..')
        .getByRole('button', { name: 'Приостановить' });
      await expect(dialog.getByLabel('Причина')).toBeFocused();
      const cancelButton = dialog.getByRole('button', { name: 'Отмена' });
      const cancelLabel = cancelButton.getByText('Отмена', { exact: true });
      const cancelButtonBox = await cancelButton.boundingBox();
      const cancelLabelBox = await cancelLabel.boundingBox();
      expect(cancelButtonBox).not.toBeNull();
      expect(cancelLabelBox).not.toBeNull();
      expect(
        Math.abs(
          cancelButtonBox!.x +
            cancelButtonBox!.width / 2 -
            (cancelLabelBox!.x + cancelLabelBox!.width / 2),
        ),
      ).toBeLessThanOrEqual(1);
      await page.keyboard.press('Shift+Tab');
      expect(
        await page.evaluate(() =>
          Boolean(document.activeElement?.closest('[role="dialog"]')),
        ),
      ).toBe(true);
      await page.keyboard.press('Tab');
      expect(
        await page.evaluate(() =>
          Boolean(document.activeElement?.closest('[role="dialog"]')),
        ),
      ).toBe(true);
      await dialog.getByRole('button', { name: 'Отмена' }).click();
      await expect(dialog).toBeHidden();
      await expect(suspendButton).toBeFocused();
      await suspendButton.click();
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('#app-dialog-content')).toHaveCSS(
        'z-index',
        '30',
      );
      await dialog
        .getByLabel('Причина')
        .fill('Подробная проверка передачи и состояния профиля. '.repeat(20));
      await page.screenshot({
        path: resolve(
          screenshotDir,
          `dialog-long-content-${viewport.width}.png`,
        ),
        fullPage: true,
      });
      await page.route(
        '**/api/admin/seller-profiles/*/status',
        async (route) => {
          await new Promise((resolveDelay) => setTimeout(resolveDelay, 1_000));
          await route.continue();
        },
        { times: 1 },
      );
      const confirmButton = dialog.getByRole('button', {
        name: 'Приостановить',
      });
      const initialButtonBox = await confirmButton.boundingBox();
      expect(initialButtonBox).not.toBeNull();
      await confirmButton.click();
      await expect(confirmButton).toHaveAttribute('aria-busy', 'true');
      const loadingButtonBox = await confirmButton.boundingBox();
      expect(loadingButtonBox).not.toBeNull();
      expect(
        Math.abs(loadingButtonBox!.width - initialButtonBox!.width),
      ).toBeLessThanOrEqual(1);
      await page.screenshot({
        path: resolve(screenshotDir, `button-loading-${viewport.width}.png`),
        fullPage: true,
      });
      await page.keyboard.press('Escape');
    }
  } finally {
    await context.close();
  }
});
