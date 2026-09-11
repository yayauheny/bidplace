import { expect, test } from '@playwright/test';

test('creator atmosphere scrolls with the profile and leaves the lower page white', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 401, json: { message: 'Unauthorized' } }),
  );
  await page.route('**/api/authors/atmosphere-author?*', (route) =>
    route.fulfill({
      json: {
        author: {
          id: '10000000-0000-4000-8000-000000000004',
          slug: 'atmosphere-author',
          fullName: 'Автор атмосферы',
          country: 'BY',
          city: 'Минск',
          discipline: 'Живопись',
          practice: null,
          profilePhotoUrl: '/api/sellers/atmosphere-author/photo',
          telegramUrl: null,
          instagramUrl: null,
          websiteUrl: null,
          shortDescription:
            'Длинная биография автора для проверки прокрутки. '.repeat(100),
          achievements: [],
          sharePath: '/authors/atmosphere-author',
        },
        works: [],
        pagination: { page: 1, limit: 20, total: 0 },
      },
    }),
  );
  await page.route('**/api/sellers/atmosphere-author/photo', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="485" height="485"><rect width="485" height="485" fill="#cd3518"/><rect width="200" height="485" fill="#177bc4"/></svg>',
    }),
  );
  await page.goto('/seller/atmosphere-author');
  const atmosphere = page.getByTestId('author-atmosphere');
  await expect(atmosphere).toBeVisible();
  await page.getByRole('tab', { name: 'Об авторе', exact: true }).click();
  const before = await atmosphere.boundingBox();
  expect(before).toBeTruthy();
  const scroll = page.getByTestId('creator-scroll');
  await scroll.evaluate((element) => {
    element.scrollTop = 600;
  });
  await expect
    .poll(async () => (await atmosphere.boundingBox())?.y)
    .toBeLessThan(-500);
  const after = await atmosphere.boundingBox();
  expect(before!.y - after!.y).toBeCloseTo(600, 0);
  await expect(page.getByTestId('figma-floating-dock')).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await test
    .info()
    .attach('creator-scrolled', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
});
