import { expect, test, type Page } from '@playwright/test';

async function viewportModel(page: Page) {
  await page.addInitScript(() => {
    const viewport = Object.assign(new EventTarget(), {
      height: window.innerHeight,
      width: window.innerWidth,
      offsetTop: 0,
      offsetLeft: 0,
      scale: 1,
    });
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: viewport,
    });
    Object.assign(window, { __formViewport: viewport });
  });
}
async function resizeVisible(page: Page, height: number, top = 0, scale = 1) {
  await page.evaluate(
    ({ height, top, scale }) => {
      const viewport = (
        window as typeof window & {
          __formViewport: EventTarget & {
            height: number;
            offsetTop: number;
            scale: number;
          };
        }
      ).__formViewport;
      Object.assign(viewport, {
        height,
        width: window.innerWidth / scale,
        offsetTop: top,
        scale,
      });
      viewport.dispatchEvent(new Event('resize'));
    },
    { height, top, scale },
  );
}
async function owner(page: Page) {
  const timestamp = '2026-10-26T00:00:00.000Z';
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      json: {
        user: {
          id: 'f1991d27-5991-40a2-8913-f5d9940c61ee',
          email: 'form-ux@bidplace.test',
          phone: null,
          emailVerifiedAt: timestamp,
          phoneVerifiedAt: null,
          acceptedRulesVersion: '2026-10-01',
          displayName: 'Form UX',
          slug: 'form-ux',
          role: 'user',
          status: 'active',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      },
    }),
  );
  await page.route('**/api/seller/profile', (route) =>
    route.fulfill({
      status: 404,
      json: { status: 404, code: 'not_found', message: 'Not found' },
    }),
  );
}
async function expectSafeFields(page: Page) {
  const fields = page.locator('input,textarea,select,[contenteditable="true"]');
  const sizes = await fields.evaluateAll((es) =>
    es
      .filter((e) => e.getBoundingClientRect().height > 0)
      .map((e) => ({
        label: e.getAttribute('aria-label'),
        size: Number.parseFloat(getComputedStyle(e).fontSize),
        touch: getComputedStyle(e).touchAction,
      })),
  );
  expect(sizes.length).toBeGreaterThan(0);
  expect(sizes.filter((x) => x.size < 16)).toEqual([]);
  expect(sizes.every((x) => x.touch === 'manipulation')).toBe(true);
}

