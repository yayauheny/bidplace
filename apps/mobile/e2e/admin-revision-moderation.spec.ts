import { expect, type Locator, type Page, test } from '@playwright/test';

import { e2eApiBaseURL } from './support/e2e-env';
import { authenticatedPage } from './support/auth-session';
import {
  createRevisionModerationFixture,
  type RevisionImage,
} from './support/revision-moderation-fixture';

async function expectDecoded(
  locator: Locator,
  sizes: Array<{ width: number; height: number }>,
) {
  await expect(locator).toHaveCount(sizes.length);
  await expect
    .poll(async () =>
      locator.evaluateAll((nodes) =>
        nodes.map((node) => {
          const image =
            node instanceof HTMLImageElement ? node : node.querySelector('img');
          if (
            !(image instanceof HTMLImageElement) ||
            !image.complete ||
            image.naturalWidth === 0
          ) {
            return null;
          }
          return { width: image.naturalWidth, height: image.naturalHeight };
        }),
      ),
    )
    .toEqual(sizes);
}

async function expectImageResponse(
  page: Page,
  path: string,
  status: number,
  bytes?: Buffer,
) {
  const response = await page.request.get(`${e2eApiBaseURL}${path}`);
  expect(response.status()).toBe(status);
  const body = Buffer.from(await response.body());
  if (bytes && status === 200) {
    expect(response.headers()['content-type']).toContain('image/png');
    expect(body).toEqual(bytes);
  } else if (bytes) {
    expect(body.equals(bytes)).toBe(false);
  }
}

test('admin reviews a pending seller revision without exposing it publicly', async ({
  browser,
}) => {
  const fixture = await createRevisionModerationFixture();
  const guest = await browser.newPage();
  await guest.goto(`/authors/${fixture.slug}`);
  await expect(guest.getByText(fixture.publishedName).first()).toBeVisible();
  await expect(guest.getByText(fixture.pendingName)).toHaveCount(0);
  await expect(
    guest.getByText(`Фото автора недоступно: ${fixture.publishedName}`),
  ).toHaveCount(0);
  await expectDecoded(
    guest.getByTestId('creator-avatar').getByRole('img', {
      name: `Фото автора ${fixture.publishedName}`,
    }),
    [fixture.publishedPhotoSize],
  );
  const publicBefore = await guest.request.get(
    `${e2eApiBaseURL}/api/sellers/${fixture.slug}/photo`,
  );
  expect(publicBefore.status()).toBe(200);
  expect(publicBefore.headers()['content-type']).toContain('image/png');
  expect(Buffer.from(await publicBefore.body())).toEqual(fixture.publishedPhoto);
  await expectPublishedAchievement(guest, fixture.publishedAchievement);
  await expectImageResponse(
    guest,
    `/api/author-achievements/${fixture.pendingAchievement.id}/image`,
    404,
    fixture.pendingAchievement.bytes,
  );
  await expect(guest.getByText(fixture.pendingAchievement.body)).toHaveCount(0);

  const { context: adminContext, page } = await authenticatedPage(
    browser,
    fixture.admin,
  );
  const revisionPhoto = page.waitForResponse((response) =>
    response.url().includes(`/revisions/${fixture.revisionId}/photo`),
  );
  await page.goto('/admin');
  await page.getByLabel('Найти автора').fill(fixture.pendingName);
  await expect(page.getByText(fixture.pendingName).first()).toBeVisible();
  await expect(page.getByText('Публикация:').first()).toBeVisible();
  await expect(page.getByText('Проверка:').first()).toBeVisible();
  const revisionResponse = await revisionPhoto;
  expect(revisionResponse.status()).toBe(200);
  expect(revisionResponse.headers()['content-type']).toContain('image/png');
  expect(Buffer.from(await revisionResponse.body())).toEqual(fixture.pendingPhoto);
  await expect(page.getByText('Фото ревизии недоступно')).toHaveCount(0);
  await expectDecoded(
    page.getByRole('img', { name: `Фото ревизии: ${fixture.pendingName}` }),
    [fixture.pendingPhotoSize],
  );
  await expect(page.getByText(fixture.pendingAchievement.body).first()).toBeVisible();
  await expect(page.getByText(fixture.publishedAchievement.body)).toHaveCount(0);
  await expect(page.getByText('Изображение достижения недоступно')).toHaveCount(0);
  await expectDecoded(page.locator('img[alt="Достижение"]'), [
    {
      width: fixture.pendingAchievement.width,
      height: fixture.pendingAchievement.height,
    },
  ]);
  await guest.reload();
  await expect(guest.getByText(fixture.publishedName).first()).toBeVisible();
  await expect(guest.getByText(fixture.pendingName)).toHaveCount(0);
  await expectDecoded(
    guest.getByTestId('creator-avatar').getByRole('img', {
      name: `Фото автора ${fixture.publishedName}`,
    }),
    [fixture.publishedPhotoSize],
  );

  const card = page
    .locator('div')
    .filter({ hasText: fixture.pendingName })
    .filter({ has: page.getByRole('button', { name: 'Одобрить' }) })
    .last();
  await card.getByRole('button', { name: 'Одобрить' }).click();
  await expect(page.getByText(fixture.pendingName)).toHaveCount(0);

  await guest.reload();
  await expect(guest.getByText(fixture.pendingName).first()).toBeVisible();
  await expect(
    guest.getByText(`Фото автора недоступно: ${fixture.pendingName}`),
  ).toHaveCount(0);
  await expectDecoded(
    guest.getByTestId('creator-avatar').getByRole('img', {
      name: `Фото автора ${fixture.pendingName}`,
    }),
    [fixture.pendingPhotoSize],
  );
  const publicAfter = await guest.request.get(
    `${e2eApiBaseURL}/api/sellers/${fixture.slug}/photo`,
  );
  expect(publicAfter.status()).toBe(200);
  expect(publicAfter.headers()['content-type']).toContain('image/png');
  expect(Buffer.from(await publicAfter.body())).toEqual(fixture.pendingPhoto);
  await expectPublishedAchievement(guest, fixture.pendingAchievement);
  await guest.close();
  await adminContext.close();
});

