import { expect, test, type Locator, type Page } from '@playwright/test';
import { lightColorMap } from '@bidplace/design-tokens';

function sampleDimmingFrames(page: Page) {
  return page.evaluate(async (color) => {
    const probe = document.createElement('div');
    probe.style.backgroundColor = color;
    const normalized = probe.style.backgroundColor;
    const samples: number[] = [];
    for (let frame = 0; frame < 30; frame++) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      let transmission = 1;
      for (const element of document.querySelectorAll('div')) {
        const style = getComputedStyle(element);
        if (style.backgroundColor !== normalized) continue;
        const rect = element.getBoundingClientRect();
        if (
          rect.left > 2 ||
          rect.top > 2 ||
          rect.right <= 2 ||
          rect.bottom <= 2
        )
          continue;
        let opacity = Number(style.opacity);
        for (
          let parent = element.parentElement;
          parent;
          parent = parent.parentElement
        ) {
          const parentStyle = getComputedStyle(parent);
          opacity *= Number(parentStyle.opacity);
          if (
            parentStyle.display === 'none' ||
            parentStyle.visibility === 'hidden'
          )
            opacity = 0;
        }
        transmission *= 1 - 0.5 * opacity;
      }
      samples.push(1 - transmission);
    }
    return samples;
  }, lightColorMap.modalDimmer);
}

async function rememberLoadedImages(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          [...document.images].filter(
            (image) => image.complete && image.naturalWidth > 0,
          ).length,
      ),
    )
    .toBeGreaterThan(0);
  await page.evaluate(() => {
    window.__images = [...document.images].filter(
      (image) => image.complete && image.naturalWidth > 0,
    );
  });
}

async function pull(page: Page, handle: Locator, distance: number) {
  await handle.click({ trial: true });
  const box = await handle.boundingBox();
  if (!box) throw new Error('Missing sheet header');
  await page.mouse.move(box.x + box.width / 2, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 10 + distance, {
    steps: 12,
  });
  await page.mouse.up();
}

