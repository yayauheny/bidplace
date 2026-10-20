import { expect, test, type Page } from '@playwright/test';

import {
  createBuyerFixture,
  createSellerFixture,
} from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';
import { fillControl } from './support/fill-control';

const DRAFT_WRITE_WAIT_MS = 700;

async function titleInput(page: Page) {
  return page.getByRole('textbox', { name: /Название/ });
}

async function createEditableProduct(page: Page, title: string) {
  await page.goto('/products/new');
  await page.getByRole('button', { name: 'E2E art' }).click();
  await fillControl(await titleInput(page), title);
  await fillControl(
    page.getByRole('textbox', { name: /Уникальность или тираж/ }),
    'One',
  );
  const createResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/products') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Сохранить и продолжить' }).click();
  const { product } = await (await createResponsePromise).json();
  await page.goto(`/products/${product.id}`);
  await expect(await titleInput(page)).toHaveValue(title);
  return product as { id: string };
}

test.describe('local draft restore in a real browser', () => {
  test('restores an unfinished new seller application after reload', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const { buyer } = await createBuyerFixture();
    const { context, page } = await authenticatedPage(browser, buyer);
    try {
      const profileCreates: string[] = [];
      page.on('request', (request) => {
        if (
          request.method() === 'POST' &&
          new URL(request.url()).pathname === '/api/seller/profile'
        ) {
          profileCreates.push(request.url());
        }
      });
      await page.goto('/profile');
      const name = page.getByRole('textbox', {
        name: 'Имя или название',
        exact: true,
      });
      await expect(name).toBeVisible();
      await fillControl(name, 'Незавершённый автор');
      await page.waitForTimeout(DRAFT_WRITE_WAIT_MS);
      await page.reload();
      await expect(
        page.getByRole('textbox', { name: 'Имя или название', exact: true }),
      ).toHaveValue('Незавершённый автор');
      // Restore must not create or save anything on the server by itself.
      expect(profileCreates).toEqual([]);
    } finally {
      await context.close();
    }
  });

  test('restores an edited Work field after reload and saves it once', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const { seller } = await createSellerFixture();
    const { context, page } = await authenticatedPage(browser, seller);
    try {
      const product = await createEditableProduct(
        page,
        `Draft restore ${Date.now()}`,
      );
      const creates: string[] = [];
      page.on('request', (request) => {
        if (
          request.method() === 'POST' &&
          new URL(request.url()).pathname === '/api/products'
        ) {
          creates.push(request.url());
        }
      });
      await fillControl(await titleInput(page), 'Восстановленное название');
      await page.waitForTimeout(DRAFT_WRITE_WAIT_MS);
      await page.reload();
      await expect(await titleInput(page)).toHaveValue(
        'Восстановленное название',
      );

      const patchPromise = page.waitForResponse(
        (response) =>
          response.url().includes(`/api/products/${product.id}`) &&
          response.request().method() === 'PATCH',
      );
      await page.getByRole('button', { name: 'Сохранить изменения' }).click();
      await patchPromise;
      // The restored draft is persisted on the saved entity; no second create.
      expect(creates).toEqual([]);
      await page.goto(`/products/${product.id}`);
      await expect(await titleInput(page)).toHaveValue(
        'Восстановленное название',
      );
    } finally {
      await context.close();
    }
  });

  test('restores unfinished story text after the tab closes and reopens', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const { seller } = await createSellerFixture();
    const { context, page } = await authenticatedPage(browser, seller);
    try {
      const product = await createEditableProduct(
        page,
        `Story restore ${Date.now()}`,
      );
      // Step 3 opens only after the mandatory first image exists.
      await page.goto(`/products/${product.id}?flow=creation&step=2`);
      const chooserPromise = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: 'Добавить изображения' }).click();
      await (await chooserPromise).setFiles('e2e/fixtures/profile-photo.png');
      await expect(page.getByText('1/10 изображений')).toBeVisible();

      await page.goto(`/products/${product.id}?flow=creation&step=3`);
      await page.getByRole('button', { name: 'Добавить текст' }).click();
      await fillControl(
        page.getByRole('textbox', { name: 'Текст истории' }),
        'Незавершённая история работы.',
      );
      await page.waitForTimeout(DRAFT_WRITE_WAIT_MS);
      await page.close();

      const reopened = await context.newPage();
      await reopened.goto(`/products/${product.id}?flow=creation&step=3`);
      await expect(
        reopened.getByRole('textbox', { name: 'Текст истории' }),
      ).toHaveValue('Незавершённая история работы.');

      const storySave = reopened.waitForResponse(
        (response) =>
          response.url().endsWith(`/api/products/${product.id}/creation`) &&
          response.request().method() === 'PUT',
      );
      await reopened.getByRole('button', { name: 'Закончить' }).click();
      const response = await storySave;
      expect(response.ok()).toBe(true);
      await reopened.close();
    } finally {
      await context.close();
    }
  });
});