test('admin reviews a pending product revision without exposing its gallery publicly', async ({
  browser,
}) => {
  const fixture = await createRevisionModerationFixture();
  const guest = await browser.newPage();
  await guest.goto(`/product/${fixture.publicId}`);
  await expect(guest.getByText(fixture.publishedTitle).first()).toBeVisible();
  await expect(guest.getByText(fixture.pendingTitle)).toHaveCount(0);
  await expect(guest.getByText('Изображение недоступно')).toHaveCount(0);
  await expectGallery(guest, fixture.publishedTitle, fixture.publishedGallery);
  const before = await guest.request.get(
    `${e2eApiBaseURL}/api/works/${fixture.publicId}`,
  );
  expect(before.status()).toBe(200);
  const beforeBody = (await before.json()) as {
    work: {
      title: string;
      categoryId: string;
      images: Array<{ id: string; width: number | null; height: number | null }>;
    };
  };
  expect(beforeBody.work.title).toBe(fixture.publishedTitle);
  expect(imageIdentity(beforeBody.work.images)).toEqual(
    imageIdentity(fixture.publishedGallery),
  );
  await expectImageResponse(
    guest,
    `/api/images/${fixture.publishedImageId}`,
    200,
    fixture.publishedGallery[0].bytes,
  );
  await expectImageResponse(
    guest,
    `/api/images/${fixture.pendingOnlyImageId}`,
    404,
    fixture.pendingGallery[0].bytes,
  );

  const { context: adminContext, page } = await authenticatedPage(
    browser,
    fixture.admin,
  );
  await page.goto('/admin');
  await page.getByRole('button', { name: 'Работы' }).click();
  await page.getByLabel('Найти работу').fill(fixture.pendingTitle);
  await expect(page.getByText(fixture.pendingTitle).first()).toBeVisible();
  await expect(page.getByText(fixture.pendingCategoryId).first()).toBeVisible();
  await expect(page.getByText(fixture.publishedCategoryId)).toHaveCount(0);
  await expect(page.getByText(fixture.publishedTitle)).toHaveCount(0);
  await expect(
    page.getByText(`Изображение недоступно: ${fixture.pendingTitle}`),
  ).toHaveCount(0);
  await expectDecoded(
    page.getByRole('img', { name: `Предмет: ${fixture.pendingTitle}` }),
    fixture.pendingGallery.map((image) => ({
      width: image.width,
      height: image.height,
    })),
  );

  await guest.reload();
  await expect(guest.getByText(fixture.publishedTitle).first()).toBeVisible();
  await expect(guest.getByText(fixture.pendingTitle)).toHaveCount(0);
  await expectGallery(guest, fixture.publishedTitle, fixture.publishedGallery);
  await expectImageResponse(
    guest,
    `/api/images/${fixture.pendingOnlyImageId}`,
    404,
    fixture.pendingGallery[0].bytes,
  );

  const card = page
    .locator('div')
    .filter({ hasText: fixture.pendingTitle })
    .filter({ has: page.getByRole('button', { name: 'Одобрить' }) })
    .last();
  await card.getByRole('button', { name: 'Одобрить' }).click();
  await expect(page.getByText(fixture.pendingTitle)).toHaveCount(0);

  await guest.reload();
  await expect(guest.getByText(fixture.pendingTitle).first()).toBeVisible();
  await expect(guest.getByText('Изображение недоступно')).toHaveCount(0);
  await expectGallery(guest, fixture.pendingTitle, fixture.pendingGallery);
  const after = await guest.request.get(
    `${e2eApiBaseURL}/api/works/${fixture.publicId}`,
  );
  expect(after.status()).toBe(200);
  const afterBody = (await after.json()) as {
    work: {
      title: string;
      images: Array<{ id: string; width: number | null; height: number | null }>;
    };
  };
  expect(afterBody.work.title).toBe(fixture.pendingTitle);
  expect(imageIdentity(afterBody.work.images)).toEqual(
    imageIdentity(fixture.pendingGallery),
  );
  await expectImageResponse(
    guest,
    `/api/images/${fixture.pendingOnlyImageId}`,
    200,
    fixture.pendingGallery[0].bytes,
  );
  await expectImageResponse(
    guest,
    `/api/images/${fixture.pendingImageId}`,
    200,
    fixture.pendingGallery[1].bytes,
  );
  await guest.close();
  await adminContext.close();
});