test('live Home keeps loaded images through login, and author share closes by header', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/');
  const home = page.getByTestId('home-scroll');
  await expect(
    page.getByText('Открытие недели', { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator('img')
        .evaluateAll((images) =>
          images.some(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await home.evaluate((node) => {
    node.scrollTop = 120;
  });
  const before = await home.evaluate((node) => node.scrollTop);
  await page.evaluate(() => {
    window.__images = [...document.images];
  });
  await page
    .getByTestId('figma-floating-dock')
    .getByLabel('Профиль', { exact: true })
    .click();
  await expect(page.locator('#auth-sheet')).toBeVisible();
  await page
    .locator('#auth-sheet [data-sheet-drag-handle]')
    .click({ trial: true });
  await page.screenshot({
    path: test.info().outputPath('login-preserved-background.png'),
  });
  expect(
    await page.evaluate(() =>
      window.__images.every((image) => image.isConnected),
    ),
  ).toBe(true);
  await pull(page, page.locator('[data-sheet-drag-handle]').first(), 130);
  await expect(page).toHaveURL(/\/$/);
  expect(await home.first().evaluate((node) => node.scrollTop)).toBe(before);
  expect(
    await page.evaluate(() =>
      window.__images.every((image) => image.isConnected),
    ),
  ).toBe(true);
  await page
    .getByRole('button', { name: 'Смотреть профиль', exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/seller\//);
  const profileUrl = page.url();
  await page.evaluate(() => {
    window.__images = [...document.images];
  });
  await page
    .getByTestId('figma-floating-dock')
    .getByLabel('Профиль', { exact: true })
    .click();
  await expect(page.locator('#auth-sheet')).toBeVisible();
  expect(
    await page.evaluate(() =>
      window.__images.every((image) => image.isConnected),
    ),
  ).toBe(true);
  await pull(
    page,
    page.locator('#auth-sheet [data-sheet-drag-handle]').first(),
    130,
  );
  await expect(page).toHaveURL(profileUrl);
  expect(
    await page.evaluate(() =>
      window.__images.every((image) => image.isConnected),
    ),
  ).toBe(true);
  await page
    .getByRole('button', { name: 'Поделиться профилем', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog
    .locator('[data-sheet-drag-handle]')
    .first()
    .click({ trial: true });
  await page.screenshot({
    path: test.info().outputPath('profile-share-sheet.png'),
  });
  await pull(page, dialog.locator('[data-sheet-drag-handle]').first(), 10);
  await expect(dialog).toBeVisible();
  await pull(page, dialog.locator('[data-sheet-drag-handle]').first(), 125);
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Поделиться профилем', exact: true }),
  ).toBeFocused();
});

test('live catalog, Back and author navigation stay usable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Смотреть все', exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/works/);
  await expect(
    page.getByText('Каталог работ на Bidplace', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Фильтры/ }).click();
  const filters = page.getByRole('dialog', { name: 'Фильтры', exact: true });
  await expect(filters).toBeVisible();
  await pull(page, filters.locator('[data-sheet-drag-handle]').first(), 130);
  await expect(filters).not.toBeVisible();
  await expect(page).toHaveURL(/\/works/);
  await page.goBack();
  await expect(
    page.getByText('Открытие недели', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Смотреть все', exact: true })
    .nth(1)
    .click();
  await expect(page).toHaveURL(/\/authors/);
});

test('auth sheet transitions keep background dimming constant in both directions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/');
  const home = page.getByTestId('home-scroll');
  await expect(
    page.getByText('Открытие недели', { exact: true }),
  ).toBeVisible();
  await home.evaluate((node) => {
    node.scrollTop = 120;
  });
  await page
    .getByTestId('figma-floating-dock')
    .getByLabel('Профиль', { exact: true })
    .click();
  await page
    .locator('#auth-sheet [data-sheet-drag-handle]')
    .click({ trial: true });
  await rememberLoadedImages(page);
  const scrollTop = await home.evaluate((node) => node.scrollTop);
  for (const direction of ['forgot', 'login'] as const) {
    const frames = sampleDimmingFrames(page);
    if (direction === 'forgot') {
      await page
        .getByRole('link', { name: 'Забыли пароль?', exact: true })
        .click();
      await expect(
        page.getByText('Восстановление пароля', { exact: true }),
      ).toBeVisible();
    } else {
      await page
        .getByRole('link', { name: 'Вернуться ко входу', exact: true })
        .click();
      await expect(
        page
          .locator('#auth-sheet')
          .getByText('Вход на Bidplace', { exact: true }),
      ).toBeVisible();
    }
    const samples = await frames;
    if (direction === 'forgot')
      await page.screenshot({
        path: test.info().outputPath('auth-transition-forgot.png'),
      });
    expect(
      Math.min(...samples),
      `${direction}: minimum dimming`,
    ).toBeGreaterThanOrEqual(0.49);
    expect(
      Math.max(...samples),
      `${direction}: maximum dimming`,
    ).toBeLessThanOrEqual(0.51);
    await expect(home).toBeAttached();
    expect(await home.evaluate((node) => node.scrollTop)).toBe(scrollTop);
    expect(
      await page.evaluate(() =>
        window.__images.every((image) => image.isConnected),
      ),
    ).toBe(true);
    await test.info().attach(`${direction}-dimming-frames`, {
      body: JSON.stringify(samples),
      contentType: 'application/json',
    });
  }
  await page
    .locator('#auth-sheet [data-sheet-drag-handle]')
    .click({ trial: true });
  await page.screenshot({
    path: test.info().outputPath('auth-transition-settled.png'),
  });
});

for (const target of ['QR', 'report'] as const) {
  test(`profile sheet handoff to ${target} keeps dimming and background images`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 874 });
    await page.goto('/seller/vex');
    const trigger =
      target === 'QR' ? 'Действия с профилем' : 'Поделиться профилем';
    await page.getByRole('button', { name: trigger, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog
      .locator('[data-sheet-drag-handle]')
      .first()
      .click({ trial: true });
    await page.evaluate(() => {
      window.__images = [...document.images].filter(
        (image) => image.complete && image.naturalWidth > 0,
      );
    });
    const frames = sampleDimmingFrames(page);
    await page
      .getByRole('button', {
        name: target === 'QR' ? 'QR-код профиля' : 'Пожаловаться на автора',
        exact: true,
      })
      .click();
    await expect(
      page.getByRole('dialog', {
        name: target === 'QR' ? 'Поделиться' : 'Скоро появится',
        exact: true,
      }),
    ).toBeVisible();
    const samples = await frames;
    expect(
      Math.min(...samples),
      'handoff must not lighten the background',
    ).toBeGreaterThanOrEqual(0.49);
    expect(
      Math.max(...samples),
      'handoff must not double the dimmer',
    ).toBeLessThanOrEqual(0.51);
    expect(
      await page.evaluate(() =>
        window.__images.every((image) => image.isConnected),
      ),
    ).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: trigger, exact: true }),
    ).toBeFocused();
  });
}

test('page Back removes the inactive page sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Смотреть профиль', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Поделиться профилем', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByTestId('figma-floating-dock')).toBeVisible();
});

