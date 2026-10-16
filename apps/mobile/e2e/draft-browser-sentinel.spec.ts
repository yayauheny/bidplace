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
  await page.waitForFunction(() =>
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
      await expect(await titleInput(page)).toHaveValue(
        'Sentinel chain 1 edited',
      );
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
        await expect(await titleInput(page)).toHaveValue(
          `Sentinel chain 3 r${round}`,
        );
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

  test('story edit → story save → one Back reaches the previous screen', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const { seller } = await createSellerFixture();
    const { context, page } = await authenticatedPage(browser, seller);
    try {
      const product = await createEditableProduct(page, 'Sentinel chain 6');
      await page.goto(`/products/${product.id}?flow=creation&step=2`);
      const chooserPromise = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: 'Добавить изображения' }).click();
      await (await chooserPromise).setFiles('e2e/fixtures/profile-photo.png');
      await expect(page.getByText('1/10 изображений')).toBeVisible();
      await page.goto(`/products/${product.id}?flow=creation&step=3`);
      await page.getByRole('button', { name: 'Добавить текст' }).click();
      await fillControl(
        page.getByRole('textbox', { name: 'Текст истории' }),
        'История для sentinel.',
      );
      await waitForSentinel(page);
      const storySave = page.waitForResponse(
        (response) =>
          response.url().endsWith(`/api/products/${product.id}/creation`) &&
          response.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: 'Закончить' }).click();
      const response = await storySave;
      expect(response.ok()).toBe(true);
      // dirty → pending → clean retires the sentinel, then the review step
      // replaces the story step URL.
      await expect(page).toHaveURL(/flow=creation&step=4/);
      await page.goBack();
      // One Back leaves the wizard on the previous step (images) instead of
      // popping a leaked sentinel in place.
      await expect(
        page.getByRole('button', { name: 'Добавить изображения' }),
      ).toBeVisible();
      await page.goForward();
      await expect(page).toHaveURL(/flow=creation&step=4/);
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
      await expect(await titleInput(page)).toHaveValue(
        'Sentinel chain 5 edited',
      );
    } finally {
      await context.close();
    }
  });
});