async function expectPublishedAchievement(
  page: Page,
  achievement: {
    id: string;
    body: string;
    bytes: Buffer;
    width: number;
    height: number;
  },
) {
  await page.getByRole('tab', { name: 'Об авторе' }).click();
  await expect(page.getByText(achievement.body).first()).toBeVisible();
  await expect(page.getByText('Фотография недоступна')).toHaveCount(0);
  await expectDecoded(
    page
      .getByTestId('author-achievement-card')
      .filter({ hasText: achievement.body })
      .locator('img'),
    [{ width: achievement.width, height: achievement.height }],
  );
  await expectImageResponse(
    page,
    `/api/author-achievements/${achievement.id}/image`,
    200,
    achievement.bytes,
  );
}

function imageIdentity(
  images: Array<{ id: string; width: number | null; height: number | null }>,
) {
  return images.map((image) => ({
    id: image.id,
    width: image.width,
    height: image.height,
  }));
}

async function expectGallery(page: Page, title: string, images: RevisionImage[]) {
  const gallery = page.getByTestId('work-gallery').getByRole('img');
  await expectDecoded(
    gallery,
    images.map((image) => ({ width: image.width, height: image.height })),
  );
  await expect(gallery).toHaveCount(images.length);
  expect(
    await gallery.evaluateAll((nodes) =>
      nodes.map((node) =>
        node instanceof HTMLImageElement ? node.alt : node.getAttribute('aria-label'),
      ),
    ),
  ).toEqual(
    images.map(
      (_image, index) => `${title}, фото ${index + 1} из ${images.length}`,
    ),
  );
}
