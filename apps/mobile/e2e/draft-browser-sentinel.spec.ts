import { expect, test, type Page } from '@playwright/test';

import { createSellerFixture } from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';
import { fillControl } from './support/fill-control';

async function createEditableProduct(page: Page, title: string) {
  await page.goto('/products/new');
  await page.getByRole('button', { name: 'E2E art' }).click();
  await fillControl(page.getByRole('textbox', { name: /Название/ }), title);
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
  await page.goto('/profile');
  await expect(page.getByText('Профиль автора', { exact: true })).toBeVisible();
  await page.goto(`/products/${product.id}`);
  await expect(page.getByLabel('Название')).toHaveValue(title);
  return product as { id: string };
}

async function titleInput(page: Page) {
  return page.getByRole('textbox', { name: /Название/ });
}

async function waitForSentinel(page: Page) {
  await page.waitForFunction(
    () =>
      Boolean(
        (window.history.state as Record<string, unknown> | null)
          ?.__bidplaceProductDraftGuard,
      ),
  );
}

async function expectProfile(page: Page) {
  await expect(page.getByText('Профиль автора', { exact: true })).toBeVisible();
}

test.describe('draft browser sentinel lifecycle', () => {
  test('edit → ordinary save → one Back reaches the previous screen', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const { seller } = await createSellerFixture();
    const { context, page } = await authenticatedPage(browser, seller);
    try {
      await createEditableProduct(page, 'Sentinel chain 1');
      await fillControl(await titleInput(page), 'Sentinel chain 1 edited');
      await page.getByRole('button', { name: 'Обновить' }).click();
      await expect(await titleInput(page)).toHaveValue('Sentinel chain 1 edited');
      await page.waitForTimeout(300);
      await page.goBack();
      await expectProfile(page);
    } finally {
      await context.close();
    }
  });

  test('edit → revert to original → one Back reaches the previous screen', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const { seller } = await createSellerFixture();
    const { context, page } = await authenticatedPage(browser, seller);
    try {
      await createEditableProduct(page, 'Sentinel chain 2');
      await fillControl(await titleInput(page), 'Sentinel chain 2 edited');
      await fillControl(await titleInput(page), 'Sentinel chain 2');
      await page.waitForTimeout(300);
      await page.goBack();
      await expectProfile(page);
    } finally {
      await context.close();
    }
  });

  test('repeated dirty toggles do not accumulate sentinel steps', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const { seller } = await createSellerFixture();
    const { context, page } = await authenticatedPage(browser, seller);
    try {
      await createEditableProduct(page, 'Sentinel chain 3');
      for (let round = 0; round < 3; round += 1) {
        await fillControl(await titleInput(page), `Sentinel chain 3 r${round}`);
        await page.getByRole('button', { name: 'Обновить' }).click();
        await expect(await titleInput(page)).toHaveValue(`Sentinel chain 3 r${round}`);
        await page.waitForTimeout(250);
      }
      await page.goBack();
      await expectProfile(page);
      await page.goForward();
      await expect(await titleInput(page)).toHaveValue('Sentinel chain 3 r2');
    } finally {
      await context.close();
    }
  });

  test('second Back during the persist save is not a skipped screen', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const { seller } = await createSellerFixture();
    const { context, page } = await authenticatedPage(browser, seller);
    try {
      await createEditableProduct(page, 'Sentinel chain 4');
      await fillControl(await titleInput(page), 'Sentinel chain 4 edited');
      await waitForSentinel(page);
      const patchRequest = page.waitForRequest(
        (request) =>
          request.url().includes('/api/products/') &&
          request.method() === 'PATCH',
      );
      await page.goBack();
      await patchRequest;
      // Second Back while the transition persist is still in flight.
      await page.goBack();
      await expectProfile(page);
      // The double Back must not have skipped the profile entry.
      await page.goBack();
      await expect(page).not.toHaveURL(/\/profile/);
    } finally {
      await context.close();
    }
  });

  test('failed persist save keeps the draft on screen', async ({ browser }) => {
    test.setTimeout(120_000);
    const { seller } = await createSellerFixture();
    const { context, page } = await authenticatedPage(browser, seller);
    try {
      await createEditableProduct(page, 'Sentinel chain 5');
      await page.route('**/api/products/**', (route) => route.abort());
      await fillControl(await titleInput(page), 'Sentinel chain 5 edited');
      await page.goBack();
      await expect(
        page.getByText('Проверьте соединение и попробуйте ещё раз.'),
      ).toBeVisible();
      await expect(await titleInput(page)).toHaveValue('Sentinel chain 5 edited');
    } finally {
      await context.close();
    }
  });
});
