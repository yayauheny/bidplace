import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { e2eEvidenceDir } from './support/evidence-dir';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { PrismaClient } from '../../../packages/database/dist/index.js';
import { authenticatedPage, e2eRequestHeaders } from './support/auth-session';
import { fillControl } from './support/fill-control';
import {
  createSellerFixture,
  createBuyerFixture,
  createAdminModerationFixture,
} from './support/e2e-fixtures';
import {
  e2eApiBaseURL,
  e2eDatabaseURL,
  e2eWebBaseURL,
} from './support/e2e-env';
import { readFileSync } from 'node:fs';

async function captureWorkStep(page: Page, name: string) {
  const directory = resolve(e2eEvidenceDir, '2026-10-21-work-editor');
  await mkdir(directory, { recursive: true });
  for (const width of [390, 1024, 1440]) {
    await page.setViewportSize({ width, height: 874 });
    await page.evaluate(() => document.fonts.ready);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await page.screenshot({
      path: resolve(
        directory,
        `${test.info().project.name}-${name}-${width}.png`,
      ),
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 874 });
}

// NestJS, PostgreSQL, forms and image pipeline are real. Only R2/purge transport
// is replaced by media-server.mjs so outages and direct CDN reads are repeatable.
test('Work waits for CDN media, publishes revisions atomically, loads FULL only in viewer and revokes', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const { buyer } = await createBuyerFixture();
  const { admin } = await createAdminModerationFixture();
  const { context, page } = await authenticatedPage(browser, buyer);
  const { context: adminContext } = await authenticatedPage(browser, admin);
  const guest = await browser.newPage({
    baseURL: e2eWebBaseURL,
    extraHTTPHeaders: e2eRequestHeaders,
  });
  const prisma = new PrismaClient({
    datasources: { db: { url: e2eDatabaseURL } },
  });
  const cdnRequests: string[] = [];
  await guest.route('https://media.example.test/**', async (route) => {
    const url = route.request().url();
    cdnRequests.push(url);
    const value = await guest.request.get(
      `${e2eApiBaseURL}/__media?key=${encodeURIComponent(new URL(url).pathname.slice(1))}`,
    );
    expect(value.status()).toBe(200);
    expect(value.headers()['content-type']).toContain('image/webp');
    await route.fulfill({ response: value });
  });
  try {
    const fault = async (enabled: boolean) => {
      const response = await guest.request.post(
        `${e2eApiBaseURL}/__media-fault?fail=${enabled}`,
      );
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ ok: true, failPublic: enabled });
    };
    const tick = async () => {
      expect(
        (await guest.request.post(`${e2eApiBaseURL}/__media-run`)).status(),
      ).toBe(200);
    };
    const suffix = `${test.info().project.name}-${Date.now()}`;
    const createdAuthor = await context.request.post(
      `${e2eApiBaseURL}/api/seller/profile`,
      {
        multipart: {
          // Seller profile writes carry JSON fields in one `data` part
          // (sellerProfileMultipartDataField) so nulls survive transport.
          data: JSON.stringify({
            fullName: 'Work lifecycle author',
            country: 'BY',
            city: 'Minsk',
            discipline: 'Автор',
            shortDescription: 'Portfolio lifecycle',
          }),
          profilePhoto: {
            name: 'photo.png',
            mimeType: 'image/png',
            buffer: readFileSync('e2e/fixtures/profile-photo.png'),
          },
        },
      },
    );
    expect(createdAuthor.status()).toBe(201);
    const created = await createdAuthor.json();
    // The submit contract requires at least one direction on the revision
    // (assertProfileRevisionReadyToSubmit) and the ABOUT advance checks it too.
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: 'e2e-art' },
    });
    await prisma.sellerProfileRevisionDirection.create({
      data: {
        revisionId: created.editingRevision.id,
        categoryId: category.id,
        position: 0,
      },
    });
    await context.request.post(
      `${e2eApiBaseURL}/api/author/application/advance`,
    );
    await context.request.post(
      `${e2eApiBaseURL}/api/author/application/advance`,
    );
    expect(
      (
        await context.request.post(
          `${e2eApiBaseURL}/api/author/application/submit`,
        )
      ).status(),
    ).toBe(201);
    expect(
      (
        await adminContext.request.patch(
          `${e2eApiBaseURL}/api/admin/seller-profiles/${created.sellerProfile.id}/status`,
          {
            data: {
              status: 'APPROVED',
              target: {
                kind: 'revision',
                id: created.editingRevision.id,
                updatedAt: (
                  await (
                    await context.request.get(
                      `${e2eApiBaseURL}/api/seller/profile`,
                    )
                  ).json()
                ).editingRevision.updatedAt,
              },
            },
          },
        )
      ).status(),
    ).toBe(200);
    await tick();
    await expect
      .poll(
        async () =>
          (
            await (
              await context.request.get(`${e2eApiBaseURL}/api/seller/profile`)
            ).json()
          ).sellerProfile.status,
      )
      .toBe('APPROVED');
    await page.goto('/products/new');
    await page.getByRole('button', { name: 'E2E art', exact: true }).click();
    await fillControl(
      page.getByRole('textbox', { name: 'Название *', exact: true }),
      `Lifecycle ${suffix}`,
    );
    await captureWorkStep(page, 'data');
    const createWork = page.waitForResponse(
      (r) =>
        r.url().endsWith('/api/products') && r.request().method() === 'POST',
    );
    await page
      .getByRole('button', { name: 'Сохранить и продолжить', exact: true })
      .click();
    const work = (await (await createWork).json()).product;
    await expect(
      page.getByRole('button', { name: 'Добавить изображения', exact: true }),
    ).toBeVisible();
    await captureWorkStep(page, 'photos-empty');
    let dropUploadResponse = true;
    await page.route('**/api/products/*/images', async (route) => {
      if (dropUploadResponse && route.request().method() === 'POST') {
        await route.fetch();
        dropUploadResponse = false;
        await route.abort('failed');
      } else await route.continue();
    });
    const chooser = page.waitForEvent('filechooser');
    await page
      .getByRole('button', { name: 'Добавить изображения', exact: true })
      .click();
    await (
      await chooser
    ).setFiles([
      'e2e/fixtures/profile-photo.png',
      'e2e/fixtures/work-photo.jpg',
    ]);
    await page.getByRole('button', { name: /Загрузить \d+ фото/ }).click();
    await page
      .getByRole('button', { name: /^Повторить загрузку фото/, exact: false })
      .click();
    await expect(page.getByRole('img', { name: /^Фото \d+$/ })).toHaveCount(2);
    await expect(
      page.getByRole('button', { name: 'Продолжить', exact: true }),
    ).toBeEnabled();
    expect(
      await prisma.productImage.count({ where: { productId: work.id } }),
    ).toBe(2);
    await captureWorkStep(page, 'photos');
    await page
      .getByRole('button', { name: '3. История создания', exact: true })
      .click();
    await page.getByRole('button', { name: 'Добавить текст' }).click();
    await page
      .getByRole('textbox', { name: 'Текст истории' })
      .fill('Wizard regression draft.');
    await page.getByRole('button', { name: 'Добавить заголовок' }).click();
    await page
      .getByRole('textbox', { name: 'Заголовок истории' })
      .fill('Вторая строка');
    const paragraphBlock = page.locator('[data-editor-block="text"]').first();
    await paragraphBlock.getByRole('textbox').click();
    await paragraphBlock
      .getByRole('button', { name: 'Действия с блоком' })
      .click();
    await expect(
      paragraphBlock.getByRole('button', { name: 'Выше', exact: true }),
    ).toBeDisabled();
    await paragraphBlock
      .getByRole('button', { name: 'Ниже', exact: true })
      .click();
    await expect(
      page.locator('[data-editor-block="text"]').first().getByRole('textbox'),
    ).toHaveValue('Вторая строка');
    const storyFileChooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить изображение' }).click();
    await (await storyFileChooser).setFiles('e2e/fixtures/profile-photo.png');
    const photoBlock = page.locator('[data-editor-block="image"]');
    await photoBlock
      .getByRole('button', { name: 'Выбрать изображение истории' })
      .click();
    await expect(
      photoBlock.getByRole('button', { name: 'Действия с изображением' }),
    ).toBeVisible();
    await expect(photoBlock.getByRole('img')).toBeVisible();
    await captureWorkStep(page, 'mixed-story');
    await photoBlock
      .getByRole('button', { name: 'Действия с изображением' })
      .click();
    await expect(
      photoBlock.getByRole('button', { name: 'Ниже', exact: true }),
    ).toBeDisabled();
    const description = photoBlock.getByRole('textbox', {
      name: 'Описание фото',
      exact: true,
    });
    await description.click();
    await description.fill('Описание для проверки панели');
    await expect(description).toHaveValue('Описание для проверки панели');
    await expect(
      photoBlock.getByRole('button', { name: 'Действия с изображением' }),
    ).toHaveAttribute('aria-expanded', 'true');
    await photoBlock
      .getByRole('button', { name: 'Удалить', exact: true })
      .click();
    const headingBlock = page.locator('[data-editor-block="text"]').first();
    await headingBlock.getByRole('textbox').click();
    await headingBlock
      .getByRole('button', { name: 'Действия с блоком' })
      .focus();
    await page.keyboard.press('Enter');
    await headingBlock
      .getByRole('button', { name: 'Удалить', exact: true })
      .click();
    await expect(
      page.getByRole('textbox', { name: 'Текст истории' }),
    ).toHaveValue('Wizard regression draft.');
    await page.getByRole('button', { name: 'Закончить', exact: true }).click();
    await expect(page).toHaveURL(/step=4$/);
    await expect(
      page.getByText('Wizard regression draft.', { exact: true }),
    ).toBeVisible();
    await captureWorkStep(page, 'review');
    await page
      .getByRole('button', { name: '4. Проверка', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Отправить на модерацию', exact: true })
      .click();
    await expect(
      page.getByText('Предмет отправлен на модерацию.', { exact: true }),
    ).toBeVisible();
    const approve = async () => {
      const detail = await (
        await context.request.get(
          `${e2eApiBaseURL}/api/seller/products/${work.id}`,
        )
      ).json();
      return adminContext.request.patch(
        `${e2eApiBaseURL}/api/admin/products/${work.id}/status`,
        {
          data: {
            status: 'APPROVED',
            target: {
              kind: 'revision',
              id: detail.editingRevision.id,
              updatedAt: detail.editingRevision.updatedAt,
            },
          },
        },
      );
    };
    await fault(true);
    expect((await approve()).status()).toBe(409);
    await page.goto(`/products/${work.id}`);
    await expect(
      page.getByText('Доставка медиа не выполнена. Повторите действие.', {
        exact: true,
      }),
    ).toBeVisible();
    expect(
      (
        await guest.request.get(`${e2eApiBaseURL}/api/works/${work.publicId}`)
      ).status(),
    ).toBe(404);
    await fault(false);
    expect((await approve()).status()).toBe(200);
    await expect
      .poll(async () =>
        (
          await guest.request.get(`${e2eApiBaseURL}/api/works/${work.publicId}`)
        ).status(),
      )
      .toBe(200);
    await guest.goto(`/product/${work.publicId}`);
    await expect(guest.getByTestId('work-gallery')).toBeVisible();
    await expect
      .poll(() => cdnRequests.some((url) => url.endsWith('/preview.webp')))
      .toBe(true);
    expect(cdnRequests.some((url) => url.endsWith('/full.webp'))).toBe(false);
    await guest.emulateMedia({ reducedMotion: 'reduce' });
    await guest
      .getByRole('button', { name: 'Открыть фото 1', exact: true })
      .click();
    await expect(
      guest.getByRole('dialog').getByRole('button', { name: 'Закрыть окно' }),
    ).toBeFocused();
    await expect
      .poll(
        () => cdnRequests.filter((url) => url.endsWith('/full.webp')).length,
      )
      .toBe(1);
    const viewer = guest.getByRole('dialog');
    await viewer
      .getByRole('button', { name: 'Следующее фото в просмотре' })
      .click();
    await expect
      .poll(
        () => cdnRequests.filter((url) => url.endsWith('/full.webp')).length,
      )
      .toBe(2);
    await expect(
      viewer.getByRole('button', { name: 'Следующее фото в просмотре' }),
    ).toBeDisabled();
    for (const width of [390, 1024, 1440]) {
      await guest.setViewportSize({ width, height: 900 });
      const dialog = await guest.getByRole('dialog').boundingBox();
      expect(dialog).not.toBeNull();
      expect(dialog!.x).toBeGreaterThanOrEqual(0);
      expect(dialog!.x + dialog!.width).toBeLessThanOrEqual(width);
      expect(
        await guest.evaluate(() => document.body.scrollWidth <= innerWidth),
      ).toBe(true);
      for (const label of [
        'Предыдущее фото в просмотре',
        'Следующее фото в просмотре',
      ]) {
        const control = await viewer
          .getByRole('button', { name: label })
          .boundingBox();
        expect(control!.x).toBeGreaterThanOrEqual(dialog!.x);
        expect(control!.x + control!.width).toBeLessThanOrEqual(
          dialog!.x + dialog!.width,
        );
      }
    }
    await guest.keyboard.press('Escape');
    await expect(guest.getByRole('dialog')).toHaveCount(0);
    await expect(
      guest.getByRole('button', { name: 'Открыть фото 1', exact: true }),
    ).toBeFocused();
    const old = await (
      await guest.request.get(`${e2eApiBaseURL}/api/works/${work.publicId}`)
    ).json();
    await page.reload();
    await fillControl(
      page.getByRole('textbox', { name: 'Название *', exact: true }),
      `Revised ${suffix}`,
    );
    await page
      .getByRole('button', { name: 'Сохранить изменения', exact: true })
      .click();
    for (const remaining of [1, 0]) {
      await page
        .getByRole('button', { name: 'Удалить фото 1', exact: true })
        .click();
      await expect(page.getByRole('img', { name: /^Фото \d+$/ })).toHaveCount(
        remaining,
      );
    }
    await expect(page.getByRole('img', { name: /^Фото \d+$/ })).toHaveCount(0);
    const nextChooser = page.waitForEvent('filechooser');
    await page
      .getByRole('button', { name: 'Добавить изображения', exact: true })
      .click();
    await (await nextChooser).setFiles('e2e/fixtures/work-photo.webp');
    await page
      .getByRole('button', { name: 'Загрузить фото', exact: true })
      .click();
    await expect(page.getByRole('img', { name: /^Фото \d+$/ })).toHaveCount(1);
    await page
      .getByRole('button', { name: 'Отправить на модерацию', exact: true })
      .click();
    await expect(page.getByText('На модерации', { exact: true })).toBeVisible();
    await fault(true);
    expect((await approve()).status()).toBe(409);
    expect(
      (
        await (
          await guest.request.get(`${e2eApiBaseURL}/api/works/${work.publicId}`)
        ).json()
      ).work.title,
    ).toBe(old.work.title);
    await fault(false);
    expect((await approve()).status()).toBe(200);
    await tick();
    await expect
      .poll(
        async () =>
          (
            await (
              await guest.request.get(
                `${e2eApiBaseURL}/api/works/${work.publicId}`,
              )
            ).json()
          ).work.title,
      )
      .toBe(`Revised ${suffix}`);
    const revised = await (
      await guest.request.get(`${e2eApiBaseURL}/api/works/${work.publicId}`)
    ).json();
    expect(revised.work.images[0].url).not.toBe(old.work.images[0].url);
    await tick();
    expect(
      (
        await guest.request.get(
          `${e2eApiBaseURL}/__media?key=${encodeURIComponent(new URL(old.work.images[0].url).pathname.slice(1))}`,
        )
      ).status(),
    ).toBe(404);
    expect(
      (
        await context.request.post(
          `${e2eApiBaseURL}/api/products/${work.id}/hide`,
        )
      ).status(),
    ).toBe(201);
    await tick();
    expect(
      (
        await guest.request.get(`${e2eApiBaseURL}/api/works/${work.publicId}`)
      ).status(),
    ).toBe(404);
    await expect
      .poll(async () =>
        (
          await guest.request.get(
            `${e2eApiBaseURL}/__media?key=${encodeURIComponent(new URL(revised.work.images[0].url).pathname.slice(1))}`,
          )
        ).status(),
      )
      .toBe(404);
  } finally {
    await prisma.$disconnect();
    await guest.unrouteAll({ behavior: 'wait' });
    await guest.close();
    await context.close();
    await adminContext.close();
  }
});

