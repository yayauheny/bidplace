import { expect, test, type Locator, type Page } from '@playwright/test';
import { installAccountPresentation } from './support/account-presentation-fixture';

const imageId = '10000000-0000-4000-8000-000000000001';

test('floating dock is one glass capsule with live blur and no icon halo', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

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

  const home = dock.getByLabel('Главная', { exact: true });
  const profile = dock.getByLabel('Профиль', { exact: true });
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

  const brandLogo = page.getByTestId('page-content-column').getByRole('link', {
    name: 'bidplace — на главную',
    exact: true,
  });
  await expect(brandLogo.getByTestId('bidplace-brand-mark')).toHaveCount(1);
  await brandLogo.evaluate((element) => {
    element.addEventListener(
      'click',
      (event) => {
        element.setAttribute('data-keyboard-activated', 'true');
        event.preventDefault();
        event.stopPropagation();
      },
      true,
    );
  });
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });
  for (let step = 0; step < 8; step += 1) {
    if (await brandLogo.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press('Tab');
  }
  await expect(brandLogo).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(brandLogo).toHaveAttribute('data-keyboard-activated', 'true');

  const dockHome = dock.getByLabel('Главная', { exact: true });
  await dockHome.evaluate((element) => {
    element.addEventListener(
      'click',
      (event) => {
        element.setAttribute('data-keyboard-activated', 'true');
        event.preventDefault();
        event.stopPropagation();
      },
      true,
    );
  });
  for (let step = 0; step < 32; step += 1) {
    if (await dockHome.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press('Tab');
  }
  await expect(dockHome).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dockHome).toHaveAttribute('data-keyboard-activated', 'true');

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


test('dock fills the current destination and follows navigation history without changing geometry', async ({ page }) => {
  await installAccountPresentation(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const dock = page.getByTestId('figma-floating-dock');
  const labels = ['Главная', 'Поиск', 'Добавить', 'Профиль'];
  const expectSelected = async (selected: string) => {
    await expect(dock).toBeVisible();
    for (const label of labels) {
      const item = dock.getByLabel(label, { exact: true });
      const icon = item.locator('svg');
      await expect(icon).toHaveAttribute('fill', label === selected ? '#2A2A2A' : 'none');
      await expect(icon).toHaveAttribute('width', '24');
      await expect(icon).toHaveAttribute('height', '24');
    }
    expect((await dock.boundingBox())!.width).toBe(232);
    expect((await dock.boundingBox())!.height).toBe(64);
  };
  await expectSelected('Главная');
  await expect(dock.getByLabel('Главная', { exact: true })).toHaveAttribute('aria-current', 'page');
  await dock.getByLabel('Поиск', { exact: true }).click();
  await expect(page).toHaveURL(/\/explore\?/);
  await expectSelected('Поиск');
  await page.getByRole('button', { name: 'Закрыть поиск' }).click();
  await expectSelected('Поиск');
  await page.reload();
  await expectSelected('Поиск');
  await dock.screenshot({ path: '/private/tmp/bidplace-dock-search.png' });
  await dock.getByLabel('Главная', { exact: true }).click();
  await expectSelected('Главная');
  await page.goBack();
  await expectSelected('Поиск');
  await page.goForward();
  await expectSelected('Главная');
  await dock.screenshot({ path: '/private/tmp/bidplace-dock-home.png' });
  await dock.getByLabel('Профиль', { exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expectSelected('Профиль');
  await page.reload();
  await expectSelected('Профиль');
  await dock.screenshot({ path: '/private/tmp/bidplace-dock-profile.png' });
  await expect(dock.getByLabel('Профиль', { exact: true })).toHaveAttribute('aria-current', 'page');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await dock.getByLabel('Главная', { exact: true }).click();
  await expectSelected('Главная');
});
