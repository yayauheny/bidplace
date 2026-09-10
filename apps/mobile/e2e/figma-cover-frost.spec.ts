import { expect, test } from '@playwright/test';

const imageId = '10000000-0000-4000-8000-000000000001';

test('cover frost samples the real artwork once on web', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
  });
  await page.route('**/api/portfolio/home', async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        curatorSelection: null,
        newWorks: [
          {
            work: {
              id: '10000000-0000-4000-8000-000000000002',
              publicId: 'ABCDEFGHIJK',
              title: 'Работа с живым фоном',
              story: null,
              categoryId: '10000000-0000-4000-8000-000000000003',
              technique: null,
              materials: null,
              dimensions: null,
              year: 2026,
              uniqueness: null,
              images: [
                {
                  id: imageId,
                  position: 0,
                  url: `/api/images/${imageId}`,
                  mimeType: 'image/svg+xml',
                  byteLength: 1,
                  checksum: 'a'.repeat(64),
                  width: 264,
                  height: 352,
                },
              ],
              publishedAt: '2026-09-10T00:00:00.000Z',
              sharePath: '/works/ABCDEFGHIJK',
            },
            author: {
              id: '10000000-0000-4000-8000-000000000004',
              slug: 'test-author',
              fullName: 'Тестовый автор',
              country: 'Беларусь',
              city: 'Минск',
              discipline: 'Живопись',
              practice: null,
              profilePhotoUrl: '/api/sellers/test-author/photo',
              telegramUrl: null,
              instagramUrl: null,
              websiteUrl: null,
              shortDescription: 'Описание автора',
              achievements: [],
              sharePath: '/authors/test-author',
            },
          },
        ],
        newAuthors: [],
      },
    });
  });
  await page.route(`**/api/images/${imageId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="264" height="352"><rect width="264" height="352" fill="#cf2b00"/><path d="M0 0h132v352H0z" fill="#148bd1"/><path d="M0 230h264v30H0z" fill="#fff"/></svg>`,
    });
  });

  await page.goto('/');

  const frost = page.getByTestId('figma-cover-frost').first();
  await expect(frost).toBeVisible();
  await expect(page.getByText('Работа с живым фоном')).toBeVisible();

  const implementation = await frost.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      ariaHidden: element.getAttribute('aria-hidden'),
      backdropFilter:
        style.backdropFilter ||
        (style as CSSStyleDeclaration & { webkitBackdropFilter?: string })
          .webkitBackdropFilter,
      imageCount: element.querySelectorAll('img').length,
      pointerEvents: style.pointerEvents,
    };
  });

  expect(implementation).toEqual({
    ariaHidden: 'true',
    backdropFilter: 'blur(30px)',
    imageCount: 0,
    pointerEvents: 'none',
  });

  const withBlur = await frost.screenshot();
  await frost.evaluate((element) => {
    const htmlElement = element as HTMLElement;
    htmlElement.style.backdropFilter = 'none';
    (
      htmlElement.style as CSSStyleDeclaration & {
        webkitBackdropFilter?: string;
      }
    ).webkitBackdropFilter = 'none';
  });
  const withoutBlur = await frost.screenshot();

  expect(withBlur.equals(withoutBlur)).toBe(false);
});
