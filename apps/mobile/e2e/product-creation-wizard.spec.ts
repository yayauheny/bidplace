import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { e2eEvidenceDir } from './support/evidence-dir';
import { randomUUID } from 'node:crypto';

import { PrismaClient } from '../../../packages/database/dist/index.js';
import { expect, test, type Page } from '@playwright/test';

import { createSellerFixture } from './support/e2e-fixtures';
import { e2eDatabaseURL } from './support/e2e-env';
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
  await expect(
    page.getByRole('img', { name: 'Изображение предмета 1' }),
  ).toBeVisible();
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

test.describe('Work catalog browser round-trip', () => {
  test('saves selected materials and an author proposal, then restores them after reload', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const { seller } = await createSellerFixture();
    const prisma = new PrismaClient({
      datasources: { db: { url: e2eDatabaseURL } },
    });
    const materialName = `Холст E2E ${randomUUID().slice(0, 8)}`;
    try {
      await prisma.catalogTerm.create({
        data: {
          role: 'MATERIAL',
          slug: `e2e-canvas-${randomUUID().slice(0, 8)}`,
          name: materialName,
          normalizedName: materialName.toLocaleLowerCase('ru'),
        },
      });
    } finally {
      await prisma.$disconnect();
    }
    const { context, page } = await authenticatedPage(browser, seller);
    try {
      await page.goto('/products/new');
      await page.getByRole('button', { name: 'E2E art' }).click();
      await fillControl(
        page.getByRole('textbox', { name: /Название/ }),
        `Work catalog ${Date.now()}`,
      );

      await page.getByRole('button', { name: 'Материалы' }).click();
      await expect(
        page.getByRole('dialog', { name: 'Материалы' }),
      ).toBeVisible();
      await page
        .getByRole('button', { name: materialName, exact: true })
        .click();
      await fillControl(
        page.getByRole('textbox', { name: 'Поиск или новое значение' }),
        'Авторский материал E2E',
      );
      await page
        .getByRole('button', { name: 'Предложить «Авторский материал E2E»' })
        .click();
      await page.getByRole('button', { name: 'Применить' }).click();

      const save = page.waitForResponse(
        (response) =>
          response.url().endsWith('/api/products') &&
          response.request().method() === 'POST',
      );
      await page
        .getByRole('button', { name: 'Сохранить и продолжить' })
        .click();
      const response = await save;
      expect(response.ok()).toBeTruthy();
      const { product } = await response.json();

      await page.goto(`/products/${product.id}?flow=creation&step=1`);
      await expect(
        page.getByRole('button', { name: 'Материалы' }),
      ).toContainText(materialName);
      await expect(
        page.getByRole('button', { name: 'Материалы' }),
      ).toContainText('Авторский материал E2E');
      await page.getByRole('button', { name: 'Материалы' }).click();
      await expect(
        page.getByRole('button', { name: `Удалить ${materialName}` }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Удалить Авторский материал E2E' }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Применить' }).click();
      await page
        .getByRole('button', { name: 'Сохранить и продолжить' })
        .click();
      await expect(
        page.getByRole('button', { name: 'Добавить изображения' }),
      ).toBeVisible();
      await uploadFirstProductImage(page);
      await page.getByRole('button', { name: '4. Проверка' }).click();
      await expect(
        page.getByText(`Материалы: ${materialName}, Авторский материал E2E`, {
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByText('Категория: E2E art', { exact: true }),
      ).toBeVisible();
      for (const width of [320, 390, 440, 767, 768, 1023, 1024, 1440, 1800]) {
        await page.setViewportSize({ width, height: 874 });
        await expect
          .poll(
            () =>
              page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
              ),
            { message: `Review has no horizontal overflow at ${width}px` },
          )
          .toBe(true);
        const submit = page.getByRole('button', {
          name: 'Отправить на модерацию',
          exact: true,
        });
        await submit.scrollIntoViewIfNeeded();
        await expect(submit).toBeInViewport();
        if (width === 390 || width === 1440) {
          const directory = resolve(e2eEvidenceDir, 'ui-review-product');
          await mkdir(directory, { recursive: true });
          await page.screenshot({
            path: resolve(
              directory,
              `${test.info().project.name}-${width}.png`,
            ),
          });
        }
      }
    } finally {
      await context.close();
    }
  });
});

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
        .getByRole('button', { name: 'Продолжить', exact: true })
        .click();
      await expect(page).toHaveURL(/flow=creation&step=3$/);
      await page.getByRole('button', { name: 'Добавить текст' }).click();
      await fillControl(
        page.getByRole('textbox', { name: 'Текст истории' }),
        'Wizard regression draft.',
      );
      await page.getByRole('button', { name: 'Закончить' }).click();
      await expect(page).toHaveURL(/flow=creation&step=4$/);
      await expect(
        page.getByText('Wizard regression draft.', { exact: true }),
      ).toBeVisible();

      await page.getByRole('button', { name: '1. О работе' }).click();
      await expect(page).toHaveURL(/flow=creation&step=1$/);
      await expect(
        page.getByRole('button', { name: '3. История создания' }),
      ).toBeEnabled();
      await page.getByRole('button', { name: '3. История создания' }).click();
      await expect(page).toHaveURL(/flow=creation&step=3$/);
      // The story step follows Figma 7008:27134 — no step tabs there;
      // back to images goes through the top-bar icon button (the story
      // toolbar renders a second button with the same label further down).
      await page
        .getByRole('button', { name: 'Назад к изображениям' })
        .first()
        .click();
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
      // Step 3 renders the story chrome without step tabs (Figma 7008:27134);
      // reach the review step through the images step.
      await page
        .getByRole('button', { name: 'Назад к изображениям' })
        .first()
        .click();
      await expect(page).toHaveURL(/flow=creation&step=2$/);
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
        .getByRole('button', { name: 'Продолжить', exact: true })
        .click();
      // The story step has no step tabs (Figma 7008:27134): go back to the
      // images step first, then open step 1 from its tab list.
      await page
        .getByRole('button', { name: 'Назад к изображениям' })
        .first()
        .click();
      await expect(page).toHaveURL(/flow=creation&step=2$/);
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

  test('shows step 1 validation and blocks the step change until the draft persists', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const { seller } = await createSellerFixture();
    const { context, page } = await authenticatedPage(browser, seller);
    const title = `Wizard validation ${Date.now()}`;

    try {
      await page.goto('/products/new');
      await fillProductStepOne(page, title);
      const product = await createDraftThroughStepOne(page);
      await uploadFirstProductImage(page);
      await page
        .getByRole('button', { name: 'Продолжить', exact: true })
        .click();
      // The story step has no step tabs (Figma 7008:27134): go back to the
      // images step first, then open step 1 from its tab list.
      await page
        .getByRole('button', { name: 'Назад к изображениям' })
        .first()
        .click();
      await expect(page).toHaveURL(/flow=creation&step=2$/);
      await page.getByRole('button', { name: '1. О работе' }).click();

      await expect(page.getByLabel('Название')).toHaveValue(title);
      const nameField = page.getByLabel('Название');
      await nameField.click();
      // Keyboard select-all + Delete does not clear a controlled input in
      // Chromium (only one character is removed); fill('') emits real input
      // events and clears it in both Chromium and WebKit.
      await nameField.fill('');
      await expect(nameField).toHaveValue('');
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
      // Save failure keeps the author on step 1 (02-USER-FLOWS §9): the tab
      // stays reachable, but the transition waits for a successful persist.
      // The draft schema itself allows an empty title, so force a real
      // persistence failure instead of relying on validation.
      await page.route(`**/api/products/${product.id}`, (route) => {
        if (route.request().method() !== 'PATCH') return route.continue();
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'internal_error' }),
        });
      });
      const failedPatch = page.waitForResponse(
        (response) =>
          response.url().endsWith(`/api/products/${product.id}`) &&
          response.request().method() === 'PATCH',
      );
      await page.getByRole('button', { name: '2. Изображения' }).click();
      // The transition must actually fire the PATCH and surface its failure;
      // a no-op click would wrongly pass the URL assertion below. A 500 maps
      // to the canonical infrastructure copy.
      expect((await failedPatch).status()).toBe(500);
      await expect(
        page.getByText('Проверьте соединение и попробуйте ещё раз.'),
      ).toBeVisible();
      await expect(page).toHaveURL(/flow=creation&step=1$/);
      await expect(page.getByLabel('Название')).toHaveValue('');
      await page.unroute(`**/api/products/${product.id}`);
      await fillControl(page.getByRole('textbox', { name: /Название/ }), title);
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
      await expect(
        page.getByText(`Название: ${currentTitle}`, { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText('Категория: E2E art', { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText('Уникальность: One', { exact: true }),
      ).toBeVisible();

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

test('photo grid keeps Figma geometry, actions and continuation across viewport sizes', async ({
  page,
}) => {
  const now = '2026-10-23T00:00:00.000Z';
  const workId = '11111111-1111-4111-8111-111111111111';
  const categoryId = '33333333-3333-4333-8333-333333333333';
  const fixture = {
    product: {
      id: workId,
      publicId: 'draftwork01',
      sellerProfileId: '44444444-4444-4444-8444-444444444444',
      categoryId,
      title: 'Фотографии работы',
      story: null,
      technique: null,
      materials: null,
      dimensions: null,
      weight: null,
      year: null,
      condition: null,
      uniqueness: null,
      provenance: null,
      city: null,
      packaging: null,
      deliveryInfo: null,
      publishedAt: null,
      status: 'DRAFT',
      images: Array.from({ length: 5 }, (_, index) => ({
        id: `55555555-5555-4555-8555-55555555555${index}`,
        position: index,
        url: `/api/images/55555555-5555-4555-8555-55555555555${index}`,
        mimeType: 'image/jpeg',
        byteLength: 100,
        checksum: 'a'.repeat(64),
        width: 600,
        height: 800,
      })),
      createdAt: now,
      updatedAt: now,
    },
    editingRevision: {
      id: '22222222-2222-4222-8222-222222222222',
      version: 1,
      status: 'DRAFT',
      updatedAt: now,
    },
    creationIntro: null,
    creationSteps: [],
    lastModerationReason: null,
    story: { blocks: [], storyToken: 0 },
    selection: {
      category: null,
      materialTermIds: [],
      techniqueTermIds: [],
      materialTerms: [],
      techniqueTerms: [],
      proposals: [],
    },
  };
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me')
      return route.fulfill({
        json: {
          user: {
            id: workId,
            email: 'visual@bidplace.test',
            phone: null,
            emailVerifiedAt: now,
            phoneVerifiedAt: null,
            acceptedRulesVersion: null,
            displayName: 'Автор',
            slug: 'visual-author',
            role: 'user',
            status: 'active',
            createdAt: now,
            updatedAt: now,
          },
        },
      });
    if (path === `/api/seller/products/${workId}`)
      return route.fulfill({ json: fixture });
    if (path === '/api/categories')
      return route.fulfill({ json: { categories: [] } });
    if (path.startsWith('/api/images/'))
      return route.fulfill({
        path: `e2e/fixtures/portfolio-photo-${Number(path.at(-1)) + 1}.png`,
        contentType: 'image/png',
      });
    return route.fulfill({
      status: 404,
      json: { code: 'not_found', message: 'Not found' },
    });
  });
  await page.setViewportSize({ width: 390, height: 824 });
  await page.goto(`/products/${workId}?flow=creation&step=2`);
  const image = page.getByRole('img', {
    name: 'Изображение предмета 1',
    exact: true,
  });
  await expect(image).toBeVisible();
  const imageBox = await image.boundingBox();
  expect(imageBox?.width).toBeCloseTo(177, 0);
  expect(imageBox?.height).toBeCloseTo(236, 0);
  expect(imageBox?.y).toBeCloseTo(114.216, 0);
  const second = await page.getByRole('img', { name: 'Изображение предмета 2', exact: true }).boundingBox();
  expect((second?.x ?? 0) - (imageBox?.x ?? 0) - (imageBox?.width ?? 0)).toBeCloseTo(12, 0);
  expect((await page.getByRole('button', { name: 'Продолжить', exact: true }).boundingBox())?.height).toBeCloseTo(55, 0);
  await expect(
    page.getByRole('button', { name: 'Продолжить', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Удалить фото', exact: true }),
  ).toHaveCount(5);
  await expect(page.getByTestId('site-footer')).toHaveCount(0);
  await mkdir(resolve(e2eEvidenceDir, 'portfolio-design'), { recursive: true });
  for (const width of [320, 390, 414, 440, 1024, 1440]) {
    await page.setViewportSize({ width, height: width === 440 ? 480 : 824 });
    await page.getByTestId('form-page').evaluate(node => { node.scrollTop = 0; });
    await expect(
      page.getByRole('button', { name: 'Продолжить', exact: true }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await page.screenshot({
      path: resolve(
        e2eEvidenceDir,
        'portfolio-design',
        `photos-${test.info().project.name}-${width}.png`,
      ),
    });
    const add = page.getByRole('button', { name: 'Добавить изображения', exact: true });
    await add.scrollIntoViewIfNeeded();
    const lastTile = await add.boundingBox();
    const continueAction = await page.getByRole('button', { name: 'Продолжить', exact: true }).boundingBox();
    expect(lastTile).not.toBeNull();
    // Browser scrollTop rounds to CSS pixels while 3:4 flex tiles retain fractional bounds.
    expect(Math.round((lastTile?.y ?? 0) + (lastTile?.height ?? 0))).toBeLessThanOrEqual(Math.round(continueAction?.y ?? 0));
  }
});
