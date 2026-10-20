import { expect, test } from '@playwright/test';
import { PrismaClient } from '../../../packages/database/dist/index.js';

import {
  createAdminModerationFixture,
  createSellerFixture,
} from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';
import { e2eDatabaseURL } from './support/e2e-env';
import { fillControl } from './support/fill-control';

const apiPort = process.env.E2E_API_PORT ?? '3001';
const apiBaseURL = `http://localhost:${apiPort}`;

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('published work → new editing revision keeps the story; a stale draft is not applied', async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const { seller } = await createSellerFixture();
  const { context, page } = await authenticatedPage(browser, seller);
  try {
    // Create a work with a story and submit it for moderation.
    await page.goto('/products/new');
    await page.getByRole('button', { name: 'E2E art' }).click();
    await fillControl(
      page.getByRole('textbox', { name: /Название/ }),
      'Revision story',
    );
    await fillControl(
      page.getByRole('textbox', { name: /Уникальность или тираж/ }),
      'One',
    );
    const createResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/products') &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Сохранить и продолжить' }).click();
    const { product } = (await (await createResponse).json()) as {
      product: { id: string };
    };

    await page.goto(`/products/${product.id}?flow=creation&step=2`);
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить изображения' }).click();
    await (await chooserPromise).setFiles('e2e/fixtures/profile-photo.png');
    await expect(page.getByText('1/10 изображений')).toBeVisible();

    await page.goto(`/products/${product.id}?flow=creation&step=3`);
    await page.getByRole('button', { name: 'Добавить текст' }).click();
    await fillControl(
      page.getByRole('textbox', { name: 'Текст истории' }),
      'История редакции один',
    );
    const storySave = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/products/${product.id}/creation`) &&
        response.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: 'Закончить' }).click();
    expect((await storySave).ok()).toBe(true);
    await expect(page).toHaveURL(/flow=creation&step=4/);

    const submitResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/products/${product.id}/submit`) &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Отправить на модерацию' }).click();
    expect((await submitResponse).ok()).toBeTruthy();

    // Admin approves: the pending revision becomes the published one.
    const { admin } = await createAdminModerationFixture();
    const { context: adminContext } = await authenticatedPage(browser, admin);
    const prisma = new PrismaClient({
      datasources: { db: { url: e2eDatabaseURL } },
    });
    const before = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      select: { editingRevisionId: true },
    });
    const publishedRevision = await prisma.productRevision.findUniqueOrThrow({
      where: { id: before.editingRevisionId! },
      select: { updatedAt: true },
    });
    await prisma.$disconnect();
    const approveResponse = await adminContext.request.patch(
      `${apiBaseURL}/api/admin/products/${product.id}/status`,
      {
        data: {
          status: 'APPROVED',
          target: {
            kind: 'revision',
            id: before.editingRevisionId,
            updatedAt: publishedRevision.updatedAt.toISOString(),
          },
        },
      },
    );
    expect(approveResponse.ok()).toBeTruthy();
    await adminContext.close();

    // The owner edits a field of the published work and re-submits it; the
    // field PATCH creates a new editing revision as a copy of the published
    // one (story included).
    await page.goto(`/products/${product.id}`);
    await expect(page.getByLabel('Название')).toHaveValue('Revision story');
    await fillControl(
      page.getByRole('textbox', { name: /Название/ }),
      'Revision story v2',
    );
    const patchResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/products/${product.id}`) &&
        response.request().method() === 'PATCH',
    );
    await page.getByRole('button', { name: 'Отправить на модерацию' }).click();
    expect((await patchResponse).ok()).toBeTruthy();
    await expect(page.getByText('На модерации')).toBeVisible();

    // A stale draft left over from the previous revision must not overwrite
    // the new revision's story; it moves to the recovery namespace (copy →
    // confirm → delete source), stays preserved there, and is explained in
    // the existing warning area.
    const draftKey = `bidplace:draft:${seller.id}:product-story:${product.id}`;
    const staleDraft = JSON.stringify({
      v: 2,
      revisionId: before.editingRevisionId,
      token: 9,
      blocks: [
        { key: 'stale-key', type: 'PARAGRAPH', text: 'Устаревший черновик' },
      ],
    });
    await page.evaluate(
      ([key, value]) => window.localStorage.setItem(key, value),
      [draftKey, staleDraft] as const,
    );

    await page.goto(`/products/${product.id}?flow=creation&step=3`);
    await expect(
      page.getByRole('textbox', { name: 'Текст истории' }),
    ).toHaveValue('История редакции один');
    await expect(page.getByText(/другой редакции/)).toBeVisible();
    // The legacy key is consumed; the only copy lives under a recovery key.
    expect(
      await page.evaluate((key) => window.localStorage.getItem(key), draftKey),
    ).toBeNull();
    expect(
      await page.evaluate(() => {
        for (let index = 0; index < window.localStorage.length; index += 1) {
          const key = window.localStorage.key(index);
          const value = key && window.localStorage.getItem(key);
          if (key?.includes('~recovery') && value?.includes('Устаревший'))
            return true;
        }
        return false;
      }),
    ).toBe(true);

    // Late wizard steps still work on the new revision.
    await page.goto(`/products/${product.id}?flow=creation&step=2`);
    await expect(page.getByText('1/10 изображений')).toBeVisible();
  } finally {
    await context.close();
  }
});
