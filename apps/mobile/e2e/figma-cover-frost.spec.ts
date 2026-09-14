import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { e2eEvidenceDir } from './support/evidence-dir';

const workImageId = '10000000-0000-4000-8000-000000000001';
const artifactDir = resolve(e2eEvidenceDir, 'stabilization');

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

  await mkdir(artifactDir, { recursive: true });
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
    blurLayers: 1,
    gradientLayers: 1,
    imageCount: 0,
    innerPlateCount: 0,
    pointerEvents: 'none',
    borderRadius: '0px',
    position: 'absolute',
  });
  // Frost hugs the overlay text like the Figma auto-layout frames: one-line
  // title + chip = 12 + 22 + 8 + 24 + 12; author top = 20 + 24 + 12.
  expect(workMetrics.fillsZone).toBe(true);
  expect(authorTopMetrics.fillsZone).toBe(true);
  expect(authorBottomMetrics.fillsZone).toBe(true);
  expect(workMetrics.zoneHeight).toBe(78);
  expect(authorTopMetrics.zoneHeight).toBe(56);
  expect(authorBottomMetrics.zoneHeight).toBe(76);
  expect(workMetrics.outerBlurPx).toBeCloseTo(30, 1);
  expect(authorTopMetrics.outerBlurPx).toBeCloseTo(20, 1);
  expect(authorBottomMetrics.outerBlurPx).toBeCloseTo(30, 1);
  expect(workMetrics.maskImage).toContain('linear-gradient');
  expect(authorTopMetrics.maskImage).toContain('linear-gradient');
  expect(authorBottomMetrics.maskImage).toContain('linear-gradient');
  expect(workMetrics.gradientImage).toContain('linear-gradient');
  expect(authorTopMetrics.gradientImage).toContain('linear-gradient');
  expect(authorBottomMetrics.gradientImage).toContain('linear-gradient');
  expect(authorTopMetrics.innerPlateCount).toBe(0);
  expect(authorBottomMetrics.innerPlateCount).toBe(0);

  const workCard = page.locator('a[href^="/product/"]').first();
  const authorCard = page.locator('a[href^="/seller/"]').first();
  expect(await workCard.boundingBox()).toMatchObject({
    width: 366,
    height: 488,
  });
  expect(await authorCard.boundingBox()).toMatchObject({
    width: 366,
    height: 488,
  });
  await expect(workCard).toHaveCSS('border-radius', '24px');
  await expect(authorCard).toHaveCSS('border-radius', '28px');

  const frostShot = await workFrost.screenshot();
  await workCard.screenshot({
    path: resolve(artifactDir, `${engine(page)}-cover-frost-390.png`),
  });
  expectPngMatchesBox(frostShot, await workFrost.boundingBox(), await deviceScale(page));

  // Chromium composites backdrop-filter into element screenshots. WebKit does
  // not, so pixel inequality of blur-on vs blur-off is only deterministic there.
  if (engine(page) === 'chromium') {
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
    expect(frostShot.equals(withoutBlur)).toBe(false);
  }
});

async function readFrost(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    const zone = element.parentElement;
    if (!zone) {
      throw new Error('Cover frost must sit inside an overlay zone');
    }
    const frostBox = element.getBoundingClientRect();
    const zoneBox = zone.getBoundingClientRect();
    const blurLayers = [...element.children].filter((child) =>
      getComputedStyle(child).backdropFilter.startsWith('blur('),
    );
    const blurPx = (layer: Element) => {
      const match =
        getComputedStyle(layer).backdropFilter.match(/blur\(([0-9.]+)px\)/);
      return match ? Number(match[1]) : 0;
    };

    const layers = [...element.children];
    const gradientLayers = layers.filter((child) =>
      getComputedStyle(child).backgroundImage.includes('linear-gradient'),
    );
    const innerPlates = layers.filter((child) => {
      const layer = getComputedStyle(child);
      const radius = Number.parseFloat(layer.borderRadius);
      const fill = layer.backgroundColor;
      const isTransparent = fill === 'rgba(0, 0, 0, 0)' || fill === 'transparent';
      const isGradient = layer.backgroundImage.includes('linear-gradient');
      const isBlur = layer.backdropFilter.startsWith('blur(');
      return radius > 0 || (Boolean(fill) && !isTransparent && !isGradient && !isBlur);
    });

    return {
      ariaHidden: element.getAttribute('aria-hidden'),
      blurLayers: blurLayers.length,
      gradientLayers: gradientLayers.length,
      imageCount: element.querySelectorAll('img').length,
      innerPlateCount: innerPlates.length,
      pointerEvents: style.pointerEvents,
      borderRadius: style.borderRadius,
      position: style.position,
      fillsZone:
        Math.abs(frostBox.height - zoneBox.height) < 0.5 &&
        Math.abs(frostBox.width - zoneBox.width) < 0.5 &&
        Math.abs(frostBox.top - zoneBox.top) < 0.5,
      zoneHeight: Math.round(zoneBox.height),
      outerBlurPx: blurPx(blurLayers.at(-1)!),
      maskImage: getComputedStyle(blurLayers[0]!).maskImage,
      gradientImage: getComputedStyle(gradientLayers[0]!).backgroundImage,
    };
  });
}

function engine(page: Page) {
  return page.context().browser()?.browserType().name() ?? 'browser';
}

async function deviceScale(page: Page) {
  return page.evaluate(() => window.devicePixelRatio);
}

function expectPngMatchesBox(
  png: Buffer,
  box: { width: number; height: number } | null,
  scale: number,
) {
  expect(box).not.toBeNull();
  expect(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(
    true,
  );
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  expect(width).toBeGreaterThan(0);
  expect(height).toBeGreaterThan(0);
  expect(Math.abs(width - Math.round(box!.width * scale))).toBeLessThanOrEqual(1);
  expect(Math.abs(height - Math.round(box!.height * scale))).toBeLessThanOrEqual(
    1,
  );
}
