import { expect, test } from '@playwright/test';
import { PrismaClient } from '../../../packages/database/dist/index.js';
import { authenticatedPage } from './support/auth-session';
import { fillControl } from './support/fill-control';
import {
  createBuyerFixture,
  createAdminModerationFixture,
} from './support/e2e-fixtures';
import {
  e2eApiBaseURL,
  e2eDatabaseURL,
  e2eWebBaseURL,
} from './support/e2e-env';
import { readFileSync } from 'node:fs';

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
  const guest = await browser.newPage({ baseURL: e2eWebBaseURL });
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
          slug: `work-${suffix}`,
          fullName: 'Work lifecycle author',
          country: 'BY',
          city: 'Minsk',
          discipline: 'Автор',
          shortDescription: 'Portfolio lifecycle',
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
      'e2e/fixtures/profile-photo.png',
    ]);
    await page
      .getByRole('button', { name: 'Повторить загрузку', exact: true })
      .click();
    await expect(
      page.getByText('2/10 изображений', { exact: true }),
    ).toBeVisible();
    expect(
      await prisma.productImage.count({ where: { productId: work.id } }),
    ).toBe(2);
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
        .getByRole('button', { name: 'Удалить изображение', exact: true })
        .first()
        .click();
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Удалить изображение', exact: true })
        .click();
      await expect(
        page.getByText(`${remaining}/10 изображений`, { exact: true }),
      ).toBeVisible();
    }
    await expect(
      page.getByText('0/10 изображений', { exact: true }),
    ).toBeVisible();
    const nextChooser = page.waitForEvent('filechooser');
    await page
      .getByRole('button', { name: 'Добавить изображения', exact: true })
      .click();
    await (await nextChooser).setFiles('e2e/fixtures/profile-photo.png');
    await expect(
      page.getByText('1/10 изображений', { exact: true }),
    ).toBeVisible();
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
    await guest.close();
    await context.close();
    await adminContext.close();
  }
});