test('shows a partial gallery upload and retries only the unfinished photo', async ({
  browser,
}, testInfo) => {
  const { seller, categoryId } = await createSellerFixture();
  const { context, page } = await authenticatedPage(browser, seller);
  try {
    const created = await context.request.post(
      `${e2eApiBaseURL}/api/products`,
      { data: { title: 'Photo upload browser check', categoryId } },
    );
    expect(created.status()).toBe(201);
    const { product } = await created.json();
    let attempts = 0;
    const keys: string[] = [];
    await page.route(`**/api/products/${product.id}/images`, async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      attempts += 1;
      keys.push(route.request().headers()['idempotency-key']!);
      if (attempts === 2)
        return route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 503,
            message: 'Image processing is busy; retry later',
          }),
        });
      return route.continue();
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/products/${product.id}?flow=creation&step=2`);
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить изображения' }).click();
    const png = readFileSync('e2e/fixtures/profile-photo.png');
    await (
      await chooser
    ).setFiles([
      {
        name: 'large.png',
        mimeType: 'image/png',
        buffer: Buffer.concat([png, Buffer.alloc(7 * 1024 * 1024)]),
      },
      { name: 'second.png', mimeType: 'image/png', buffer: png },
    ]);
    await page.getByRole('button', { name: /Загрузить \d+ фото/ }).click();
    await expect(
      page.getByRole('button', { name: /^Повторить загрузку фото/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('img', { name: 'Фото 1', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('img', { name: /^Фото \d+$/ })).toHaveCount(2);
    await expect(
      page.getByRole('button', { name: 'Добавить изображения', exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole('button', {
        name: 'Продолжить',
        exact: true,
      }),
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: '3. История создания', exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: '4. Проверка', exact: true }),
    ).toBeDisabled();
    for (const width of [320, 390, 414, 440, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
      const preview = page.getByRole('img', {
        name: 'Фото 2',
        exact: true,
      });
      await expect(preview).toBeVisible();
      for (const name of ['Повторить загрузку фото 2', 'Удалить фото 2']) {
        const action = page.getByRole('button', { name, exact: true });
        await expect(action).toBeInViewport();
        const bounds = await action.boundingBox();
        const imageBounds = await preview.boundingBox();
        expect(bounds?.y).toBeGreaterThanOrEqual(imageBounds!.y);
        expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(
          imageBounds!.y + imageBounds!.height,
        );
        expect(bounds?.x).toBeGreaterThanOrEqual(0);
        expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(
          width,
        );
      }
      await page.screenshot({
        path: testInfo.outputPath(`upload-partial-${width}.png`),
        fullPage: true,
      });
      await photoEvidence(page, `partial-error-${width}`);
    }
    let releaseCheck!: () => void;
    const checkGate = new Promise<void>((resolve) => {
      releaseCheck = resolve;
    });
    await page.route(
      `**/api/products/${product.id}/image-operations/**`,
      async (route) => {
        await checkGate;
        await route.continue();
      },
    );
    await page
      .getByRole('button', { name: /^Повторить загрузку фото/ })
      .click();
    await expect(page.getByText('Подготовка', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^Повторить загрузку фото/ }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Добавить изображения' }),
    ).toBeDisabled();
    await photoEvidence(page, 'retry-reconciling-390');
    for (const frame of [1, 2, 3]) {
      await page.screenshot({
        path: resolve(
          e2eEvidenceDir,
          `2026-10-27-photo-review/${test.info().project.name}-retry-frame-${frame}.png`,
        ),
      });
      await page.waitForTimeout(80);
    }
    releaseCheck();
    await expect(page.getByRole('img', { name: /^Фото \d+$/ })).toHaveCount(2);
    await expect(
      page.getByRole('img', { name: 'Фото 2', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Добавить изображения', exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole('button', { name: 'Продолжить', exact: true }),
    ).toBeEnabled();
    await page.setViewportSize({ width: 390, height: 874 });
    await photoEvidence(page, 'retry-success-390');
    expect(attempts).toBe(3);
    expect(keys[2]).toBe(keys[1]);
    expect(keys[1]).not.toBe(keys[0]);
    await expect(
      page.getByRole('button', { name: 'Продолжить', exact: true }),
    ).toBeEnabled();
    await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
    await expect(page).toHaveURL(/step=3/);
  } finally {
    await context.close();
  }
});

test('uploads a mixed JPEG PNG WebP selection and renders every saved photo', async ({
  browser,
}) => {
  const { seller, categoryId } = await createSellerFixture();
  const { context, page } = await authenticatedPage(browser, seller);
  try {
    const created = await context.request.post(
      `${e2eApiBaseURL}/api/products`,
      {
        data: { title: 'Mixed photo formats', categoryId },
      },
    );
    expect(created.status()).toBe(201);
    const { product } = await created.json();
    const requests: string[] = [];
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        request.url().endsWith(`/products/${product.id}/images`)
      ) {
        requests.push(request.headers()['idempotency-key']!);
      }
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/products/${product.id}?flow=creation&step=2`);
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить изображения' }).click();
    await (
      await chooser
    ).setFiles([
      'e2e/fixtures/work-photo.jpg',
      'e2e/fixtures/profile-photo.png',
      'e2e/fixtures/work-photo.webp',
    ]);
    await expect(
      page.getByRole('button', { name: /Загрузить 3 фото/ }),
    ).toBeVisible();
    await page.getByRole('button', { name: /Загрузить 3 фото/ }).click();
    await expect(page.getByRole('img', { name: /^Фото \d+$/ })).toHaveCount(3);
    await expect(
      page.getByRole('img', { name: 'Фото 3', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Назад', exact: true }),
    ).toBeEnabled();
    for (const index of [1, 2, 3]) {
      const preview = page.locator(`[aria-label="Фото ${index}"] img`);
      await expect(preview).toBeVisible();
      await expect
        .poll(() =>
          preview.evaluate((node) => {
            const image = node as HTMLImageElement;
            return (
              image.complete &&
              image.naturalWidth > 0 &&
              image.naturalHeight > 0
            );
          }),
        )
        .toBe(true);
    }
    await expect(
      page.getByRole('button', { name: 'Продолжить', exact: true }),
    ).toBeEnabled();
    await page
      .getByRole('button', { name: 'Редактировать фото 1', exact: true })
      .click();
    await expect(
      page.getByText('Настроить фото', { exact: true }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Повернуть 90°', exact: true })
      .click();
    await page.getByRole('button', { name: 'Отразить', exact: true }).click();
    await page.getByRole('button', { name: 'Сбросить', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('button', { name: 'Редактировать фото 1', exact: true }),
    ).toBeFocused();
    await page
      .getByRole('button', { name: 'Редактировать фото 1', exact: true })
      .click();
    await page.getByRole('tab', { name: 'Кадрировать', exact: true }).click();
    const crop = page.getByRole('group', { name: /^Кадрирование:/ });
    await crop.focus();
    await page.keyboard.press('Alt+ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await captureWorkStep(page, 'photo-editor');
    await page.getByRole('button', { name: 'Готово', exact: true }).click();
    await page
      .getByRole('button', { name: 'Загрузить 1 фото', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Продолжить', exact: true }),
    ).toBeEnabled();
    expect(requests).toHaveLength(3);
    expect(new Set(requests).size).toBe(3);
    await page.reload();
    await expect(page.getByRole('img', { name: /^Фото \d+$/ })).toHaveCount(3);
  } finally {
    await context.close();
  }
});

async function photoEvidence(page: Page, name: string) {
  const directory = resolve(e2eEvidenceDir, '2026-10-27-photo-review');
  await mkdir(directory, { recursive: true });
  if (!name.startsWith('last-row'))
    await page.getByTestId('form-page').evaluate((node) => {
      node.scrollTop = 0;
    });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .filter(
          (animation) => animation.effect?.getTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
  await expect
    .poll(() =>
      page
        .locator('.advanced-cropper-fade--visible')
        .evaluateAll((nodes) =>
          nodes.every((node) => getComputedStyle(node).opacity === '1'),
        ),
    )
    .toBe(true);
  await page.screenshot({
    path: resolve(directory, `${test.info().project.name}-${name}.png`),
    // Exclude Expo development chrome only; product content is unchanged.
    style: '.__expo_fast_refresh { visibility: hidden; }',
  });
}

async function failNextPhotoRender(page: Page) {
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function () {
      HTMLCanvasElement.prototype.toBlob = original;
      throw new Error('Synthetic photo processing failure');
    };
  });
}

test('photo editor retains settings on Work and avatar preparation failure and records all photo states', async ({
  browser,
}) => {
  const { seller, categoryId } = await createSellerFixture();
  const { context, page } = await authenticatedPage(browser, seller);
  let releaseUpload: () => void = () => undefined;
  try {
    await page.setViewportSize({ width: 390, height: 874 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const response = await context.request.post(
      `${e2eApiBaseURL}/api/products`,
      { data: { title: 'Photo review', categoryId } },
    );
    expect(response.status()).toBe(201);
    const { product } = await response.json();
    await page.goto(`/products/${product.id}?flow=creation&step=2`);
    const picker = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить изображения' }).click();
    await (
      await picker
    ).setFiles(
      [1, 2, 3, 4, 5].map((i) => `e2e/fixtures/portfolio-photo-${i}.png`),
    );
    await expect(
      page.getByRole('button', { name: 'Загрузить 5 фото' }),
    ).toBeEnabled();
    await photoEvidence(page, 'preparation-390');
    for (const height of [874, 600]) {
      await page.setViewportSize({ width: 390, height });
      const last = page.getByRole('button', {
        name: 'Удалить фото 5',
        exact: true,
      });
      await page.getByTestId('form-page').evaluate((node) => {
        node.scrollTop = node.scrollHeight;
      });
      await expect(last).toBeInViewport();
      const bounds = await last.boundingBox();
      const cta = await page
        .getByRole('button', { name: 'Загрузить 5 фото' })
        .boundingBox();
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(cta!.y);
      await photoEvidence(page, `last-row-long-${height}`);
    }
    await page.setViewportSize({ width: 390, height: 874 });

    await page
      .getByRole('button', { name: 'Редактировать фото 2', exact: true })
      .click();
    const hiddenCrop = page.getByRole('group', {
      name: /^Кадрирование:/,
      includeHidden: true,
    });
    await expect(hiddenCrop).toHaveCSS('opacity', '0');
    await expect(hiddenCrop).toHaveAttribute('inert', '');
    await photoEvidence(page, 'editor-original-390');
    for (const height of [420, 600]) {
      await page.setViewportSize({ width: 390, height });
      await expect(
        page.getByRole('button', { name: 'Готово', exact: true }),
      ).toBeInViewport();
      await page
        .getByRole('button', { name: 'Сбросить' })
        .scrollIntoViewIfNeeded();
      const tool = await page
        .getByRole('button', { name: 'Сбросить' })
        .boundingBox();
      const action = await page
        .getByRole('button', { name: 'Готово', exact: true })
        .boundingBox();
      expect(tool!.y + tool!.height).toBeLessThanOrEqual(action!.y);
    }
    await page.setViewportSize({ width: 390, height: 874 });
    await page.evaluate(() => {
      document.body.style.zoom = '2';
    });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await expect(
      page.getByRole('button', { name: 'Готово', exact: true }),
    ).toBeInViewport();
    await photoEvidence(page, 'editor-zoom-200');
    await page.evaluate(() => {
      document.body.style.zoom = '';
    });
    await page.getByRole('tab', { name: 'Кадрировать', exact: true }).click();
    await expect(
      page.getByRole('tab', { name: 'Кадрировать', exact: true }),
    ).toHaveAttribute('aria-selected', 'true');
    const frame = page.getByRole('group', { name: /^Кадрирование:/ });
    await page.getByRole('tab', { name: 'Кадрировать', exact: true }).focus();
    // Safari's Tab targets follow system preferences; enter keyboard modality first.
    await page.keyboard.press('Tab');
    await frame.focus();
    await page.keyboard.press('ArrowRight');
    await expect(frame).toBeFocused();
    await expect(frame).toHaveCSS('outline-style', 'solid');
    await photoEvidence(page, 'editor-keyboard-focus-390');
    await page.getByText('Настроить фото', { exact: true }).click();
    await photoEvidence(page, 'editor-390');
    for (const width of [1024, 1440]) {
      await page.setViewportSize({ width, height: 874 });
      await photoEvidence(page, `editor-${width}`);
    }
    await page.setViewportSize({ width: 390, height: 874 });
    await page.getByRole('button', { name: 'Повернуть 90°' }).click();
    await photoEvidence(page, 'editor-rotated-390');
    await page.getByRole('button', { name: 'Отразить' }).click();
    await photoEvidence(page, 'editor-flipped-390');
    await page.getByRole('button', { name: 'Сбросить' }).click();
    await photoEvidence(page, 'editor-reset-390');
    await page.getByRole('button', { name: 'Повернуть 90°' }).click();
    await failNextPhotoRender(page);
    await page.getByRole('button', { name: 'Готово', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText(
      'Не удалось обработать выбранное фото.',
    );
    await expect(
      page.getByText('Настроить фото', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Готово', exact: true }),
    ).toBeEnabled();
    await photoEvidence(page, 'editor-processing-error-390');
    await page.getByRole('button', { name: 'Готово', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Загрузить 5 фото' }),
    ).toBeEnabled();
    await page
      .getByRole('button', { name: 'Удалить фото 5', exact: true })
      .click();
    let calls = 0;
    const gate = new Promise<void>((resolve) => {
      releaseUpload = resolve;
    });
    await page.route(`**/api/products/${product.id}/images`, async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      calls += 1;
      if (calls === 2)
        return route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Fixture failure' }),
        });
      if (calls === 4) await gate;
      await route.continue();
    });
    await page.getByRole('button', { name: 'Загрузить 4 фото' }).click();
    await expect(
      page.getByRole('button', { name: 'Повторить загрузку фото 2' }),
    ).toBeVisible();
    await expect.poll(() => calls).toBe(4);
    await expect(page.getByText('Загрузка', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Продолжить', exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole('button', {
        name: 'Отбросить локальные изменения',
        exact: true,
      }),
    ).toHaveCount(0);
    await photoEvidence(page, 'upload-error-390');
    releaseUpload();
    await expect(
      page.getByRole('button', { name: 'Добавить изображения' }),
    ).toBeEnabled();
    await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
    const discardDialog = page.getByRole('dialog', {
      name: 'Отбросить локальные изменения фото?',
    });
    await expect(discardDialog).toBeVisible();
    await photoEvidence(page, 'discard-confirmation-390');
    await discardDialog
      .getByRole('button', { name: 'Продолжить редактирование', exact: true })
      .click();
    await expect(discardDialog).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Повторить загрузку фото 2' }),
    ).toBeVisible();
    for (const height of [874, 600]) {
      await page.setViewportSize({ width: 390, height });
      await page
        .getByRole('button', { name: 'Удалить фото 4' })
        .scrollIntoViewIfNeeded();
      const last = await page
        .getByRole('button', { name: 'Удалить фото 4' })
        .boundingBox();
      const cta = await page
        .getByRole('button', { name: 'Продолжить' })
        .boundingBox();
      expect(last!.y + last!.height).toBeLessThanOrEqual(cta!.y);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await photoEvidence(page, `last-row-${height}`);
    }
    await page.setViewportSize({ width: 390, height: 874 });
    await photoEvidence(page, 'upload-error-idle-390');
    await page.goto('/profile');
    await page.goto(`/products/${product.id}?flow=creation&step=2`);
    await expect(page.getByRole('img', { name: /^Фото \d+$/ })).toHaveCount(3);
    await expect(
      page.getByRole('button', { name: /^Повторить загрузку фото/ }),
    ).toHaveCount(0);
    await photoEvidence(page, 'after-reload-server-gallery-390');
    await page.goto(`/products/${product.id}`);
    await page
      .getByRole('button', { name: 'Редактировать фото 1', exact: true })
      .click();
    await page.setViewportSize({ width: 390, height: 420 });
    await expect(
      page.getByRole('button', { name: 'Готово', exact: true }),
    ).toBeInViewport();
    await page
      .getByRole('button', { name: 'Сбросить' })
      .scrollIntoViewIfNeeded();
    await photoEvidence(page, 'existing-draft-editor-short-390');
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('button', { name: 'Редактировать фото 1', exact: true }),
    ).toBeFocused();
    await page.goto('/profile');
    await page.setViewportSize({ width: 390, height: 874 });
    const avatarPicker = page.waitForEvent('filechooser');
    await page
      .getByRole('button', { name: 'Изменить фото', exact: true })
      .click();
    await (await avatarPicker).setFiles('e2e/fixtures/author-portrait.png');
    await expect(
      page.getByText('Фотография автора', { exact: true }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page
          .getByRole('img', { name: 'Превью фото автора' })
          .locator('img')
          .evaluate((img: HTMLImageElement) => ({
            loaded: img.complete && img.naturalWidth > 0,
            width: img.getBoundingClientRect().width,
            height: img.getBoundingClientRect().height,
          })),
      )
      .toMatchObject({ loaded: true });
    await photoEvidence(page, 'avatar-390');
    await page.setViewportSize({ width: 390, height: 420 });
    await expect(
      page.getByRole('button', { name: 'Установить фото' }),
    ).toBeInViewport();
    await page
      .getByText('Как будет выглядеть в профиле', { exact: true })
      .scrollIntoViewIfNeeded();
    const previewBox = await page
      .getByText('Как будет выглядеть в профиле', { exact: true })
      .boundingBox();
    const avatarActionBox = await page
      .getByRole('button', { name: 'Установить фото' })
      .boundingBox();
    expect(previewBox!.y + previewBox!.height).toBeLessThanOrEqual(
      avatarActionBox!.y,
    );
    await page.setViewportSize({ width: 390, height: 874 });
    await page.getByRole('button', { name: 'Повернуть 90°' }).click();
    await photoEvidence(page, 'avatar-rotated-390');
    await failNextPhotoRender(page);
    await page.getByRole('button', { name: 'Установить фото' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(
      page.getByText('Фотография автора', { exact: true }),
    ).toBeVisible();
    await photoEvidence(page, 'avatar-processing-error-390');
    await page.getByRole('button', { name: 'Установить фото' }).click();
    await expect(
      page.getByText('Фотография автора', { exact: true }),
    ).not.toBeVisible();
    await photoEvidence(page, 'avatar-saved-390');
  } finally {
    releaseUpload();
    await context.close();
  }
});

test('records photo selection, limits, upload and order confirmation states', async ({
  browser,
}) => {
  const { seller, categoryId } = await createSellerFixture();
  const { context, page } = await authenticatedPage(browser, seller);
  let releaseUpload = () => {};
  let releaseOrder = () => {};
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const created = await context.request.post(
      `${e2eApiBaseURL}/api/products`,
      {
        data: { title: 'Photo state review', categoryId },
      },
    );
    expect(created.status()).toBe(201);
    const { product } = await created.json();
    await page.goto(`/products/${product.id}?flow=creation&step=2`);
    for (const width of [390, 1024, 1440]) {
      await page.setViewportSize({ width, height: 874 });
      await expect(
        page.getByRole('button', { name: 'Добавить изображения' }),
      ).toBeVisible();
      await photoEvidence(page, `empty-${width}`);
    }
    await page.setViewportSize({ width: 390, height: 874 });
    let chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить изображения' }).click();
    await expect(
      page.getByRole('button', { name: 'Добавить изображения' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Добавить изображения' }),
    ).toBeDisabled();
    await (await chooser).setFiles('e2e/fixtures/portfolio-photo-1.png');
    await expect(
      page.getByRole('button', { name: 'Загрузить 1 фото' }),
    ).toBeEnabled();
    await photoEvidence(page, 'one-local-390');
    const firstBeforePicker = await page
      .locator('[data-photo-id]')
      .first()
      .boundingBox();
    const addBeforePicker = await page
      .getByRole('button', { name: 'Добавить изображения' })
      .boundingBox();
    const cancelledPicker = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить изображения' }).click();
    const cancelled = await cancelledPicker;
    expect(await page.locator('[data-photo-id]').first().boundingBox()).toEqual(
      firstBeforePicker,
    );
    expect(
      await page
        .getByRole('button', { name: 'Добавить изображения' })
        .boundingBox(),
    ).toEqual(addBeforePicker);
    await cancelled.element().dispatchEvent('cancel');
    await expect(
      page.getByRole('button', { name: 'Добавить изображения' }),
    ).toBeEnabled();
    expect(await page.locator('[data-photo-id]').first().boundingBox()).toEqual(
      firstBeforePicker,
    );
    chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить изображения' }).click();
    await expect(
      page.getByRole('button', { name: 'Добавить изображения' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Добавить изображения' }),
    ).toBeDisabled();
    await (await chooser).setFiles('e2e/fixtures/portfolio-photo-1.png');
    await expect(
      page.getByText('Фото уже добавлено.', { exact: true }),
    ).toBeVisible();
    await photoEvidence(page, 'duplicate-390');
    chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить изображения' }).click();
    await (
      await chooser
    ).setFiles({
      name: 'empty.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(0),
    });
    await expect(
      page.getByText('Не удалось загрузить фото', { exact: true }),
    ).toBeVisible();
    await photoEvidence(page, 'unreadable-source-390');
    await page
      .getByRole('button', { name: 'Удалить фото 2', exact: true })
      .click();
    chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить изображения' }).click();
    await (
      await chooser
    ).setFiles(
      Array.from({ length: 9 }, (_, i) => ({
        name: `unique-${i}.png`,
        mimeType: 'image/png',
        buffer: Buffer.concat([
          readFileSync(`e2e/fixtures/portfolio-photo-${(i % 5) + 1}.png`),
          Buffer.from([i]),
        ]),
      })),
    );
    await expect(
      page.getByRole('button', { name: 'Загрузить 10 фото' }),
    ).toBeEnabled();
    await expect(
      page.getByRole('button', { name: 'Добавить изображения' }),
    ).toHaveCount(0);
    await photoEvidence(page, 'limit-ten-390');
    await page.getByTestId('form-page').evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    await photoEvidence(page, 'last-row-limit-ten-390');
    const gate = new Promise<void>((resolve) => {
      releaseUpload = resolve;
    });
    let first = true;
    await page.route(`**/api/products/${product.id}/images`, async (route) => {
      if (route.request().method() === 'POST' && first) {
        first = false;
        await gate;
      }
      await route.continue();
    });
    await page.route(
      `**/api/products/${product.id}/images/order`,
      async (route) => {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Synthetic order save outage' }),
        });
      },
    );
    await page.getByRole('button', { name: 'Загрузить 10 фото' }).click();
    await expect(page.getByText('Загрузка', { exact: true })).toBeVisible();
    await photoEvidence(page, 'uploading-390');
    releaseUpload();
    await expect(
      page.getByRole('button', { name: 'Сохранить порядок', exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByText('Не удалось сохранить порядок', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText('Не удалось загрузить фото', { exact: true }),
    ).toHaveCount(0);
    await photoEvidence(page, 'order-save-error-390');
    await page.getByTestId('form-page').evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    await photoEvidence(page, 'last-row-order-save-error-390');
    await page.unroute(`**/api/products/${product.id}/images/order`);
    const orderGate = new Promise<void>((resolve) => {
      releaseOrder = resolve;
    });
    await page.route(
      `**/api/products/${product.id}/images/order`,
      async (route) => {
        await orderGate;
        await route.continue();
      },
    );
    await page
      .getByRole('button', { name: 'Сохранить порядок', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Продолжить', exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByText('Сохранение порядка', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Загрузка', { exact: true })).toHaveCount(0);
    await photoEvidence(page, 'order-saving-390');
    releaseOrder();
    await expect(
      page.getByRole('button', { name: 'Продолжить', exact: true }),
    ).toBeEnabled();
    await photoEvidence(page, 'all-saved-390');
    await page
      .getByRole('button', { name: 'Удалить фото 1', exact: true })
      .click();
    await expect(
      page.getByText('Загружено 9 из 9', { exact: true }),
    ).toBeVisible();
    await photoEvidence(page, 'primary-deleted-390');
  } finally {
    releaseUpload();
    releaseOrder();
    await context.close();
  }
});

test('previews photo insertion, cancels it and commits only on drop with keyboard alternatives', async ({
  browser,
}) => {
  const { seller, categoryId } = await createSellerFixture();
  const { context, page } = await authenticatedPage(browser, seller);
  try {
    await page.setViewportSize({ width: 390, height: 874 });
    const response = await context.request.post(
      `${e2eApiBaseURL}/api/products`,
      {
        data: { title: 'Photo sorting', categoryId },
      },
    );
    expect(response.status()).toBe(201);
    const { product } = await response.json();
    await page.goto(`/products/${product.id}?flow=creation&step=2`);
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить изображения' }).click();
    await (
      await chooser
    ).setFiles([1, 2, 3].map((i) => `e2e/fixtures/portfolio-photo-${i}.png`));
    const tiles = page.locator('[data-photo-id]');
    await expect(tiles).toHaveCount(3);
    const ids = await tiles.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-photo-id')),
    );
    const source = page.locator(`[data-photo-id="${ids[0]}"]`);
    const target = page.locator(`[data-photo-id="${ids[2]}"]`);
    const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
    const bounds = await target.boundingBox();
    const hover = {
      dataTransfer,
      clientX: bounds!.x + bounds!.width / 2,
      clientY: bounds!.y + bounds!.height / 2,
    };
    await source.dispatchEvent('dragstart', { dataTransfer });
    await target.dispatchEvent('dragover', hover);
    for (const frame of [1, 2, 3]) {
      await page.screenshot({
        path: resolve(
          e2eEvidenceDir,
          `2026-10-27-photo-review/${test.info().project.name}-drag-frame-${frame}.png`,
        ),
      });
      await page.waitForTimeout(80);
    }
    await expect(source).toHaveCSS('opacity', '0.35');
    await expect
      .poll(() =>
        tiles.nth(1).evaluate((node) => getComputedStyle(node).transform),
      )
      .not.toBe('matrix(1, 0, 0, 1, 0, 0)');
    await photoEvidence(page, 'drag-insertion-390');
    await source.dispatchEvent('dragend', { dataTransfer });
    await expect(source).toHaveCSS('opacity', '1');
    await expect
      .poll(() =>
        tiles.nth(1).evaluate((node) => getComputedStyle(node).transform),
      )
      .toBe('matrix(1, 0, 0, 1, 0, 0)');
    expect(
      await tiles.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute('data-photo-id')),
      ),
    ).toEqual(ids);
    await source.dispatchEvent('dragstart', { dataTransfer });
    await target.dispatchEvent('dragover', hover);
    await target.dispatchEvent('drop', hover);
    await expect
      .poll(() =>
        tiles.evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute('data-photo-id')),
        ),
      )
      .toEqual([ids[1], ids[2], ids[0]]);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await tiles.nth(0).focus();
    await page.keyboard.press('Alt+ArrowRight');
    await expect
      .poll(() =>
        tiles.evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute('data-photo-id')),
        ),
      )
      .toEqual([ids[2], ids[1], ids[0]]);
    await expect(page.locator(`[data-photo-id="${ids[1]}"]`)).toBeFocused();
    expect(
      await tiles
        .nth(0)
        .evaluate((node) => getComputedStyle(node).transitionDuration),
    ).toBe('0s');
    if (test.info().project.name === 'chromium') {
      const cdp = await context.newCDPSession(page);
      await page.setViewportSize({ width: 390, height: 420 });
      const first = await tiles.nth(0).boundingBox();
      const x = first!.x + first!.width / 2;
      const y = first!.y + 60;
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x, y }],
      });
      await page.waitForTimeout(300);
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y: 330 }],
      });
      await expect
        .poll(() =>
          page.getByTestId('form-page').evaluate((node) => node.scrollTop),
        )
        .toBeGreaterThan(0);
      await photoEvidence(page, 'touch-drag-scroll-390');
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchCancel',
        touchPoints: [],
      });
      await expect
        .poll(() =>
          tiles.evaluateAll((nodes) =>
            nodes.map((node) => node.getAttribute('data-photo-id')),
          ),
        )
        .toEqual([ids[2], ids[1], ids[0]]);
      await page.setViewportSize({ width: 390, height: 874 });
      await page.getByTestId('form-page').evaluate((node) => {
        node.scrollTop = 0;
      });
      await cdp.detach();
    }
    const edit = page.getByRole('button', {
      name: 'Редактировать фото 1',
      exact: true,
    });
    expect(
      await edit.evaluate((node) =>
        node.dispatchEvent(
          new DragEvent('dragstart', {
            bubbles: true,
            cancelable: true,
            dataTransfer: new DataTransfer(),
          }),
        ),
      ),
    ).toBe(false);
    await expect(page.getByText('Настроить фото', { exact: true })).toHaveCount(
      0,
    );
  } finally {
    await context.close();
  }
});

test('mouse drop commits over the vacant slot, grid gap and add slot, and cancels outside', async ({
  browser,
}) => {
  const { seller, categoryId } = await createSellerFixture();
  const { context, page } = await authenticatedPage(browser, seller, {
    dir: resolve(e2eEvidenceDir, '2026-10-27-photo-drag-final'),
    size: { width: 390, height: 874 },
  });
  try {
    await page.setViewportSize({ width: 390, height: 874 });
    const response = await context.request.post(
      `${e2eApiBaseURL}/api/products`,
      { data: { title: 'Mouse drop areas', categoryId } },
    );
    expect(response.status()).toBe(201);
    const { product } = await response.json();
    await page.goto(`/products/${product.id}?flow=creation&step=2`);
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить изображения' }).click();
    await (
      await chooser
    ).setFiles([1, 2, 3].map((i) => `e2e/fixtures/portfolio-photo-${i}.png`));
    const tiles = page.locator('[data-photo-id]');
    await expect(tiles).toHaveCount(3);
    const ids = () =>
      tiles.evaluateAll((nodes) =>
        nodes.map((n) => n.getAttribute('data-photo-id')),
      );
    const initial = await ids();
    const slots = await tiles.evaluateAll((nodes) =>
      nodes.map((n) => {
        const r = n.parentElement!.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }),
    );
    let requests = 0;
    page.on('request', (request) => {
      if (request.url().includes('/images/order')) requests++;
    });
    const dragTo = async (x: number, y: number) => {
      const box = await tiles.nth(0).boundingBox();
      await page.mouse.move(box!.x + 60, box!.y + 60);
      await page.mouse.down();
      await page.mouse.move(box!.x + 75, box!.y + 65, { steps: 5 });
      await page.mouse.move(x, y, { steps: 20 });
      await page.mouse.move(x + 1, y + 1);
      await expect(tiles.nth(0)).toHaveCSS('opacity', '0.35');
      // Hold the real drag so the recording shows its insertion preview.
      await page.waitForTimeout(400);
    };
    const last = slots[2]!;
    await dragTo(last.x + last.width / 2, last.y + last.height / 2);
    expect(await ids()).toEqual(initial);
    await expect
      .poll(() => tiles.nth(1).evaluate((n) => getComputedStyle(n).transform))
      .not.toBe('matrix(1, 0, 0, 1, 0, 0)');
    await page.mouse.up();
    await expect.poll(ids).toEqual([initial[1], initial[2], initial[0]]);
    const gapX = slots[0]!.x + slots[0]!.width + 6;
    await dragTo(gapX, slots[0]!.y + 100);
    await page.mouse.up();
    await expect.poll(ids).toEqual([initial[2], initial[1], initial[0]]);
    const add = await page
      .getByRole('button', { name: 'Добавить изображения' })
      .boundingBox();
    await dragTo(add!.x + add!.width / 2, add!.y + add!.height / 2);
    await page.mouse.up();
    await expect.poll(ids).toEqual([initial[1], initial[0], initial[2]]);
    await dragTo(last.x + last.width / 2, last.y + last.height / 2);
    await page.mouse.move(2, 20, { steps: 10 });
    await page.mouse.up();
    await expect.poll(ids).toEqual([initial[1], initial[0], initial[2]]);
    expect(requests).toBe(0);
  } finally {
    const video = page.video();
    await context.close();
    await video?.saveAs(
      resolve(
        e2eEvidenceDir,
        `2026-10-27-photo-drag-final/${test.info().project.name}-mouse-drop.webm`,
      ),
    );
  }
});

test('keeps photo status geometry stable and story controls attached to their block', async ({
  browser,
}) => {
  const { seller, categoryId } = await createSellerFixture();
  const { context, page } = await authenticatedPage(browser, seller);
  let releaseImages: () => void = () => undefined;
  const imageGate = new Promise<void>((resolveGate) => {
    releaseImages = resolveGate;
  });
  let releaseUpload: () => void = () => undefined;
  const uploadGate = new Promise<void>((resolveGate) => {
    releaseUpload = resolveGate;
  });
  let failImageReads = false;
  try {
    await page.setViewportSize({ width: 390, height: 874 });
    const created = await context.request.post(
      `${e2eApiBaseURL}/api/products`,
      { data: { title: 'Stable photo and story controls', categoryId } },
    );
    expect(created.status()).toBe(201);
    const { product } = await created.json();
    await page.goto(`/products/${product.id}?flow=creation&step=2`);
    const choose = async (files: string[]) => {
      const picker = page.waitForEvent('filechooser');
      await page
        .getByRole('button', { name: 'Добавить изображения', exact: true })
        .click();
      await (await picker).setFiles(files);
    };
    await choose([
      'e2e/fixtures/portfolio-photo-1.png',
      'e2e/fixtures/portfolio-photo-2.png',
    ]);
    await expect(page.locator('[data-photo-id]')).toHaveCount(2);
    const gridBefore = await page.getByTestId('photo-grid').boundingBox();
    await choose(['e2e/fixtures/portfolio-photo-1.png']);
    await expect(page.getByRole('alert')).toContainText('Фото уже добавлено');
    await expect(page.getByRole('alert')).not.toContainText(
      'Не удалось выбрать',
    );
    await expect(page.locator('[data-photo-id]')).toHaveCount(2);
    await page.route('**/api/products/*/images', async (route) => {
      if (route.request().method() === 'POST') await uploadGate;
      await route.continue();
    });
    const statusBefore = await page.getByTestId('photo-status').boundingBox();
    await page.route(/\/api\/images\/[^/?]+(?:\?.*)?$/, async (route) => {
      if (route.request().method() === 'GET') {
        await imageGate;
        if (failImageReads) {
          await route.abort('failed');
          return;
        }
      }
      await route.continue();
    });
    const followupDir = resolve(
      e2eEvidenceDir,
      '2026-10-27-photo-story-followup',
    );
    await mkdir(followupDir, { recursive: true });
    await page
      .getByRole('button', { name: 'Загрузить 2 фото', exact: true })
      .click();
    await expect(page.getByTestId('photo-status')).toHaveText(
      'Загрузка фотографий',
    );
    expect(
      (await page.getByTestId('photo-status').boundingBox())!.height,
    ).toBeCloseTo(statusBefore!.height, 1);
    expect((await page.getByTestId('photo-grid').boundingBox())!.y).toBeCloseTo(
      gridBefore!.y,
      1,
    );
    await page.screenshot({
      path: resolve(followupDir, `${test.info().project.name}-sending-390.png`),
    });
    releaseUpload();
    await expect(
      page.getByText('Загрузка', { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('img', { name: 'Локальное превью фото', exact: true }),
    ).toHaveCount(2);
    await page.screenshot({
      path: resolve(followupDir, `${test.info().project.name}-loading-390.png`),
    });
    const gridDuring = await page.getByTestId('photo-grid').boundingBox();
    expect(gridDuring!.y).toBeCloseTo(gridBefore!.y, 1);
    failImageReads = true;
    releaseImages();
    const cards = page.locator('[data-photo-id]');
    await expect(
      cards.nth(0).getByRole('button', { name: 'Повторить', exact: true }),
    ).toBeVisible({ timeout: 20000 });
    await expect(
      cards.nth(1).getByRole('button', { name: 'Повторить', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Загрузка', { exact: true })).toHaveCount(0);
    failImageReads = false;
    await cards
      .nth(0)
      .getByRole('button', { name: 'Повторить', exact: true })
      .click();
    await cards
      .nth(1)
      .getByRole('button', { name: 'Повторить', exact: true })
      .click();
    await expect(
      page.getByRole('img', { name: 'Локальное превью фото', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Продолжить', exact: true }),
    ).toBeEnabled();
    expect((await page.getByTestId('photo-grid').boundingBox())!.y).toBeCloseTo(
      gridBefore!.y,
      1,
    );
    await page
      .getByRole('button', { name: '3. История создания', exact: true })
      .click();
    await expect(
      page.getByRole('textbox', { name: 'Текст истории', exact: true }),
    ).toHaveCount(1);
    await expect(
      page.getByRole('button', { name: 'Пропустить', exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: resolve(
        followupDir,
        `${test.info().project.name}-empty-story-390.png`,
      ),
    });
    await expect(
      page.getByRole('button', { name: 'Назад к изображениям', exact: true }),
    ).toHaveCount(1); // Header arrow only.
    await expect(
      page.getByRole('button', { name: /Из галереи:|Загрузить новое фото/ }),
    ).toHaveCount(0);
    const paragraph = page.getByRole('textbox', {
      name: 'Текст истории',
      exact: true,
    });
    await expect(
      page.getByText('Начните создавать тут', { exact: true }),
    ).toHaveCount(0);
    const initialInput = await paragraph.elementHandle();
    await paragraph.click();
    await paragraph.pressSequentially('А');
    expect(
      await initialInput!.evaluate(
        (el) => el.isConnected && el === document.activeElement,
      ),
    ).toBe(true);
    await paragraph.pressSequentially('БВ');
    await paragraph.press('ArrowLeft');
    await paragraph.pressSequentially('!');
    await expect(paragraph).toHaveValue('АБ!В');
    expect(
      await initialInput!.evaluate((el) => ({
        connected: el.isConnected,
        caret: (el as HTMLTextAreaElement).selectionStart,
      })),
    ).toEqual({ connected: true, caret: 3 });
    await paragraph.fill('   ');
    await expect(
      page.getByRole('button', { name: 'Пропустить', exact: true }),
    ).toBeVisible();
    expect(
      await initialInput!.evaluate(
        (el) => el.isConnected && el === document.activeElement,
      ),
    ).toBe(true);

    await paragraph.fill(
      'Первая строка\nВторая строка\nТретья строка\nЧетвёртая строка\nПятая строка\nШестая строка',
    );
    await expect(paragraph).toBeFocused();
    const textSize = await paragraph.evaluate((el) => ({
      height: el.clientHeight,
      scroll: el.scrollHeight,
    }));
    expect(textSize.height).toBeGreaterThan(44);
    expect(textSize.scroll).toBeLessThanOrEqual(textSize.height + 1);
    await page
      .getByRole('button', { name: 'Добавить заголовок', exact: true })
      .click();
    const heading = page.getByRole('textbox', {
      name: 'Заголовок истории',
      exact: true,
    });
    await expect(heading).toBeFocused();
    await heading.fill('Заголовок');
    const block = page
      .locator('[data-editor-block="text"]')
      .filter({ has: heading });
    const trigger = block.getByRole('button', {
      name: 'Действия с блоком',
      exact: true,
    });
    const toolbar = page.getByRole('button', {
      name: 'Добавить текст',
      exact: true,
    });
    const beforeMenu = await toolbar.boundingBox();
    await trigger.click();
    await page.screenshot({
      path: resolve(
        followupDir,
        `${test.info().project.name}-story-menu-390.png`,
      ),
    });
    expect((await toolbar.boundingBox())!.y).toBeCloseTo(beforeMenu!.y, 1);
    await block.getByRole('button', { name: 'Выше', exact: true }).click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(
      block.getByRole('button', { name: 'Выше', exact: true }),
    ).toBeDisabled();
    await expect(
      block.getByRole('button', { name: 'Ниже', exact: true }),
    ).toBeFocused();
    await block.getByRole('button', { name: 'Ниже', exact: true }).click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(
      block.getByRole('button', { name: 'Выше', exact: true }),
    ).toBeFocused();
    await block
      .getByRole('button', { name: 'Выше', exact: true })
      .press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
    const directory = resolve(
      e2eEvidenceDir,
      '2026-10-27-photo-story-followup',
    );
    await mkdir(directory, { recursive: true });
    for (const width of [390, 1024, 1440]) {
      await page.setViewportSize({ width, height: 874 });
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
      await page.screenshot({
        path: resolve(
          directory,
          `${test.info().project.name}-story-${width}.png`,
        ),
        fullPage: true,
      });
    }
  } finally {
    releaseImages();
    releaseUpload();
    await context.close();
  }
});

test('story editor polish: geometry, keyboard, and evidence screenshots', async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const { seller, categoryId } = await createSellerFixture();
  const { context, page } = await authenticatedPage(browser, seller, undefined, {
    hasTouch: true,
  });
  const evidenceDir = resolve(
    e2eEvidenceDir,
    '2026-10-28-story-editor-controls',
  );
  await mkdir(evidenceDir, { recursive: true });
  const referenceParagraph =
    'Когда мы написали какой то текст и поле у нас активно то есть, мы находится внутри активного инпута';
  const referenceHeading = 'Заголовок';
  try {
    await page.setViewportSize({ width: 390, height: 874 });
    const created = await context.request.post(
      `${e2eApiBaseURL}/api/products`,
      { data: { title: 'Story editor polish', categoryId } },
    );
    expect(created.status()).toBe(201);
    const { product } = await created.json();
    await page.goto(`/products/${product.id}?flow=creation&step=2`);
    await page.evaluate(() => document.fonts.ready);
    const choose = async (files: string[]) => {
      const picker = page.waitForEvent('filechooser');
      await page
        .getByRole('button', { name: 'Добавить изображения', exact: true })
        .click();
      await (await picker).setFiles(files);
    };
    await choose([
      'e2e/fixtures/portfolio-photo-1.png',
      'e2e/fixtures/portfolio-photo-2.png',
      'e2e/fixtures/portfolio-photo-3.png',
      'e2e/fixtures/portfolio-photo-4.png',
      'e2e/fixtures/portfolio-photo-5.png',
    ]);
    await expect(page.locator('[data-photo-id]')).toHaveCount(5);
    await page
      .getByRole('button', { name: 'Загрузить 5 фото', exact: true })
      .click();
    await expect(
      page.getByRole('img', { name: 'Локальное превью фото', exact: true }),
    ).toHaveCount(0, { timeout: 30_000 });
    await expect(
      page.getByRole('button', { name: 'Продолжить', exact: true }),
    ).toBeEnabled();
    const capture = async (name: string) => {
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: resolve(
          evidenceDir,
          `${test.info().project.name}-${name}-390.png`,
        ),
        fullPage: true,
      });
    };
    await capture('photos-five-plus-add');

    await page
      .getByRole('button', { name: '3. История создания', exact: true })
      .click();
    await expect(page).toHaveURL(/[?&]step=3(?:&|$)/);
    // Step dots expose the current step as "Шаг N из 4". RN Web does not map
    // accessibilityState.selected on role=button to aria-selected.
    await expect(page.getByLabel('Шаг 3 из 4')).toBeVisible();
    await expect(
      page.getByText('История создания', { exact: true }),
    ).toBeVisible();
    await capture('story-empty');
    await expect(
      page.getByRole('button', { name: 'Действия с блоком', exact: true }),
    ).toHaveCount(0);
    const paragraph = page.getByRole('textbox', {
      name: 'Текст истории',
      exact: true,
    });
    await expect(paragraph).toHaveCount(1);
    await expect(
      page.getByRole('button', { name: 'Пропустить', exact: true }),
    ).toBeVisible();
    const initialInput = await paragraph.elementHandle();
    await paragraph.pressSequentially('А');
    await expect(
      page.getByRole('button', { name: 'Действия с блоком', exact: true }),
    ).toBeVisible();
    await paragraph.press('Tab');
    await expect(
      page.getByRole('button', { name: 'Действия с блоком', exact: true }),
    ).toBeFocused();
    await paragraph.focus();
    await paragraph.press('Enter');
    await paragraph.pressSequentially('Б');
    expect(
      await initialInput!.evaluate(
        (el) => el.isConnected && el === document.activeElement,
      ),
    ).toBe(true);
    await paragraph.fill('   ');
    await expect(
      page.getByRole('button', { name: 'Пропустить', exact: true }),
    ).toBeVisible();
    expect(
      await initialInput!.evaluate(
        (el) => el.isConnected && el === document.activeElement,
      ),
    ).toBe(true);
    await paragraph.fill('Первый');
    await expect(
      page.getByRole('button', { name: 'Закончить', exact: true }),
    ).toBeVisible();

    await page
      .getByRole('button', { name: 'Добавить текст', exact: true })
      .click();
    const paragraphs = page.getByRole('textbox', {
      name: 'Текст истории',
      exact: true,
    });
    await expect(paragraphs).toHaveCount(2);
    await paragraphs.nth(1).fill('Второй');
    // Identity is the field value, so reordering does not retarget the locator.
    const blockWithValue = async (label: string, value: string) => {
      const blocks = page.locator('[data-block-key]').filter({
        has: page.getByRole('textbox', { name: label, exact: true }),
      });
      const count = await blocks.count();
      for (let index = 0; index < count; index += 1) {
        const block = blocks.nth(index);
        const current = await block
          .getByRole('textbox', { name: label, exact: true })
          .inputValue();
        if (current !== value) continue;
        const key = await block.getAttribute('data-block-key');
        if (!key) throw new Error(`No key for ${label}`);
        return page.locator(`[data-block-key="${key}"]`);
      }
      throw new Error(`No ${label} block with value ${value}`);
    };
    const first = await blockWithValue('Текст истории', 'Первый');
    const second = await blockWithValue('Текст истории', 'Второй');
    const menuOf = (block: Locator) =>
      block.getByRole('button', { name: 'Действия с блоком', exact: true });
    // Filling the second field selects that block. Inactive blocks hide ⋮.
    await expect(menuOf(first)).toHaveCount(0);
    const secondMenu = menuOf(second);
    await expect(secondMenu).toBeEnabled({ timeout: 15_000 });
    const secondBox = (await secondMenu.boundingBox())!;
    expect(secondBox.width).toBeCloseTo(44, 0);
    expect(secondBox.height).toBeCloseTo(44, 0);
    const hitOwner = (x: number, y: number) =>
      page.evaluate(({ x, y }) => {
        const target = document.elementFromPoint(x, y);
        const block = target?.closest('[data-block-key]');
        const field = block?.querySelector('textarea, input');
        const control = target?.closest('[role="button"], button');
        return {
          label: control?.getAttribute('aria-label') ?? '',
          value:
            field instanceof HTMLTextAreaElement ||
            field instanceof HTMLInputElement
              ? field.value
              : '',
        };
      }, { x, y });
    const samples = (box: { x: number; y: number; width: number; height: number }) => [
      ['center', box.x + box.width / 2, box.y + box.height / 2],
      ['top', box.x + box.width / 2, box.y + 1],
      ['bottom', box.x + box.width / 2, box.y + box.height - 1],
      ['left', box.x + 1, box.y + box.height / 2],
      ['right', box.x + box.width - 1, box.y + box.height / 2],
      ['top-left', box.x + 1, box.y + 1],
      ['top-right', box.x + box.width - 1, box.y + 1],
      ['bottom-left', box.x + 1, box.y + box.height - 1],
      ['bottom-right', box.x + box.width - 1, box.y + box.height - 1],
    ] as const;
    for (const [name, x, y] of samples(secondBox)) {
      const hit = await hitOwner(x, y);
      expect(hit, name).toEqual({ label: 'Действия с блоком', value: 'Второй' });
    }
    const secondField = second.getByRole('textbox', {
      name: 'Текст истории',
      exact: true,
    });
    const secondFieldBox = (await secondField.boundingBox())!;
    const neighborText = await hitOwner(
      secondFieldBox.x + 12,
      secondFieldBox.y + secondFieldBox.height / 2,
    );
    expect(neighborText.value).toBe('Второй');
    expect(neighborText.label).not.toBe('Действия с блоком');
    const secondCenter = {
      x: secondBox.x + secondBox.width / 2,
      y: secondBox.y + secondBox.height / 2,
    };
    await page.touchscreen.tap(secondCenter.x, secondCenter.y);
    await expect(secondMenu).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(secondMenu).toBeFocused();
    await page.mouse.click(secondCenter.x, secondCenter.y);
    await expect(secondMenu).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(secondMenu).toBeFocused();
    await secondMenu.press('Enter');
    await expect(secondMenu).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(secondMenu).toBeFocused();
    const firstField = first.getByRole('textbox', {
      name: 'Текст истории',
      exact: true,
    });
    const firstFieldBox = (await firstField.boundingBox())!;
    await page.mouse.click(
      firstFieldBox.x + 12,
      firstFieldBox.y + firstFieldBox.height / 2,
    );
    await expect(firstField).toBeFocused();
    await expect(menuOf(second)).toHaveCount(0);
    const firstMenu = menuOf(first);
    await expect(firstMenu).toBeVisible();
    const firstBox = (await firstMenu.boundingBox())!;
    expect(firstBox.width).toBeCloseTo(44, 0);
    expect(firstBox.height).toBeCloseTo(44, 0);
    for (const [name, x, y] of samples(firstBox)) {
      const hit = await hitOwner(x, y);
      expect(hit, name).toEqual({ label: 'Действия с блоком', value: 'Первый' });
    }
    const firstText = await hitOwner(
      firstFieldBox.x + 12,
      firstFieldBox.y + firstFieldBox.height / 2,
    );
    expect(firstText.value).toBe('Первый');
    expect(firstText.label).not.toBe('Действия с блоком');
    await capture('story-two-paragraphs');
    await secondField.click();
    await expect(menuOf(second)).toBeVisible();
    await menuOf(second).click();
    const deleteBox = (await second
      .getByRole('button', { name: 'Удалить', exact: true })
      .boundingBox())!;
    expect(deleteBox.width).toBeCloseTo(44, 0);
    expect(deleteBox.height).toBeCloseTo(44, 0);
    await second.getByRole('button', { name: 'Удалить', exact: true }).click();
    await expect(paragraphs).toHaveCount(1);

    await page
      .getByRole('button', { name: 'Добавить заголовок', exact: true })
      .click();
    const heading = page.getByRole('textbox', {
      name: 'Заголовок истории',
      exact: true,
    });
    await expect(heading).toBeFocused();
    await heading.fill(referenceHeading);
    const headingBlock = await blockWithValue(
      'Заголовок истории',
      referenceHeading,
    );
    const headingMenu = headingBlock.getByRole('button', {
      name: 'Действия с блоком',
      exact: true,
    });
    const shortParagraph = await blockWithValue('Текст истории', 'Первый');
    await expect(headingMenu).toBeVisible();
    await expect(
      shortParagraph.getByRole('button', {
        name: 'Действия с блоком',
        exact: true,
      }),
    ).toHaveCount(0);
    const headingBox = (await headingMenu.boundingBox())!;
    expect(headingBox.width).toBeCloseTo(44, 0);
    expect(headingBox.height).toBeCloseTo(44, 0);
    await headingMenu.click();
    await headingBlock.getByRole('button', { name: 'Выше', exact: true }).click();
    await expect(headingMenu).toHaveAttribute('aria-expanded', 'true');
    const headingFirst = await blockWithValue(
      'Заголовок истории',
      referenceHeading,
    );
    expect((await headingFirst.boundingBox())!.y).toBeLessThan(
      (await shortParagraph.boundingBox())!.y,
    );
    await headingFirst
      .getByRole('button', { name: 'Выше', exact: true })
      .press('Escape');
    await expect(headingMenu).toBeFocused();
    await shortParagraph
      .getByRole('textbox', { name: 'Текст истории', exact: true })
      .fill(referenceParagraph);

    const toolbar = page.getByTestId('story-toolbar');
    const beforeMenu = (await toolbar.boundingBox())!;
    await heading.focus();
    await expect(headingMenu).toBeVisible();
    await headingMenu.click();
    await expect(page.getByTestId('story-menu-stroke')).toBeVisible();
    await expect(page.getByTestId('story-menu-divider')).toBeVisible();
    const gradient = await page.evaluate(() => {
      const paint = (id: string, property: 'stroke' | 'fill') => {
        const node = document
          .querySelector(`[data-testid="${id}"]`)
          ?.querySelector('rect');
        if (!node) return { attribute: '', computed: '', rx: 0, ry: 0, width: 0, height: 0 };
        return {
          attribute: node.getAttribute(property) ?? '',
          computed: getComputedStyle(node)[property],
          rx: Number(node.getAttribute('rx') ?? 0),
          ry: Number(node.getAttribute('ry') ?? 0),
          width: Number(node.getAttribute('width') ?? 0),
          height: Number(node.getAttribute('height') ?? 0),
        };
      };
      return { stroke: paint('story-menu-stroke', 'stroke'), divider: paint('story-menu-divider', 'fill') };
    });
    expect(gradient.stroke.attribute).toContain('url(#');
    expect(gradient.stroke.computed).not.toBe('none');
    expect(gradient.divider.attribute).toContain('url(#');
    expect(gradient.divider.computed).not.toBe('none');
    expect(gradient.stroke.rx).toBe(gradient.stroke.ry);
    expect(gradient.stroke.rx).toBeCloseTo(
      Math.min(31, gradient.stroke.width / 2, gradient.stroke.height / 2),
      1,
    );
    const headingDeleteBox = (await headingBlock
      .getByRole('button', { name: 'Удалить', exact: true })
      .boundingBox())!;
    expect(headingDeleteBox.width).toBeCloseTo(44, 0);
    expect(headingDeleteBox.height).toBeCloseTo(44, 0);
    expect((await toolbar.boundingBox())!.y).toBeCloseTo(beforeMenu.y, 1);
    await capture('story-menu-open');
    await headingBlock.getByRole('button', { name: 'Ниже', exact: true }).click();
    await expect(headingMenu).toHaveAttribute('aria-expanded', 'true');
    const headingLower = await blockWithValue(
      'Заголовок истории',
      referenceHeading,
    );
    const paragraphLower = await blockWithValue(
      'Текст истории',
      referenceParagraph,
    );
    expect((await headingLower.boundingBox())!.y).toBeGreaterThan(
      (await paragraphLower.boundingBox())!.y,
    );
    await headingLower.getByRole('button', { name: 'Выше', exact: true }).click();
    const headingAfterMove = await blockWithValue(
      'Заголовок истории',
      referenceHeading,
    );
    const paragraphAfterMove = await blockWithValue(
      'Текст истории',
      referenceParagraph,
    );
    expect((await headingAfterMove.boundingBox())!.y).toBeLessThan(
      (await paragraphAfterMove.boundingBox())!.y,
    );
    await headingAfterMove
      .getByRole('button', { name: 'Выше', exact: true })
      .press('Escape');
    await expect(headingMenu).toBeFocused();

    await heading.focus();
    await expect(headingMenu).toBeVisible();
    const tabStops = [
      { label: 'Действия с блоком', value: referenceHeading },
      { label: 'Текст истории', value: referenceParagraph },
      { label: 'Действия с блоком', value: referenceParagraph },
      { label: 'Добавить заголовок', value: '' },
      { label: 'Добавить текст', value: '' },
      { label: 'Добавить изображение', value: '' },
      { label: 'Закончить', value: '' },
    ];
    for (const stop of tabStops) {
      await page.keyboard.press('Tab');
      await expect
        .poll(() =>
          page.evaluate(() => {
            const active = document.activeElement;
            const block = active?.closest('[data-editor-block]');
            const field = block?.querySelector('textarea, input');
            return {
              label: active?.getAttribute('aria-label') ?? '',
              value:
                field instanceof HTMLTextAreaElement ||
                field instanceof HTMLInputElement
                  ? field.value
                  : '',
            };
          }),
        )
        .toEqual(stop);
    }

    const paragraphField = paragraphAfterMove.getByRole('textbox', {
      name: 'Текст истории',
      exact: true,
    });
    const fieldMetrics = () =>
      paragraphField.evaluate((node) => {
        const style = getComputedStyle(node);
        const box = node.getBoundingClientRect();
        return {
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing,
          height: box.height,
          scrollHeight: node.scrollHeight,
          value: node instanceof HTMLTextAreaElement ? node.value : '',
        };
      });
    const beforeBlur = await fieldMetrics();
    await paragraphField.focus();
    await paragraphField.blur();
    await expect(paragraphField).not.toBeFocused();
    expect(await fieldMetrics()).toEqual(beforeBlur);

    const finishBox = (await toolbar.boundingBox())!;
    const toolbarPaint = await toolbar.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        borderTop: style.borderTopWidth,
        borderBottom: style.borderBottomWidth,
        boxSizing: style.boxSizing,
        minHeight: style.minHeight,
      };
    });
    // Figma 4563:32790 is 275×52. Allowance is the measured chrome difference:
    // three 42px icons instead of 43px and padding 4 instead of 4.5 (width
    // −2.78125); height +1 because the 43px compactIcon row, 8px padding and
    // 1px+1px snapped borders exceed minHeight 52.
    const figmaToolbar = { width: 275, height: 52 };
    const widthAllowance = 2.78125;
    const heightAllowance = 1;
    expect(figmaToolbar.width - finishBox.width).toBeCloseTo(widthAllowance, 2);
    expect(finishBox.height - figmaToolbar.height).toBe(heightAllowance);
    await writeFile(
      resolve(evidenceDir, `${test.info().project.name}-toolbar.json`),
      JSON.stringify(
        {
          figma: { node: '4563:32790', width: 275, height: 52 },
          measured: finishBox,
          paint: toolbarPaint,
          heightDelta:
            'Used height 53. minHeight is 52. Computed border is 1px+1px from authored 0.5. The 43px compactIcon control, 8px padding and those borders exceed the minimum. Figma 4563:32790 is 52.',
          widthDelta:
            'Used width 272.22 versus Figma 275. Three muted icons are 42px rather than 43px, and padding is 4 rather than the 4.5 inset.',
          gradient,
        },
        null,
        2,
      ),
    );
    await capture('story-heading-paragraph');

    await page.setViewportSize({ width: 390, height: 520 });
    await toolbar.scrollIntoViewIfNeeded();
    await expect(
      page.getByRole('button', { name: 'Закончить', exact: true }),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 874 });

    const storyPicker = page.waitForEvent('filechooser');
    await page
      .getByRole('button', { name: 'Добавить изображение', exact: true })
      .click();
    await (await storyPicker).setFiles('e2e/fixtures/portfolio-photo-1.png');
    const imageBlock = page.locator('[data-editor-block="image"]');
    await expect(imageBlock).toBeVisible({ timeout: 20_000 });
    await imageBlock
      .getByRole('button', { name: 'Выбрать изображение истории', exact: true })
      .click();
    const imageMenu = imageBlock.getByRole('button', {
      name: 'Действия с изображением',
      exact: true,
    });
    await expect(imageMenu).toBeVisible();
    const imageMenuBox = (await imageMenu.boundingBox())!;
    expect(imageMenuBox.width).toBeCloseTo(44, 0);
    expect(imageMenuBox.height).toBeCloseTo(44, 0);
    await imageMenu.click();
    const description = page.getByRole('textbox', {
      name: 'Описание фото',
      exact: true,
    });
    await expect(description).toBeVisible();
    const descriptionBox = (await description.boundingBox())!;
    await page.mouse.click(
      descriptionBox.x + descriptionBox.width / 2,
      descriptionBox.y + Math.min(12, descriptionBox.height / 2),
    );
    await expect(description).toBeFocused();
    await description.fill('Описание кадра');
    await expect(description).toHaveValue('Описание кадра');
    await expect(headingMenu).toHaveCount(0);
    await expect(imageMenu).toHaveAttribute('aria-expanded', 'true');
  } finally {
    await context.close();
  }
});
