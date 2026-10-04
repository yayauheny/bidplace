import { expect, test, type Page } from '@playwright/test';

import { createSellerFixture } from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';
import { fillControl } from './support/fill-control';
import { productWizardStepOneIncompleteMessage } from '../src/features/sellers/product-draft-wizard';

async function fillProductStepOne(page: Page, title: string) {
  await page.getByRole('button', { name: 'E2E art' }).click();
  await fillControl(page.getByRole('textbox', { name: /Название/ }), title);
  await fillControl(
    page.getByRole('textbox', { name: /Уникальность или тираж/ }),
    'One',
  );
}

async function createDraftThroughStepOne(page: Page) {
  const save = page.getByRole('button', { name: 'Сохранить и продолжить' });
  await expect(save).toBeEnabled();
  const createResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/products') &&
      response.request().method() === 'POST',
  );
  await save.click();
  const createResponse = await createResponsePromise;
  expect(createResponse.ok()).toBeTruthy();
  const { product } = await createResponse.json();
  await page.waitForURL(
    new RegExp(`/products/${product.id}\\?flow=creation&step=2$`),
  );
  return product as { id: string };
}

async function uploadFirstProductImage(page: Page) {
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Добавить изображения' }).click();
  await (await chooserPromise).setFiles('e2e/fixtures/profile-photo.png');
  await expect(page.getByText('1/10 изображений')).toBeVisible();
}

async function createEditableProduct(page: Page, title: string) {
  await page.goto('/products/new');
  await fillProductStepOne(page, title);
  const product = await createDraftThroughStepOne(page);
  await page.goto('/profile');
  await expect(page.getByText('Профиль автора', { exact: true })).toBeVisible();
  await page.goto(`/products/${product.id}`);
  await expect(page.getByLabel('Название')).toHaveValue(title);
  return product;
}

