import { expect, test } from '@playwright/test';

test('catalog sort stays above cards and accepts selection, Escape and outside click', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 401, json: {} }),
  );
  await page.route('**/api/authors?*', (route) =>
    route.fulfill({
      json: {
        authors: [
          {
            author: {
              id: '10000000-0000-4000-8000-000000000004',
              slug: 'overlay-author',
              fullName: 'Автор для фильтра',
              country: 'BY',
              city: 'Минск',
              discipline: 'Живопись',
              practice: null,
              profilePhotoUrl: '/api/sellers/overlay-author/photo',
              telegramUrl: null,
              instagramUrl: null,
              websiteUrl: null,
              shortDescription: 'Описание',
              achievements: [],
              sharePath: '/authors/overlay-author',
            },
            workCount: 1,
          },
        ],
        pagination: { page: 1, limit: 20, total: 1 },
      },
    }),
  );
  await page.route('**/api/sellers/overlay-author/photo', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="264" height="352"><rect width="264" height="352" fill="#257c98"/></svg>',
    }),
  );
  await page.goto('/authors');
  await expect(page.locator('[data-placement="authorTop"]')).toBeVisible();
  const trigger = page.getByRole('button', { name: 'Сортировка' });
  await trigger.click();
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('filter-open.png') });
  expect(await menu.evaluate((e) => !!e.closest('#app-overlay-host'))).toBe(
    true,
  );
  await page.getByRole('menuitem', { name: 'По имени', exact: true }).click();
  await expect(page).toHaveURL(/sort=name/);
  await expect(menu).toHaveCount(0);
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.mouse.click(380, 20);
  await expect(menu).toHaveCount(0);
});
