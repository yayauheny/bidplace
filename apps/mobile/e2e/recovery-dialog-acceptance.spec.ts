import { expect, test } from '@playwright/test';

import {
  createAdminModerationFixture,
  createSellerFixture,
} from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';
import { fillControl } from './support/fill-control';

const apiPort = process.env.E2E_API_PORT ?? '3001';
const apiBaseURL = `http://localhost:${apiPort}`;

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('recovered story copy: the manual-copy dialog shows the long text, scrolls, and returns focus', async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const { seller } = await createSellerFixture();
  const { context, page } = await authenticatedPage(browser, seller);
  try {
    // The clipboard write deterministically rejects: the browser check covers
    // the dialog path (the absent-API path is covered by screen unit tests).
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: () => Promise.reject(new Error('clipboard denied')),
        },
        configurable: true,
      });
    });

    await page.goto('/products/new');
    await page.getByRole('button', { name: 'E2E art' }).click();
    await fillControl(
      page.getByRole('textbox', { name: /Название/ }),
      'Recovery dialog',
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
      'История для recovery dialog',
    );
    const storySave = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/products/${product.id}/creation`) &&
        response.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: 'Закончить' }).click();
    expect((await storySave).ok()).toBe(true);

    const submitResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/products/${product.id}/submit`) &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Отправить на модерацию' }).click();
    expect((await submitResponse).ok()).toBeTruthy();

    // Approve so the work is published, then a field edit creates a new
    // editing revision — the old revision's local copy becomes recovery.
    const { admin } = await createAdminModerationFixture();
    const { context: adminContext } = await authenticatedPage(browser, admin);
    const { PrismaClient } = await import(
      '../../../packages/database/dist/index.js'
    );
    const { e2eDatabaseURL } = await import('./support/e2e-env');
    const prisma = new PrismaClient({
      datasources: { db: { url: e2eDatabaseURL } },
    });
    const current = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      select: { editingRevisionId: true },
    });
    const pendingRevision = await prisma.productRevision.findUniqueOrThrow({
      where: { id: current.editingRevisionId! },
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
            id: current.editingRevisionId,
            updatedAt: pendingRevision.updatedAt.toISOString(),
          },
        },
      },
    );
    expect(approveResponse.ok()).toBeTruthy();
    await adminContext.close();

    await page.goto(`/products/${product.id}`);
    await expect(page.getByLabel('Название')).toHaveValue('Recovery dialog');
    await fillControl(
      page.getByRole('textbox', { name: /Название/ }),
      'Recovery dialog v2',
    );
    const patchResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/products/${product.id}`) &&
        response.request().method() === 'PATCH',
    );
    await page.getByRole('button', { name: 'Отправить на модерацию' }).click();
    expect((await patchResponse).ok()).toBeTruthy();

    // Unmount the editor before seeding storage so its final draft flush cannot
    // replace the stale copy being tested.
    await page.goto('/');

    // Seed a stale copy of the previous revision with a long text.
    const longText = Array.from(
      { length: 40 },
      (_, index) =>
        `Абзац ${index + 1} восстановленного черновика: длинный текст, который должен быть доступен для ручного выделения и прокрутки внутри диалога.`,
    ).join('\n\n');
    await page.evaluate(
      ({ productId, sellerId, text }) => {
        window.localStorage.setItem(
          `bidplace:draft:${sellerId}:product-story:${productId}`,
          JSON.stringify({
            v: 2,
            revisionId: '00000000-0000-4000-8000-000000000000',
            token: 9,
            blocks: [
              { key: 'stale-1', type: 'PARAGRAPH', text },
              { key: 'stale-2', type: 'PARAGRAPH', text: 'Конец черновика.' },
            ],
          }),
        );
      },
      { productId: product.id, sellerId: seller.id, text: longText },
    );

    await page.goto(`/products/${product.id}?flow=creation&step=3`);
    await expect(page.getByText(/другой редакции/)).toBeVisible();
    const copyButton = page.getByRole('button', {
      name: 'Скопировать сохранённый текст',
    });
    await expect(copyButton).toBeVisible();

    // The rejected clipboard write opens the manual-copy dialog.
    await copyButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText('Автоматическое копирование недоступно'),
    ).toBeVisible();
    const dialogText = dialog.getByText('Абзац 1 восстановленного');
    await expect(dialogText).toBeVisible();
    // The recovered payload ends up in the dialog.
    await expect(dialog.getByText('Конец черновика.')).toBeVisible();

    // Selection works: a triple click selects paragraph text.
    await dialogText.click({ clickCount: 3 });
    const selection = await page.evaluate(
      () => window.getSelection()?.toString() ?? '',
    );
    expect(selection).toContain('восстановленного черновика');

    // The dialog content scrolls to the long text's end.
    const scroll = await dialog.evaluate((node) => {
      const candidates = [node as HTMLElement, ...node.querySelectorAll('*')];
      const scrollable = candidates.find(
        (el): el is HTMLElement =>
          el instanceof HTMLElement &&
          el.scrollHeight > el.clientHeight + 1 &&
          el.clientHeight > 0,
      );
      if (!scrollable)
        return { clientHeight: 0, scrollHeight: 0, text: 'NONE' };
      const info = {
        clientHeight: scrollable.clientHeight,
        scrollHeight: scrollable.scrollHeight,
        text: scrollable.textContent ?? '',
      };
      scrollable.scrollTop = scrollable.scrollHeight;
      return info;
    });
    expect(scroll.text).toContain('Конец черновика.');
    expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight);
    await expect(dialog.getByText('Конец черновика.')).toBeInViewport();

    // Closing the dialog returns focus to the copy action.
    await page
      .getByRole('button', { name: 'Закрыть', exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    await expect(copyButton).toBeFocused();
  } finally {
    await context.close();
  }
});

test('short dialog and sheet stay usable on a short viewport and across resize', async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const { seller } = await createSellerFixture();
  const { context, page } = await authenticatedPage(browser, seller);
  try {
    await page.setViewportSize({ width: 390, height: 400 });
    await page.goto('/products/new');
    await page.getByRole('button', { name: 'E2E art' }).click();
    await fillControl(
      page.getByRole('textbox', { name: /Название/ }),
      'Short dialog',
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

    // Short dialog on a 390x400 viewport: everything reachable, no
    // horizontal page overflow.
    const image = page.locator('[data-editor-block="image"]').first();
    await image.getByRole('button', { name: 'Действия с изображением', exact: true }).click();
    await image.getByRole('button', { name: 'Удалить', exact: true }).click();
    const shortDialog = page.getByRole('dialog');
    await expect(shortDialog).toBeVisible();
    await expect(
      shortDialog.getByRole('button', { name: 'Удалить изображение' }),
    ).toBeVisible();
    await expect(
      shortDialog.getByRole('button', { name: 'Отмена' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.scrollingElement!.scrollWidth <= window.innerWidth &&
          document.body.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);

    // Resize while open: the dialog follows the viewport and stays usable.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(shortDialog).toBeVisible();
    await expect(
      shortDialog.getByRole('button', { name: 'Отмена' }),
    ).toBeVisible();
    await shortDialog.getByRole('button', { name: 'Отмена' }).click();
    await expect(shortDialog).not.toBeVisible();

    // Sheet presentation (catalog filters) on the same short viewport.
    await page.setViewportSize({ width: 390, height: 400 });
    await page.goto('/works');
    await page.getByRole('button', { name: 'Фильтры' }).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await expect(
      sheet.getByRole('button', { name: 'Применить' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.body.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(sheet).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).not.toBeVisible();
  } finally {
    await context.close();
  }
});
