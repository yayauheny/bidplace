import { expect, test, type Page } from '@playwright/test';

const workImageId = '10000000-0000-4000-8000-000000000001';
const longWorkImageId = '10000000-0000-4000-8000-000000000011';
const missingWorkImageId = '10000000-0000-4000-8000-000000000021';
const authorPhotoPath = '/api/sellers/vex/photo';
const longAuthorPhotoPath = '/api/sellers/quantumparadox-long/photo';

const artworkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="264" height="352"><rect width="264" height="352" fill="#cf2b00"/><path d="M0 0h132v352H0z" fill="#148bd1"/></svg>`;

function workItem({
  id,
  publicId,
  title,
  slug,
  imageId,
}: {
  id: string;
  publicId: string;
  title: string;
  slug: string;
  imageId: string;
}) {
  return {
    work: {
      id,
      publicId,
      title,
      story: null,
      categoryId: '10000000-0000-4000-8000-000000000003',
      technique: null,
      materials: null,
      dimensions: null,
      year: 2026,
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
      sharePath: `/works/${publicId}`,
    },
    author: {
      id: '10000000-0000-4000-8000-000000000004',
      slug,
      fullName: 'Тестовый автор',
      country: 'Беларусь',
      city: 'Минск',
      discipline: 'Живопись',
      practice: null,
      profilePhotoUrl: `/api/sellers/${slug}/photo`,
      telegramUrl: null,
      instagramUrl: null,
      websiteUrl: null,
      shortDescription: 'Описание автора',
      achievements: [],
      sharePath: `/authors/${slug}`,
    },
  };
}

function authorItem({
  id,
  slug,
  fullName,
  discipline,
  profilePhotoUrl,
}: {
  id: string;
  slug: string;
  fullName: string;
  discipline: string;
  profilePhotoUrl: string;
}) {
  return {
    id,
    slug,
    fullName,
    country: 'Беларусь',
    city: 'Минск',
    discipline,
    practice: null,
    profilePhotoUrl,
    telegramUrl: null,
    instagramUrl: null,
    websiteUrl: null,
    shortDescription: 'Описание автора',
    achievements: [],
    sharePath: `/authors/${slug}`,
  };
}

async function mockCoverCardHome(page: Page) {
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
  });
  await page.route('**/api/portfolio/home', async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        curatorSelection: null,
        newWorks: [
          workItem({
            id: '10000000-0000-4000-8000-000000000002',
            publicId: 'SHORTWORK01',
            title: 'Желтый сапфир',
            slug: 'quantumparadox',
            imageId: workImageId,
          }),
          workItem({
            id: '10000000-0000-4000-8000-000000000012',
            publicId: 'LONGWORK001',
            title: 'Salvador Dalí Estate & Fundació Gala Сальвадор Дали',
            slug: 'pixelp',
            imageId: longWorkImageId,
          }),
          workItem({
            id: '10000000-0000-4000-8000-000000000022',
            publicId: 'MISSINGWRK1',
            title: 'Картина без изображения',
            slug: 'havoc',
            imageId: missingWorkImageId,
          }),
        ],
        newAuthors: [
          authorItem({
            id: '10000000-0000-4000-8000-000000000031',
            slug: 'vex',
            fullName: 'Илья Васильев',
            discipline: 'Керамика',
            profilePhotoUrl: authorPhotoPath,
          }),
          authorItem({
            id: '10000000-0000-4000-8000-000000000032',
            slug: 'quantumparadox-long',
            fullName: 'Salvador Dalí Estate & Fundació Gala Сальвадор Дали',
            discipline: 'Керамика, Скульптор, Художник по стеклу',
            profilePhotoUrl: longAuthorPhotoPath,
          }),
        ],
      },
    });
  });
  await page.route(`**/api/images/${workImageId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: artworkSvg,
    });
  });
  await page.route(`**/api/images/${longWorkImageId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: artworkSvg,
    });
  });
  await page.route(`**/api/images/${missingWorkImageId}`, async (route) => {
    await route.fulfill({ status: 404, json: { message: 'Not found' } });
  });
  await page.route(`**${authorPhotoPath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: artworkSvg,
    });
  });
  await page.route(`**${longAuthorPhotoPath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: artworkSvg,
    });
  });
}

async function cardBox(locator: ReturnType<Page['getByTestId']>) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Cover card is not visible');
  return { width: Math.round(box.width), height: Math.round(box.height) };
}

test('cover cards keep Figma geometry, portfolio chrome, and content states', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockCoverCardHome(page);
  await page.goto('/');

  const workCards = page.getByTestId('figma-work-cover-card');
  const authorCards = page.getByTestId('figma-author-cover-card');
  await expect(workCards).toHaveCount(3);
  await expect(authorCards).toHaveCount(2);

  const shortWork = workCards.nth(0);
  const longWork = workCards.nth(1);
  const missingWork = workCards.nth(2);
  const oneTagAuthor = authorCards.nth(0);
  const manyTagAuthor = authorCards.nth(1);

  expect(await cardBox(shortWork)).toEqual({ width: 366, height: 488 });
  expect(await cardBox(longWork)).toEqual({ width: 366, height: 488 });
  expect(await cardBox(missingWork)).toEqual({ width: 366, height: 488 });
  expect(await cardBox(oneTagAuthor)).toEqual({ width: 366, height: 488 });
  expect(await cardBox(manyTagAuthor)).toEqual({ width: 366, height: 488 });

  const overflow = await page.evaluate(() => {
    const root = document.scrollingElement ?? document.documentElement;
    return {
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
    };
  });
  expect(overflow.scrollWidth).toBeLessThanOrEqual(390);

  const frost = shortWork.getByTestId('figma-cover-frost');
  await expect(frost).toBeVisible();
  const frostContract = await frost.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      ariaHidden: element.getAttribute('aria-hidden'),
      imageCount: element.querySelectorAll('img').length,
      pointerEvents: style.pointerEvents,
    };
  });
  expect(frostContract).toEqual({
    ariaHidden: 'true',
    imageCount: 0,
    pointerEvents: 'none',
  });

  await expect(page.getByText(/BYN/)).toHaveCount(0);
  await expect(page.getByText('Торги')).toHaveCount(0);
  await expect(page.getByText(/13д|11 сентября/)).toHaveCount(0);

  await expect(shortWork.getByRole('link')).toHaveAttribute(
    'aria-label',
    'Желтый сапфир — @quantumparadox',
  );
  await expect(longWork.getByRole('link')).toHaveAttribute(
    'aria-label',
    'Salvador Dalí Estate & Fundació Gala Сальвадор Дали — @pixelp',
  );
  await expect(oneTagAuthor.getByRole('link')).toHaveAttribute(
    'aria-label',
    'Открыть профиль автора Илья Васильев, @vex, Керамика',
  );
  await expect(manyTagAuthor.getByRole('link')).toHaveAttribute(
    'aria-label',
    'Открыть профиль автора Salvador Dalí Estate & Fundació Gala Сальвадор Дали, @quantumparadox-long, Керамика, Скульптор, Художник по стеклу',
  );

  const shortWorkLink = shortWork.getByRole('link');
  await shortWorkLink.focus();
  await expect
    .poll(async () => {
      return shortWorkLink.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          outlineOffset: style.outlineOffset,
        };
      });
    })
    .toMatchObject({
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineOffset: '2px',
    });

  await expect(
    missingWork.getByLabel('Изображение недоступно: Картина без изображения'),
  ).toBeVisible();
  const missingClip = await missingWork.evaluate((element) => {
    const style = getComputedStyle(element);
    const placeholder = element.querySelector(
      '[aria-label^="Изображение недоступно"]',
    );
    const card = element.getBoundingClientRect();
    const image = placeholder?.getBoundingClientRect();
    return {
      overflow: style.overflow,
      placeholderInside:
        image != null &&
        image.left >= card.left - 1 &&
        image.right <= card.right + 1 &&
        image.top >= card.top - 1 &&
        image.bottom <= card.bottom + 1,
    };
  });
  expect(missingClip).toEqual({ overflow: 'hidden', placeholderInside: true });

  await expect(oneTagAuthor.getByText('Керамика')).toBeVisible();
  await expect(manyTagAuthor.getByText('Художник по стеклу')).toBeVisible();
});
