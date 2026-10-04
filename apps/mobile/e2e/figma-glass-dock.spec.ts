import { expect, test, type Locator, type Page } from '@playwright/test';

const imageId = '10000000-0000-4000-8000-000000000001';

test('floating dock is one glass capsule with live blur and no icon halo', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');

  const dock = page.getByTestId('figma-floating-dock');
  await expect(dock).toBeVisible();
  await expect(page.getByTestId('figma-floating-dock')).toHaveCount(1);

  const chrome = await readDockChrome(dock);
  expect(chrome.width).toBe(232);
  expect(chrome.height).toBe(64);
  expect(chrome.className).toBe('figma-glass');
  expect(chrome.parentClass).toBe('figma-dock-layer');
  expect(chrome.portaledToBody).toBe(true);
  expect(chrome.dockFilter).toBe('none');
  expect(chrome.dockBoxShadow).toBe('none');
  expect(chrome.dockBackdropFilter).toBe('blur(6px)');
  expect(chrome.backdropFilter).toBe('blur(6px)');
  expect(chrome.backdropBackground).toBe('rgba(255, 255, 255, 0.6)');
  expect(chrome.backdropChildCount).toBe(2);
  expect(chrome.strokeBackgroundImage).toContain('rgb(222, 222, 222)');
  expect(chrome.strokeBackgroundImage).toContain('rgb(243, 243, 243)');
  expect(chrome.contentChildCount).toBe(4);
  expect(chrome.labels).toEqual(['Главная', 'Поиск', 'Добавить', 'Профиль']);
  expect(chrome.fabCount).toBe(0);

  const home = page.getByLabel('Главная');
  const profile = page.getByLabel('Профиль');
  expect(await readItemSurface(home)).toMatchObject({
    borderRadius: '999px',
    boxShadow: 'none',
    filter: 'none',
  });
  expect(await readItemSurface(profile)).toMatchObject({
    borderRadius: '999px',
    boxShadow: 'none',
    filter: 'none',
  });

  await home.focus();
  const focused = await readItemSurface(home);
  expect(focused).toMatchObject({
    boxShadow: 'none',
    filter: 'none',
    outlineStyle: 'solid',
    transitionDuration: '0.08s',
  });

  await home.evaluate((element) => {
    element.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        event.stopPropagation();
      },
      true,
    );
  });
  const homeBox = await home.boundingBox();
  expect(homeBox).toBeTruthy();
  await page.mouse.move(
    homeBox!.x + homeBox!.width / 2,
    homeBox!.y + homeBox!.height / 2,
  );
  await page.mouse.down();
  expect(await readItemSurface(home)).toMatchObject({
    boxShadow: 'none',
    filter: 'none',
  });
  await page.mouse.up();
  await expect(page.getByTestId('figma-floating-dock')).toHaveCount(1);

  if (test.info().project.name !== 'webkit') {
    await expectLiveBlur(dock, dock);
  }
});

test('dock glass samples page content without a split search FAB', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockPortfolioHome(page);
  await page.goto('/');

  const dock = page.getByTestId('figma-floating-dock');
  await expect(dock).toBeVisible();
  await expect(page.getByText('Работа с живым фоном')).toBeVisible();
  await expect(page.getByLabel('Поиск')).toBeVisible();
  await expect(page.getByTestId('figma-floating-dock')).toHaveCount(1);

  const chrome = await readDockChrome(dock);
  expect(chrome.width).toBe(232);
  expect(chrome.height).toBe(64);
  expect(chrome.labels).toEqual(['Главная', 'Поиск', 'Добавить', 'Профиль']);
  expect(chrome.fabCount).toBe(0);
  expect(chrome.dockBackdropFilter).toBe('blur(6px)');
  expect(chrome.backdropFilter).toBe('blur(6px)');
  expect(chrome.backdropChildCount).toBe(2);

  if (test.info().project.name !== 'webkit') {
    await expectLiveBlur(dock, dock);
  }
});

async function readDockChrome(dock: Locator) {
  return dock.evaluate((element) => {
    const style = getComputedStyle(element);
    const backdrop = element;
    const stroke = element.querySelector('[data-testid="figma-glass-stroke"]');
    const content = element.querySelector('.figma-glass-content');
    const bounds = element.getBoundingClientRect();
    const backdropStyle = backdrop ? getComputedStyle(backdrop) : null;
    const labels = content
      ? [...content.querySelectorAll('[aria-label]')].map(
          (item) => item.getAttribute('aria-label') ?? '',
        )
      : [];
    const nearby = [...document.querySelectorAll('body *')].filter((node) => {
      if (!(node instanceof HTMLElement) || node === element) return false;
      const rect = node.getBoundingClientRect();
      return (
        rect.width === 64 &&
        rect.height === 64 &&
        Math.abs(rect.top - bounds.top) < 8
      );
    });

    return {
      width: bounds.width,
      height: bounds.height,
      className: element.className,
      parentClass: element.parentElement?.className ?? '',
      portaledToBody: element.parentElement?.parentElement === document.body,
      dockFilter: style.filter,
      dockBoxShadow: style.boxShadow,
      dockBackdropFilter:
        style.backdropFilter ||
        (style as CSSStyleDeclaration & { webkitBackdropFilter?: string })
          .webkitBackdropFilter ||
        'none',
      backdropFilter:
        backdropStyle?.backdropFilter ||
        (backdropStyle as CSSStyleDeclaration & {
          webkitBackdropFilter?: string;
        } | null)?.webkitBackdropFilter ||
        'none',
      backdropBackground: backdropStyle?.backgroundColor ?? '',
      backdropChildCount: backdrop?.childElementCount ?? -1,
      strokeBackgroundImage: stroke
        ? getComputedStyle(stroke).backgroundImage
        : '',
      contentChildCount: content?.childElementCount ?? -1,
      labels,
      fabCount: nearby.length,
    };
  });
}

async function readItemSurface(item: Locator) {
  return item.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      borderRadius: style.borderRadius,
      boxShadow: style.boxShadow,
      filter: style.filter,
      outlineStyle: style.outlineStyle,
      transitionDuration: style.transitionDuration,
    };
  });
}

async function expectLiveBlur(dock: Locator, backdrop: Locator) {
  await dock.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    document.querySelector('[data-testid="dock-blur-probe"]')?.remove();
    const probe = document.createElement('div');
    probe.dataset.testid = 'dock-blur-probe';
    Object.assign(probe.style, {
      position: 'fixed',
      left: `${bounds.left}px`,
      top: `${bounds.top}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      zIndex: '19',
      background: 'repeating-linear-gradient(90deg, #111 0 2px, #fff 2px 4px)',
    });
    document.body.insertBefore(probe, element.parentElement);
  });

  const withBlur = await dock.screenshot();
  await backdrop.evaluate((element) => {
    const htmlElement = element as HTMLElement;
    htmlElement.style.backdropFilter = 'none';
    (
      htmlElement.style as CSSStyleDeclaration & {
        webkitBackdropFilter?: string;
      }
    ).webkitBackdropFilter = 'none';
  });
  const withoutBlur = await dock.screenshot();
  expect(withBlur.equals(withoutBlur)).toBe(false);
}

async function mockPortfolioHome(page: Page) {
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
              biography: null,
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
}
