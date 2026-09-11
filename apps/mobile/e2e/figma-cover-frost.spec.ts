import { expect, test, type Locator } from '@playwright/test';

const workImageId = '10000000-0000-4000-8000-000000000001';

test('cover frost keeps Figma regions and samples artwork once on web', async ({
  page,
}) => {
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
                  id: workImageId,
                  position: 0,
                  url: `/api/images/${workImageId}`,
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
        newAuthors: [
          {
            id: '10000000-0000-4000-8000-000000000006',
            slug: 'frost-author',
            fullName: 'Автор с ореолом',
            country: 'Беларусь',
            city: 'Минск',
            discipline: 'Керамика',
            practice: null,
            profilePhotoUrl: '/api/sellers/frost-author/photo',
            telegramUrl: null,
            instagramUrl: null,
            websiteUrl: null,
            shortDescription: 'Описание автора',
            achievements: [],
            sharePath: '/authors/frost-author',
          },
        ],
      },
    });
  });
  await page.route(`**/api/images/${workImageId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="264" height="352"><rect width="264" height="352" fill="#cf2b00"/><path d="M0 0h132v352H0z" fill="#148bd1"/><path d="M0 230h264v30H0z" fill="#fff"/></svg>`,
    });
  });
  await page.route('**/api/sellers/frost-author/photo', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="264" height="352"><rect width="264" height="352" fill="#2a6f4e"/><path d="M0 0h264v40H0z" fill="#fff"/><path d="M0 312h264v40H0z" fill="#fff"/></svg>`,
    });
  });

  await page.goto('/');

  const workFrost = page.locator('[data-placement="workBottom"]');
  const authorTop = page.locator('[data-placement="authorTop"]');
  const authorBottom = page.locator('[data-placement="authorBottom"]');

  await expect(workFrost).toBeVisible();
  await expect(authorTop).toBeVisible();
  await expect(authorBottom).toBeVisible();
  await expect(page.getByText('Работа с живым фоном')).toBeVisible();
  await expect(page.getByText('Автор с ореолом')).toBeVisible();

  const workMetrics = await readFrost(workFrost);
  const authorTopMetrics = await readFrost(authorTop);
  const authorBottomMetrics = await readFrost(authorBottom);

  expect(workMetrics).toMatchObject({
    ariaHidden: 'true',
    blurLayers: 6,
    imageCount: 0,
    pointerEvents: 'none',
    borderRadius: '0px',
  });
  expect(workMetrics.heightRatio).toBeCloseTo(125 / 352, 2);
  expect(authorTopMetrics.heightRatio).toBeCloseTo(56 / 352, 2);
  expect(authorBottomMetrics.heightRatio).toBeCloseTo(77 / 352, 2);
  expect(workMetrics.innerBlurPx).toBeLessThan(workMetrics.outerBlurPx);
  expect(workMetrics.outerBlurPx).toBeCloseTo(30, 1);
  expect(authorTopMetrics.outerBlurPx).toBeCloseTo(20, 1);
  expect(authorBottomMetrics.outerBlurPx).toBeCloseTo(30, 1);

  const withBlur = await workFrost.screenshot();
  await workFrost.evaluate((element) => {
    for (const child of element.children) {
      const layer = child as HTMLElement;
      layer.style.backdropFilter = 'none';
      (
        layer.style as CSSStyleDeclaration & {
          webkitBackdropFilter?: string;
        }
      ).webkitBackdropFilter = 'none';
    }
  });
  const withoutBlur = await workFrost.screenshot();

  expect(withBlur.equals(withoutBlur)).toBe(false);
});

async function readFrost(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    const card = element.parentElement;
    if (!card) {
      throw new Error('Cover frost must sit on the card');
    }
    const frostBox = element.getBoundingClientRect();
    const cardBox = card.getBoundingClientRect();
    const blurLayers = [...element.children].filter((child) =>
      getComputedStyle(child).backdropFilter.startsWith('blur('),
    );
    const blurPx = (layer: Element) => {
      const match =
        getComputedStyle(layer).backdropFilter.match(/blur\(([0-9.]+)px\)/);
      return match ? Number(match[1]) : 0;
    };

    return {
      ariaHidden: element.getAttribute('aria-hidden'),
      blurLayers: blurLayers.length,
      imageCount: element.querySelectorAll('img').length,
      pointerEvents: style.pointerEvents,
      borderRadius: style.borderRadius,
      heightRatio: frostBox.height / cardBox.height,
      innerBlurPx: blurPx(blurLayers[0]!),
      outerBlurPx: blurPx(blurLayers.at(-1)!),
    };
  });
}
