import { expect, test } from '@playwright/test';

import { e2eApiBaseURL } from './support/e2e-env';

const apiBaseURL = e2eApiBaseURL;
const seededWorks = [
  'seedSched01',
  'seedLive002',
  'seedEnded03',
  'seedVase004',
] as const;

test('demo seed exposes public portfolio authors, works and media', async ({
  page,
  request,
}) => {
  const authorsResponse = await request.get(
    `${apiBaseURL}/api/authors?limit=20&sort=name`,
  );
  expect(authorsResponse.ok()).toBeTruthy();
  const authorsPayload = (await authorsResponse.json()) as {
    authors: Array<{
      author: { slug: string; fullName: string; profilePhotoUrl: string };
    }>;
  };
  expect(authorsPayload.authors.length).toBeGreaterThan(0);
  expect(
    authorsPayload.authors.some(
      (item) => item.author.slug === 'anna-morozova',
    ),
  ).toBe(true);

  const anna = authorsPayload.authors.find(
    (item) => item.author.slug === 'anna-morozova',
  );
  expect(anna).toBeTruthy();
  const authorPhotoResponse = await request.get(
    new URL(anna!.author.profilePhotoUrl, apiBaseURL).toString(),
  );
  expect(authorPhotoResponse.status()).toBe(200);
  expect(authorPhotoResponse.headers()['content-type']).toMatch(/^image\//);

  const worksResponse = await request.get(
    `${apiBaseURL}/api/works?page=1&limit=20&sort=newest`,
  );
  expect(worksResponse.ok()).toBeTruthy();
  const worksPayload = (await worksResponse.json()) as {
    works: Array<{
      work: { publicId: string; title: string; images: Array<{ url: string }> };
    }>;
  };
  const seeded = worksPayload.works.filter((item) =>
    seededWorks.includes(
      item.work.publicId as (typeof seededWorks)[number],
    ),
  );
  expect(seeded.length).toBeGreaterThan(0);

  for (const item of seeded) {
    expect(item.work.images.length).toBeGreaterThan(0);
    const imageResponse = await request.get(
      new URL(item.work.images[0]!.url, apiBaseURL).toString(),
    );
    expect(imageResponse.status()).toBe(200);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/works');
  await expect(page.getByText(seeded[0]!.work.title).first()).toBeVisible();

  await page.goto(`/product/${seeded[0]!.work.publicId}`);
  await expect(page.getByText(seeded[0]!.work.title).first()).toBeVisible();
  await expect(page.getByRole('tab', { name: /Торги/ })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: /Детали/ })).toBeVisible();

  await page.goto('/seller/anna-morozova');
  await expect(page.getByRole('tab', { name: /Работы/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Об авторе/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Идут торги/ })).toHaveCount(0);
});