test('catalog filter drilldown keeps the same dimmer and cards', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/works');
  await page.getByRole('button', { name: /Фильтры/ }).click();
  await page
    .getByRole('dialog', { name: 'Фильтры', exact: true })
    .locator('[data-sheet-drag-handle]')
    .click({ trial: true });
  for (const direction of ['category', 'back'] as const) {
    const frames = sampleDimmingFrames(page);
    await page
      .getByRole('button', {
        name: direction === 'category' ? 'Категория, Не выбрано' : 'Назад',
        exact: true,
      })
      .click();
    await expect(
      page.getByRole('dialog', {
        name: direction === 'category' ? 'Категория' : 'Фильтры',
        exact: true,
      }),
    ).toBeVisible();
    const samples = await frames;
    expect(Math.min(...samples)).toBeGreaterThanOrEqual(0.49);
    expect(Math.max(...samples)).toBeLessThanOrEqual(0.51);
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('search tabs and query changes retain the loaded Home background', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/');
  const home = page.getByTestId('home-scroll');
  await expect(
    page.getByText('Открытие недели', { exact: true }),
  ).toBeVisible();
  await home.evaluate((node) => {
    node.scrollTop = 120;
  });
  await rememberLoadedImages(page);
  await page
    .getByTestId('figma-floating-dock')
    .getByLabel('Поиск', { exact: true })
    .click();
  const search = page.getByTestId('search-overlay');
  await expect(search).toBeVisible();
  for (const name of ['Авторы', 'Работы', 'Категории']) {
    const frames = sampleDimmingFrames(page);
    await search.getByRole('tab', { name, exact: true }).click();
    const samples = await frames;
    expect(Math.min(...samples)).toBeGreaterThanOrEqual(0.49);
    expect(Math.max(...samples)).toBeLessThanOrEqual(0.51);
    expect(
      await page.evaluate(() =>
        window.__images.every((image) => image.isConnected),
      ),
    ).toBe(true);
  }
  await page.getByTestId('search-overlay-query').fill('vex');
  await expect(page).toHaveURL(/oq=vex/);
  await page
    .getByRole('button', { name: 'Закрыть поиск', exact: true })
    .click();
  await expect(search).toHaveCount(0);
  expect(await home.evaluate((node) => node.scrollTop)).toBe(120);
  expect(
    await page.evaluate(() =>
      window.__images.every((image) => image.isConnected),
    ),
  ).toBe(true);
});

test('work share and full photo viewer preserve the original gallery images', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/product/aliceGlass1');
  await expect(
    page.getByRole('button', { name: 'Открыть фото 1', exact: true }),
  ).toBeVisible();
  await rememberLoadedImages(page);
  await page
    .getByRole('button', { name: 'Поделиться работой', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Поделиться', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Открыть фото 1', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      window.__images.every((image) => image.isConnected),
    ),
  ).toBe(true);
});