test.describe('product creation wizard navigation', () => {
  test('keeps later steps open after returning to step 1', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const { seller } = await createSellerFixture();
    const { context, page } = await authenticatedPage(browser, seller);
    const title = `Wizard nav ${Date.now()}`;

    try {
      await page.goto('/products/new');
      await fillProductStepOne(page, title);
      const product = await createDraftThroughStepOne(page);
      await uploadFirstProductImage(page);

      await page.getByRole('button', { name: '2. Изображения' }).click();
      await expect(page).toHaveURL(/flow=creation&step=2$/);
      await page.getByRole('button', { name: '1. О работе' }).click();
      await expect(page).toHaveURL(/flow=creation&step=1$/);
      await expect(
        page.getByRole('button', { name: '2. Изображения' }),
      ).toBeEnabled();
      await page
        .getByRole('button', { name: 'Продолжить к изображениям' })
        .click();
      await expect(page).toHaveURL(/flow=creation&step=2$/);

      await page
        .getByRole('button', { name: 'Продолжить к истории создания' })
        .click();
      await expect(page).toHaveURL(/flow=creation&step=3$/);
      await fillControl(
        page.getByRole('textbox', { name: 'История создания' }),
        'Wizard regression draft.',
      );
      await page
        .getByRole('button', { name: 'Сохранить и перейти к проверке' })
        .click();
      await expect(page).toHaveURL(/flow=creation&step=4$/);

      await page.getByRole('button', { name: '1. О работе' }).click();
      await expect(page).toHaveURL(/flow=creation&step=1$/);
      await expect(
        page.getByRole('button', { name: '3. История создания' }),
      ).toBeEnabled();
      await page.getByRole('button', { name: '3. История создания' }).click();
      await expect(page).toHaveURL(/flow=creation&step=3$/);
      await page.getByRole('button', { name: '2. Изображения' }).click();
      await expect(page).toHaveURL(/flow=creation&step=2$/);
      await page.getByRole('button', { name: '4. Проверка' }).click();
      await expect(page).toHaveURL(/flow=creation&step=4$/);

      await page.getByRole('button', { name: '1. О работе' }).click();
      await expect(page).toHaveURL(/flow=creation&step=1$/);
      await expect(
        page.getByRole('button', { name: '2. Изображения' }),
      ).toBeEnabled();
      await expect(
        page.getByRole('button', { name: '4. Проверка' }),
      ).toBeEnabled();
      await page.reload();
      await expect(page).toHaveURL(/flow=creation&step=1$/);
      await expect(
        page.getByRole('button', { name: '4. Проверка' }),
      ).toBeEnabled();
      await page.getByRole('button', { name: '4. Проверка' }).click();
      await expect(page).toHaveURL(/flow=creation&step=4$/);

      await page.goto(`/products/${product.id}?flow=creation&step=3`);
      await expect(page).toHaveURL(/flow=creation&step=3$/);
      await expect(
        page.getByRole('button', { name: '4. Проверка' }),
      ).toBeEnabled();
    } finally {
      await context.close();
    }
  });

  test('patches an existing draft on step 1 and continues to step 2', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const { seller } = await createSellerFixture();
    const { context, page } = await authenticatedPage(browser, seller);
    const title = `Wizard save ${Date.now()}`;

    try {
      await page.goto('/products/new');
      await fillProductStepOne(page, title);
      const product = await createDraftThroughStepOne(page);
      await uploadFirstProductImage(page);
      await page
        .getByRole('button', { name: 'Продолжить к истории создания' })
        .click();
      await page.getByRole('button', { name: '1. О работе' }).click();

      await page.getByLabel('Название').fill(`${title} edited`);
      const extraCreates: string[] = [];
      const onRequest = (request: { method(): string; url(): string }) => {
        if (
          request.method() === 'POST' &&
          new URL(request.url()).pathname === '/api/products'
        ) {
          extraCreates.push(request.url());
        }
      };
      page.on('request', onRequest);
      const patchResponsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith(`/api/products/${product.id}`) &&
          response.request().method() === 'PATCH',
      );
      await page
        .getByRole('button', { name: 'Сохранить и продолжить' })
        .click();
      const patchResponse = await patchResponsePromise;
      page.off('request', onRequest);
      expect(patchResponse.ok()).toBeTruthy();
      expect(extraCreates).toEqual([]);
      await expect(page).toHaveURL(/flow=creation&step=2$/);
      await page.getByRole('button', { name: '1. О работе' }).click();
      await expect(page).toHaveURL(/flow=creation&step=1$/);
      await expect(page.getByLabel('Название')).toHaveValue(`${title} edited`);
    } finally {
      await context.close();
    }
  });

  test('regular edit save stays on the edit screen', async ({ browser }) => {
    test.setTimeout(120_000);
    const { seller } = await createSellerFixture();
    const { context, page } = await authenticatedPage(browser, seller);
    const title = `Wizard edit ${Date.now()}`;

    try {
      await page.goto('/products/new');
      await fillProductStepOne(page, title);
      const product = await createDraftThroughStepOne(page);

      await page.goto(`/products/${product.id}`);
      await page.getByLabel('Название').fill(`${title} regular`);
      const patchResponsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith(`/api/products/${product.id}`) &&
          response.request().method() === 'PATCH',
      );
      await page.getByRole('button', { name: 'Сохранить изменения' }).click();
      expect((await patchResponsePromise).ok()).toBeTruthy();
      await expect(page).toHaveURL(new RegExp(`/products/${product.id}$`));
      await expect(page.getByLabel('Название')).toHaveValue(`${title} regular`);
    } finally {
      await context.close();
    }
  });

  test('clamps inaccessible URL steps to the highest openable step', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const { seller } = await createSellerFixture();
    const { context, page } = await authenticatedPage(browser, seller);
    const title = `Wizard url ${Date.now()}`;

    try {
      await page.goto('/products/new');
      await fillProductStepOne(page, title);
      const product = await createDraftThroughStepOne(page);

      await page.goto(`/products/${product.id}?flow=creation&step=4`);
      await expect(page).toHaveURL(/flow=creation&step=2$/);
      await expect(
        page.getByRole('button', { name: '3. История создания' }),
      ).toBeDisabled();
      await expect(
        page.getByRole('button', { name: '4. Проверка' }),
      ).toBeDisabled();

      await uploadFirstProductImage(page);
      await page.goto(`/products/${product.id}?flow=creation&step=99`);
      await expect(page).toHaveURL(/flow=creation&step=4$/);
      await expect(page.getByText('Проверка перед модерацией')).toBeVisible();
      await page.goto(`/products/${product.id}?flow=creation&step=4`);
      await expect(page).toHaveURL(/flow=creation&step=4$/);
      await expect(page.getByText('Проверка перед модерацией')).toBeVisible();

      await page.reload();
      await expect(page).toHaveURL(/flow=creation&step=4$/);
      await expect(page.getByText('Проверка перед модерацией')).toBeVisible();
      await expect(
        page.getByRole('button', { name: '1. О работе' }),
      ).toBeEnabled();
      await expect(
        page.getByRole('button', { name: '2. Изображения' }),
      ).toBeEnabled();
    } finally {
      await context.close();
    }
  });

  test('shows step 1 validation without locking later tabs', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const { seller } = await createSellerFixture();
    const { context, page } = await authenticatedPage(browser, seller);
    const title = `Wizard validation ${Date.now()}`;

    try {
      await page.goto('/products/new');
      await fillProductStepOne(page, title);
      await createDraftThroughStepOne(page);
      await uploadFirstProductImage(page);
      await page
        .getByRole('button', { name: 'Продолжить к истории создания' })
        .click();
      await page.getByRole('button', { name: '1. О работе' }).click();

      await page.getByLabel('Название').fill('');
      await page
        .getByRole('button', { name: 'Сохранить и продолжить' })
        .click();
      await expect(page.getByText('Введите название')).toHaveCount(1);
      await expect(page.getByText('Введите название')).toBeVisible();
      await expect(
        page.getByText(productWizardStepOneIncompleteMessage),
      ).toBeVisible();
      await expect(page).toHaveURL(/flow=creation&step=1$/);
      await expect(
        page.getByRole('button', { name: '2. Изображения' }),
      ).toBeEnabled();
      await page.getByRole('button', { name: '2. Изображения' }).click();
      await expect(page).toHaveURL(/flow=creation&step=2$/);
    } finally {
      await context.close();
    }
  });

  test('persists the current form values before submitting', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const { seller } = await createSellerFixture();
    const { context, page } = await authenticatedPage(browser, seller);
    const title = `Wizard submit ${Date.now()}`;
    const currentTitle = `${title} current`;

    try {
      await page.goto('/products/new');
      await fillProductStepOne(page, title);
      const product = await createDraftThroughStepOne(page);
      await uploadFirstProductImage(page);
      await page.getByRole('button', { name: '1. О работе' }).click();
      await page.getByLabel('Название').fill(currentTitle);

      const navigationSave = page.waitForResponse(
        (response) =>
          response.url().endsWith(`/api/products/${product.id}`) &&
          response.request().method() === 'PATCH',
      );
      await page.getByRole('button', { name: '4. Проверка' }).click();
      expect((await navigationSave).request().postDataJSON()).toMatchObject({
        title: currentTitle,
      });
      await expect(page).toHaveURL(/flow=creation&step=4$/);

      const writes: Array<{ method: string; path: string; body?: unknown }> =
        [];
      const onRequest = (request: {
        method(): string;
        url(): string;
        postDataJSON(): unknown;
      }) => {
        const path = new URL(request.url()).pathname;
        if (path === `/api/products/${product.id}`) {
          writes.push({
            method: request.method(),
            path,
            body: request.postDataJSON(),
          });
        }
        if (path === `/api/products/${product.id}/submit`) {
          writes.push({ method: request.method(), path });
        }
      };
      page.on('request', onRequest);
      const submitResponse = page.waitForResponse(
        (response) =>
          response.url().endsWith(`/api/products/${product.id}/submit`) &&
          response.request().method() === 'POST',
      );
      await page
        .getByRole('button', { name: 'Отправить на модерацию' })
        .click();
      expect((await submitResponse).ok()).toBeTruthy();
      page.off('request', onRequest);

      expect(writes).toEqual([
        {
          method: 'PATCH',
          path: `/api/products/${product.id}`,
          body: expect.objectContaining({ title: currentTitle }),
        },
        {
          method: 'POST',
          path: `/api/products/${product.id}/submit`,
        },
      ]);
      await expect(
        page.getByText('Предмет отправлен на модерацию.'),
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('saves a dirty draft before closing and restores it by id', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const { seller } = await createSellerFixture();
    const { context, page } = await authenticatedPage(browser, seller);
    const title = `Wizard close ${Date.now()}`;
    const savedTitle = `${title} saved`;

    try {
      await page.goto('/products/new');
      await fillProductStepOne(page, title);
      const product = await createDraftThroughStepOne(page);
      await page.getByRole('button', { name: '1. О работе' }).click();
      await page.getByLabel('Название').fill(savedTitle);

      const saveResponse = page.waitForResponse(
        (response) =>
          response.url().endsWith(`/api/products/${product.id}`) &&
          response.request().method() === 'PATCH',
      );
      await page.getByRole('button', { name: 'Сохранить и закрыть' }).click();
      expect((await saveResponse).ok()).toBeTruthy();
      await expect(page).toHaveURL(/\/profile$/);

      await page.goto(`/products/${product.id}`);
      await expect(page.getByLabel('Название')).toHaveValue(savedTitle);
    } finally {
      await context.close();
    }
  });

  test('persists a dirty Work before browser Back and restores its values', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const { seller } = await createSellerFixture();
    const { context, page } = await authenticatedPage(browser, seller);
    const title = `Browser back ${Date.now()}`;
    const changedTitle = `${title} saved`;

    try {
      const product = await createEditableProduct(page, title);
      await page.getByLabel('Название').fill(changedTitle);
      const saveResponse = page.waitForResponse(
        (response) =>
          response.url().endsWith(`/api/products/${product.id}`) &&
          response.request().method() === 'PATCH',
      );

      await page.evaluate(() => history.back());
      expect((await saveResponse).ok()).toBeTruthy();
      await expect(page).toHaveURL(/\/profile$/);

      await page.goto(`/products/${product.id}`);
      await expect(page.getByLabel('Название')).toHaveValue(changedTitle);
    } finally {
      await context.close();
    }
  });

  test('blocks browser Back and retains dirty input when persistence fails', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const { seller } = await createSellerFixture();
    const { context, page } = await authenticatedPage(browser, seller);
    const title = `Browser back failure ${Date.now()}`;
    const changedTitle = `${title} unsaved`;

    try {
      const product = await createEditableProduct(page, title);
      await page.getByLabel('Название').fill(changedTitle);
      await page.route(`**/api/products/${product.id}`, (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'internal_error' }),
        }),
      );
      const failedSave = page.waitForResponse(
        (response) =>
          response.url().endsWith(`/api/products/${product.id}`) &&
          response.request().method() === 'PATCH',
      );

      await page.evaluate(() => history.back());
      expect((await failedSave).status()).toBe(500);
      await expect(page).toHaveURL(new RegExp(`/products/${product.id}$`));
      await expect(page.getByLabel('Название')).toHaveValue(changedTitle);
    } finally {
      await context.close();
    }
  });

  test('allows browser Back from a clean Work without saving', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const { seller } = await createSellerFixture();
    const { context, page } = await authenticatedPage(browser, seller);
    const title = `Browser back clean ${Date.now()}`;
    const writes: string[] = [];

    try {
      await createEditableProduct(page, title);
      const onRequest = (request: { method(): string; url(): string }) => {
        if (
          request.method() === 'PATCH' &&
          new URL(request.url()).pathname.startsWith('/api/products/')
        ) {
          writes.push(request.url());
        }
      };
      page.on('request', onRequest);

      await page.evaluate(() => history.back());
      await expect(page).toHaveURL(/\/profile$/);
      page.off('request', onRequest);
      expect(writes).toEqual([]);
    } finally {
      await context.close();
    }
  });
});
