import { expect, test } from '@playwright/test';

import { e2eApiBaseURL } from './support/e2e-env';

const apiBaseURL = e2eApiBaseURL;
const seededWorkIds = [
  'seedSched01',
  'seedLive002',
  'seedEnded03',
  'seedVase004',
] as const;

test('demo seed exposes published portfolio works and real media', async ({
  page,
  request,
}) => {
  const authorDetailResponse = await request.get(
    `${apiBaseURL}/api/authors/anna-morozova`,
  );
  expect(authorDetailResponse.ok()).toBeTruthy();
  const authorDetail = (await authorDetailResponse.json()) as {
    author: { profilePhotoUrl: string };
    works: unknown[];
  };
  expect(authorDetail.works.length).toBeGreaterThan(0);
  const authorPhotoResponse = await request.get(
    new URL(authorDetail.author.profilePhotoUrl, apiBaseURL).toString(),
  );
  expect(authorPhotoResponse.status()).toBe(200);
  expect(authorPhotoResponse.headers()['content-type']).toMatch(/^image\/png/);
  expect((await authorPhotoResponse.body()).byteLength).toBeGreaterThan(
    100_000,
  );

  const authorsResponse = await request.get(
    `${apiBaseURL}/api/authors?limit=20&sort=name`,
  );
  expect(authorsResponse.ok()).toBeTruthy();
  const authorsPayload = (await authorsResponse.json()) as {
    authors: Array<{ author: { slug: string; profilePhotoUrl: string } }>;
  };
  expect(authorsPayload.authors).toHaveLength(8);
  expect(
    new Set(authorsPayload.authors.map((item) => item.author.slug)).size,
  ).toBe(8);

  for (const item of authorsPayload.authors) {
    const profilePhotoResponse = await request.get(
      new URL(item.author.profilePhotoUrl, apiBaseURL).toString(),
    );
    expect(profilePhotoResponse.status()).toBe(200);
    expect(profilePhotoResponse.headers()['content-type']).toMatch(
      /^image\/png/,
    );
    expect((await profilePhotoResponse.body()).byteLength).toBeGreaterThan(0);
  }

  const response = await request.get(`${apiBaseURL}/api/works?page=1&limit=20`);
  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as {
    works: Array<{
      work: {
        publicId: string;
        title: string;
        images: Array<{ url: string }>;
      };
    }>;
  };
  const seededWorks = payload.works.filter((item) =>
    seededWorkIds.includes(
      item.work.publicId as (typeof seededWorkIds)[number],
    ),
  );
  expect(seededWorks).toHaveLength(4);

  for (const item of seededWorks) {
    expect(item.work.images).toHaveLength(1);
    const imageResponse = await request.get(
      new URL(item.work.images[0]!.url, apiBaseURL).toString(),
    );
    expect(imageResponse.status()).toBe(200);
    expect(imageResponse.headers()['content-type']).toMatch(/^image\/png/);
    expect((await imageResponse.body()).byteLength).toBeGreaterThan(0);
  }

  for (const item of seededWorks) {
    await page.goto('/works');
    await expect(page.getByText(item.work.title).first()).toBeVisible();
    const image = page.locator(`img[alt="${item.work.title}"]`).first();
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image.evaluate((element) => (element as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);

    await page.goto(`/product/${item.work.publicId}`);
    const galleryImage = page.locator(`img[alt="${item.work.title}"]`).first();
    await expect(galleryImage).toBeVisible();
    await expect
      .poll(() =>
        galleryImage.evaluate(
          (element) => (element as HTMLImageElement).naturalWidth,
        ),
      )
      .toBeGreaterThan(0);
    await expect(
      page.getByText(`Изображение недоступно: ${item.work.title}`),
    ).toHaveCount(0);
    await expect(page.getByText(/BYN/)).toHaveCount(0);
    await expect(page.getByRole('tab', { name: /Торги/ })).toHaveCount(0);
  }

  await page.goto('/seller/anna-morozova');
  const authorPhoto = page.locator('img[alt="Фото автора Анна Морозова"]');
  await expect(authorPhoto).toBeVisible();
  await expect(page.getByRole('tab', { name: /Работы/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Об авторе' })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Идут торги/ })).toHaveCount(0);
  await expect
    .poll(() =>
      authorPhoto.evaluate((element) => ({
        width: (element as HTMLImageElement).naturalWidth,
        height: (element as HTMLImageElement).naturalHeight,
      })),
    )
    .toEqual({ width: 740, height: 493 });
});