for (const viewport of [
  { width: 320, height: 740 },
  { width: 390, height: 874 },
  { width: 874, height: 390 },
]) {
  test(`mobile editable text is readable without changing accessible viewport at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    for (const path of ['/login', '/register', '/forgot-password']) {
      await page.goto(path);
      await expect(page.locator('input').first()).toBeVisible();
      await expectSafeFields(page);
      const meta = await page
        .locator('meta[name="viewport"]')
        .getAttribute('content');
      expect(meta).not.toMatch(
        /user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1/,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
  });
}

test('Work form retains long values and scroll through visible viewport resize and pinch', async ({
  page,
}) => {
  await viewportModel(page);
  await owner(page);
  await page.goto('/products/new');
  const title = page.getByRole('textbox', { name: /Название/ });
  await expect(title).toBeVisible();
  await expectSafeFields(page);
  const text = 'Работа с длинным названием и описанием';
  await title.fill(text);
  const uniqueness = page.getByRole('textbox', {
    name: /Уникальность или тираж/,
  });
  await uniqueness.fill('Единственный экземпляр. '.repeat(20));
  await resizeVisible(page, 420);
  await expect
    .poll(async () =>
      Math.round(
        (await page
          .getByTestId('app-shell-content')
          .filter({ has: page.getByTestId('form-page') })
          .boundingBox())!.height,
      ),
    )
    .toBeLessThanOrEqual(420);
  await title.focus();
  await uniqueness.focus();
  await expect(title).toHaveValue(text);
  await expect(uniqueness).toHaveValue('Единственный экземпляр. '.repeat(20));
  const scroller = page.getByTestId('form-page');
  await scroller.evaluate((e) => {
    e.scrollTop = 120;
  });
  const scroll = await scroller.evaluate((e) => e.scrollTop);
  await resizeVisible(page, 210, 80, 2);
  expect(await scroller.evaluate((e) => e.scrollTop)).toBe(scroll);
  await expect
    .poll(async () =>
      Math.round(
        (await page
          .getByTestId('app-shell-content')
          .filter({ has: page.getByTestId('form-page') })
          .boundingBox())!.height,
      ),
    )
    .toBeLessThanOrEqual(420);
  await resizeVisible(page, 874);
  await expect(title).toHaveValue(text);
  await expectSafeFields(page);
});

test('profile input stays readable and in its visible shell without discarding edits', async ({
  page,
}) => {
  await viewportModel(page);
  await owner(page);
  await page.goto('/profile');
  const chooser = page.waitForEvent('filechooser');
  await page
    .getByRole('button', { name: 'Загрузить фото', exact: true })
    .click();
  await (await chooser).setFiles('e2e/fixtures/profile-photo.png');
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  const name = page.getByRole('textbox', {
    name: 'Имя или название',
    exact: true,
  });
  await expect(name).toBeVisible();
  await name.fill('Редактируемый автор');
  await expectSafeFields(page);
  await resizeVisible(page, 410, 25);
  await expect
    .poll(async () =>
      Math.round(
        (await page
          .getByTestId('app-shell-content')
          .filter({ has: page.getByTestId('form-page') })
          .boundingBox())!.height,
      ),
    )
    .toBeLessThanOrEqual(410);
  await resizeVisible(page, 874);
  await expect(name).toHaveValue('Редактируемый автор');
});

test('dock hides only during input occlusion and returns even while the field stays focused', async ({
  page,
}) => {
  await viewportModel(page);
  await page.goto('/explore?section=works&sort=newest');
  await page
    .getByRole('button', { name: 'Открыть поиск', exact: true })
    .click();
  const search = page.getByRole('textbox', { name: 'Поиск', exact: true });
  await expect(search).toBeVisible();
  await search.focus();
  const dock = page.getByTestId('figma-floating-dock');
  await expect(dock).toBeVisible();
  await resizeVisible(page, 420);
  await expect
    .poll(() =>
      page.evaluate(() =>
        document
          .querySelector('.figma-dock-layer')
          ?.getAttribute('data-viewport-reduced'),
      ),
    )
    .toBe('true');
  await expect(dock).toBeHidden();
  await expect(search).toBeFocused();
  await resizeVisible(page, 210, 50, 2);
  await expect(dock).toBeHidden();
  await resizeVisible(page, 437, 0, 2);
  await expect(dock).toBeVisible();
  await expect(search).toBeFocused();
  await expect(page).toHaveURL(/section=works&sort=newest/);
});

test('auth uses the reduced visible viewport and does not reset entered values', async ({
  page,
}) => {
  await viewportModel(page);
  await page.goto('/login');
  const email = page.getByRole('textbox', {
    name: 'Электронная почта',
    exact: true,
  });
  await email.fill('form-ux@bidplace.test');
  await resizeVisible(page, 390, 30);
  await expect
    .poll(async () => (await page.locator('#app-dialog-host').boundingBox())!.y)
    .toBe(30);
  expect((await page.locator('#app-dialog-host').boundingBox())!.height).toBe(
    390,
  );
  await resizeVisible(page, 874);
  await expect(email).toHaveValue('form-ux@bidplace.test');
});

test.describe('desktop typography', () => {
  test.use({
    isMobile: false,
    hasTouch: false,
    viewport: { width: 1440, height: 900 },
  });
  test('keeps desktop field metrics and normal zoom configuration', async ({
    page,
  }) => {
    await page.goto('/login');
    const email = page.getByRole('textbox', {
      name: 'Электронная почта',
      exact: true,
    });
    await expect(email).toHaveCSS('font-size', '14px');
  });
});

test('catalog sheet fits the visible viewport while editing without moving focus', async ({
  page,
}) => {
  await viewportModel(page);
  await owner(page);
  await page.goto('/products/new');
  await page.getByRole('button', { name: /Материалы/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Материалы', exact: true });
  await expect(sheet).toBeVisible();
  const search = sheet.getByRole('textbox');
  await search.fill('Материал для работы');
  await resizeVisible(page, 390, 30);
  const host = page.locator('#app-dialog-host');
  await expect
    .poll(async () => Math.round((await host.boundingBox())!.y))
    .toBe(30);
  expect(Math.round((await host.boundingBox())!.height)).toBe(390);
  await expect(search).toBeFocused();
  await expectSafeFields(page);
  await resizeVisible(page, 874);
  await expect(search).toHaveValue('Материал для работы');
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
});

test('registration viewport changes preserve an existing scroll position', async ({
  page,
}) => {
  await viewportModel(page);
  await page.goto('/register');
  await page
    .getByRole('textbox', { name: /почт/i })
    .fill('form-ux@bidplace.test');
  await resizeVisible(page, 260);
  await expect
    .poll(async () =>
      page
        .locator('#auth-sheet')
        .evaluate((sheet) =>
          [...sheet.querySelectorAll('div')].some(
            (e) =>
              ['auto', 'scroll'].includes(getComputedStyle(e).overflowY) &&
              e.scrollHeight > e.clientHeight + 20,
          ),
        ),
    )
    .toBe(true);
  const position = await page.locator('#auth-sheet').evaluate((sheet) => {
    const scroll = [...sheet.querySelectorAll('div')].find(
      (e) =>
        ['auto', 'scroll'].includes(getComputedStyle(e).overflowY) &&
        e.scrollHeight > e.clientHeight + 20,
    )!;
    scroll.dataset.formUxScroll = 'true';
    scroll.scrollTop = 20;
    return scroll.scrollTop;
  });
  expect(position).toBeGreaterThan(0);
  await resizeVisible(page, 240);
  await expect
    .poll(() =>
      page.locator('[data-form-ux-scroll="true"]').evaluate((e) => e.scrollTop),
    )
    .toBe(position);
});

test('rapid login submit sends one request while the operation remains pending', async ({
  page,
}) => {
  let calls = 0;
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/auth/login', async (route) => {
    calls += 1;
    await gate;
    await route.fulfill({
      status: 401,
      json: {
        status: 401,
        code: 'invalid_credentials',
        message: 'Проверьте введённые данные',
      },
    });
  });
  try {
    await page.goto('/login');
    await page
      .getByRole('textbox', { name: 'Электронная почта', exact: true })
      .fill('form-ux@bidplace.test');
    await page
      .getByLabel('Пароль', { exact: true })
      .fill('synthetic-form-ux-value');
    await page
      .getByRole('button', { name: 'Войти', exact: true })
      .evaluate((element) => {
        (element as HTMLElement).click();
        (element as HTMLElement).click();
      });
    await expect.poll(() => calls).toBe(1);
  } finally {
    release();
  }
});

test('Chromium keeps real pinch zoom available without resizing the form layout', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'CDP pinch injection is Chromium-only; physical Safari acceptance remains pending',
  );
  await owner(page);
  await page.goto('/products/new');
  const title = page.getByRole('textbox', { name: /Название/ });
  await title.fill('Pinch zoom сохраняется');
  const shell = page
    .getByTestId('app-shell-content')
    .filter({ has: page.getByTestId('form-page') });
  const before = (await shell.boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.synthesizePinchGesture', {
    x: 180,
    y: 250,
    scaleFactor: 1.5,
    relativeSpeed: 200,
    gestureSourceType: 'touch',
  });
  await expect
    .poll(() => page.evaluate(() => window.visualViewport!.scale))
    .toBeGreaterThan(1.2);
  await expect(title).toHaveValue('Pinch zoom сохраняется');
  expect(Math.round((await shell.boundingBox())!.height)).toBe(
    Math.round(before.height),
  );
  await cdp.detach();
});
