import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { e2eEvidenceDir } from './support/evidence-dir';

const query = (page: Page) =>
  page.getByRole('textbox', { name: 'Поиск', exact: true });
const header = (page: Page) =>
  page.getByTestId('explore-header').filter({ visible: true });
const scroll = (page: Page) =>
  page.getByTestId('explore-scroll').filter({ visible: true });
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
});

test('Dock opens canonical Explore; X clears only search and replaces history', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByTestId('figma-floating-dock').getByLabel('Поиск').click();
  await expect(page).toHaveURL(/\/explore\?/);
  await expect(query(page)).toBeFocused();
  await query(page).fill('no-results-zzzz');
  await expect(page.getByText('Ничего не найдено')).toBeVisible();
  const historyLength = await page.evaluate(() => history.length);
  await page.getByRole('button', { name: 'Закрыть поиск' }).click();
  await expect(
    page.getByRole('button', { name: 'Открыть поиск' }),
  ).toBeFocused();
  await expect(page).not.toHaveURL(/[?&](q|search)=/);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  await page.getByRole('button', { name: 'Открыть поиск' }).click();
  await expect(query(page)).toHaveValue('');
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
});

test('legacy links preserve relevant filters, active query and reload state', async ({
  page,
}) => {
  for (const [path, section, sort] of [
    ['works', 'works', 'oldest'],
    ['authors', 'authors', 'name'],
  ] as const) {
    await page.goto(`/${path}?q=glass&sort=${sort}&material=Clay&city=Minsk`);
    await expect(page).toHaveURL(new RegExp(`section=${section}`));
    await expect(query(page)).toHaveValue('glass');
    await page.reload();
    await expect(query(page)).toHaveValue('glass');
    await page.getByRole('button', { name: 'Закрыть поиск' }).click();
    await expect(page).toHaveURL(new RegExp(`sort=${sort}`));
    await expect(page).toHaveURL(
      new RegExp(section === 'works' ? 'material=Clay' : 'city=Minsk'),
    );
    await expect(page).not.toHaveURL(
      new RegExp(section === 'works' ? 'city=' : 'material='),
    );
  }
  await page.goto('/search?q=glass&otab=works');
  await expect(page).toHaveURL(/section=works/);
  await expect(query(page)).toHaveValue('glass');
  await page.keyboard.press('Escape');
  await expect(page).not.toHaveURL(/search=1|q=/);
  await expect(header(page)).toBeVisible();
});

test('sections retain independent drafts and categories have no filter toolbar', async ({
  page,
}) => {
  await page.goto(
    '/explore?section=works&search=1&q=glass&material=Glass&sort=oldest',
  );
  await page.getByRole('tab', { name: 'Авторы', exact: true }).click();
  await expect(query(page)).toHaveValue('');
  await query(page).fill('maker');
  await page.getByRole('tab', { name: 'Категории', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Сортировка' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Фильтры' })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Работы', exact: true }).click();
  await expect(query(page)).toHaveValue('glass');
  await expect(page).toHaveURL(/material=Glass/);
  await page.getByRole('tab', { name: 'Авторы', exact: true }).click();
  await expect(query(page)).toHaveValue('maker');
});

test('Escape closes sheets before search and filter sheets contain only section filters', async ({
  page,
}) => {
  await page.goto('/explore?section=works&search=1');
  await page.getByRole('button', { name: 'Фильтры', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Категория', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Материал', { exact: true })).toBeVisible();
  await expect(dialog.getByLabel('Поиск')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(query(page)).toBeEditable();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Открыть поиск' }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Авторы', exact: true }).click();
  await page.getByRole('button', { name: 'Фильтры', exact: true }).click();
  await expect(dialog.getByText('Направление', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Город', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Материал', { exact: true })).toHaveCount(0);
});

test('category navigation creates history and Back restores categories', async ({
  page,
}) => {
  await page.goto('/explore?section=categories&search=1');
  const tile = page.getByTestId('category-search-tile').first();
  await expect(tile).toBeVisible();
  await tile.click();
  await expect(page).toHaveURL(/section=works.*category=/);
  await page.goBack();
  await expect(
    page.getByRole('tab', { name: 'Категории', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await expect(query(page)).toBeEditable();
});

test('Work and Author Back/Forward restore section query and filters', async ({
  page,
}) => {
  for (const [section, label, prefix] of [
    ['works', 'Работы', '/product/'],
    ['authors', 'Авторы', '/seller/'],
  ] as const) {
    await page.goto(`/explore?section=${section}&search=1`);
    const first = scroll(page).locator(`a[href^="${prefix}"]`).first();
    await expect(first).toBeVisible();
    const href = await first.getAttribute('href');
    await first.click();
    await expect(page).toHaveURL(new RegExp(prefix));
    await page.goBack();
    await expect(
      page.getByRole('tab', { name: label, exact: true }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(query(page)).toHaveValue('');
    await page.goForward();
    await expect(page).toHaveURL(new RegExp(href!));
    await page.goBack();
    await expect(query(page)).toBeEditable();
  }
});

test('legacy overlay links survive share alias hops and preserve detail params for Back', async ({
  page,
}) => {
  await page.goto('/explore');
  const href = await scroll(page)
    .locator('a[href^="/product/"]')
    .first()
    .getAttribute('href');
  await page.goto(
    `${href!.replace('/product/', '/works/')}?tab=details&overlay=search&oq=glass&otab=works`,
  );
  await expect(page).toHaveURL(/\/explore\?.*q=glass/);
  await expect(query(page)).toHaveValue('glass');
  await page.goBack();
  await expect(page).toHaveURL(/\/product\/.*tab=details/);
  await expect(page).not.toHaveURL(/overlay=/);
});

test('empty results, initial infrastructure failure and Retry retain header and tabs', async ({
  page,
}) => {
  await page.route('**/api/authors?**', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'unavailable' }),
    }),
  );
  await page.goto('/explore?section=authors&search=1');
  await expect(
    page.getByTestId('infrastructure-error-state-inline'),
  ).toBeVisible();
  await expect(query(page)).toBeEditable();
  await expect(
    page.getByRole('tab', { name: 'Авторы', exact: true }),
  ).toBeVisible();
  await page.unroute('**/api/authors?**');
  await page.getByRole('button', { name: 'Повторить', exact: true }).click();
  await expect(
    scroll(page).locator('a[href^="/seller/"]').first(),
  ).toBeVisible();
  await query(page).fill('no-results-zzzz');
  await expect(page.getByText('Ничего не найдено')).toBeVisible();
});

test('header animation keeps list and image instances, requests and scroll stable', async ({
  page,
}) => {
  await page.goto('/explore?section=works');
  await expect(scroll(page).locator('img').first()).toBeVisible();
  await scroll(page).evaluate((node) => {
    node.scrollTop = 180;
    Reflect.set(window, 'exploreImagesBefore', [
      ...node.querySelectorAll('img'),
    ]);
    Reflect.set(window, 'exploreImageBefore', node.querySelector('img'));
    Reflect.set(window, 'exploreListBefore', node);
  });
  const requests: string[] = [];
  page.on('request', (request) => {
    if (/\/api\/(works|images)/.test(request.url()))
      requests.push(request.url());
  });
  const beforeHeader = await header(page).boundingBox();
  const beforeScroll = await scroll(page).evaluate((node) => node.scrollTop);
  for (let index = 0; index < 3; index++) {
    await page.getByRole('button', { name: 'Открыть поиск' }).click();
    await page.getByRole('button', { name: 'Закрыть поиск' }).click();
  }
  await expect
    .poll(() => scroll(page).evaluate((node) => node.scrollTop))
    .toBe(beforeScroll);
  expect(
    await scroll(page).evaluate(
      (node) =>
        ({
          list: node === Reflect.get(window, 'exploreListBefore'),
          image: node.querySelector('img') === Reflect.get(window, 'exploreImageBefore'),
          beforeSrc: (Reflect.get(window, 'exploreImageBefore') as HTMLImageElement)?.src,
          afterSrc: node.querySelector('img')?.src,
        }),
    ),
  ).toMatchObject({ list: true, image: true });
  expect((await header(page).boundingBox())!.height).toBe(beforeHeader!.height);
  expect(requests).toEqual([]);
  const images = await scroll(page).evaluate((node) => {
    const before = Reflect.get(window, 'exploreImagesBefore') as Element[];
    const after = [...node.querySelectorAll('img')];
    return {
      before: before.length,
      after: after.length,
      preserved: before.filter((image, index) => image === after[index]).length,
    };
  });
  expect(images.before).toBeGreaterThan(0);
  expect(images.after).toBe(images.before);
  expect(images.preserved).toBe(images.before);
  const evidence = join(e2eEvidenceDir, 'explore');
  mkdirSync(evidence, { recursive: true });
  writeFileSync(
    join(evidence, `performance-${test.info().project.name}.json`),
    JSON.stringify(
      {
        toggles: 3,
        extraRequests: requests,
        images,
        scrollBefore: beforeScroll,
        headerHeight: beforeHeader!.height,
      },
      null,
      2,
    ),
  );
});

for (const width of [390, 1024, 1440]) {
  test(`Explore ${width}px keyboard focus reduced motion and responsive evidence`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/explore?section=works');
    await expect(
      scroll(page).locator('a[href^="/product/"]').first(),
    ).toBeVisible();
    await expect
      .poll(() =>
        scroll(page)
          .locator('img')
          .evaluateAll((nodes) =>
            nodes
              .filter(
                (node) =>
                  node.getBoundingClientRect().top < innerHeight &&
                  node.getBoundingClientRect().bottom > 0,
              )
              .every(
                (node) =>
                  node instanceof HTMLImageElement &&
                  node.complete &&
                  node.naturalWidth > 0,
              ),
          ),
      )
      .toBe(true);
    await expect(scroll(page).getByTestId('figma-cover-frost')).toHaveCount(0);
    if (width >= 1024) await expect(page.getByTestId('desktop-navigation')).toHaveCSS('height', '68px');
    const evidence = join(e2eEvidenceDir, 'explore');
    mkdirSync(evidence, { recursive: true });
    await page.screenshot({
      path: join(evidence, `${info.project.name}-${width}-closed.png`),
    });
    await page.getByRole('button', { name: 'Открыть поиск' }).click();
    await expect(query(page)).toBeFocused();
    await expect(page.getByTestId('explore-search-field')).toHaveCSS(
      'opacity',
      '1',
    );
    await page.screenshot({
      path: join(evidence, `${info.project.name}-${width}-search.png`),
    });
    await page.getByRole('tab', { name: 'Категории', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(
      page.getByRole('tab', { name: 'Авторы', exact: true }),
    ).toBeFocused();
    await expect(
      page.getByRole('tab', { name: 'Авторы', exact: true }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(scroll(page).locator('a[href^="/seller/"]').first()).toBeVisible();
    await page.screenshot({ path: join(evidence, `${info.project.name}-${width}-authors.png`) });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Открыть поиск' }).click();
    await expect(query(page)).toBeFocused();
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.setViewportSize({ width: 390, height: 480 });
    await expect(
      page.getByRole('button', { name: 'Закрыть поиск' }),
    ).toBeVisible();
  });
}

test('category two-column geometry, author hover and section screenshots', async ({
  page,
}, info) => {
  const evidence = join(e2eEvidenceDir, 'explore');
  mkdirSync(evidence, { recursive: true });
  await page.goto('/explore?section=categories');
  const tiles = page.getByTestId('category-search-tile');
  await expect(tiles.nth(2)).toBeVisible();
  const boxes = await tiles.evaluateAll((nodes) =>
    nodes.slice(0, 3).map((node) => {
      const rect = node.getBoundingClientRect();
      return { top: rect.top, width: rect.width };
    }),
  );
  expect(boxes[0]!.top).toBe(boxes[1]!.top);
  expect(boxes[2]!.top).toBeGreaterThan(boxes[0]!.top);
  expect(boxes[0]!.width).toBe(179);
  await page.screenshot({
    path: join(evidence, `${info.project.name}-390-categories.png`),
  });
  await page.getByRole('tab', { name: 'Авторы', exact: true }).click();
  const row = page.getByTestId('author-search-row').first();
  await expect(row).toBeVisible();
  await row.hover();
  await expect(row).toHaveCSS('background-color', 'rgb(247, 247, 247)');
  await page.screenshot({
    path: join(evidence, `${info.project.name}-390-authors.png`),
  });
});

test('legacy catalog overlay preserves the independent origin query and filters for browser Back', async ({
  page,
}) => {
  await page.goto(
    '/works?q=catalog&material=Clay&overlay=search&oq=maker&otab=authors',
  );
  await expect(page).toHaveURL(/section=authors/);
  await expect(query(page)).toHaveValue('maker');
  await page.goBack();
  await expect(page).toHaveURL(/section=works/);
  await expect(page).toHaveURL(/material=Clay/);
  await expect(query(page)).toHaveValue('catalog');
  await expect(page).not.toHaveURL(/overlay=/);
});

test('an independent Search entry does not inherit queries or hidden drafts from the previous Explore session', async ({ page }) => {
  await page.goto('/explore?section=authors&search=1&q=previous-author-query&city=Minsk&sort=name');
  await expect(query(page)).toHaveValue('previous-author-query');
  await page.getByRole('tab', { name: 'Работы', exact: true }).click();
  await query(page).fill('previous-work-query');
  await expect(page).toHaveURL(/q=previous-work-query/);
  await page.getByTestId('figma-floating-dock').getByLabel('Главная', { exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByTestId('figma-floating-dock').getByLabel('Поиск', { exact: true }).click();
  await expect(query(page)).toHaveValue('');
  await expect(page).not.toHaveURL(/previous-|city=Minsk|sort=name/);
  await page.getByRole('tab', { name: 'Авторы', exact: true }).click();
  await expect(query(page)).toHaveValue('');
  await expect(page).not.toHaveURL(/previous-|city=Minsk|sort=name/);
});

for (const width of [320, 375, 390, 414, 768, 1024, 1440]) {
  test(`work view toggle preserves results and fits the container at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    let requests = 0;
    page.on('request', request => {
      if (new URL(request.url()).pathname === '/api/works') requests++;
    });
    await page.goto('/explore?section=works&sort=oldest');
    const cards = scroll(page).locator('a[href^="/product/"]');
    await expect(cards.first()).toBeVisible();
    await expect(cards.nth(1)).toBeVisible();
    const hrefs = await cards.evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
    const beforeRequests = requests;
    const media = cards.first().locator('[style*="aspect-ratio"]').first();
    const first = await media.boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(first!.width / first!.height).toBeCloseTo(3 / 4, 2);
    expect(second!.x - first!.x - first!.width).toBeCloseTo(12, 1);
    await expect(media).toHaveCSS('border-radius', '16px');
    const large = page.getByRole('button', { name: 'Показать крупные карточки' });
    const filter = await page.getByRole('button', { name: 'Фильтры', exact: true }).boundingBox();
    const sort = await page.getByRole('button', { name: 'Сортировка', exact: true }).boundingBox();
    const toggle = await large.boundingBox();
    expect(sort!.x - filter!.x - filter!.width).toBe(8);
    expect(sort!.y + sort!.height / 2).toBe(filter!.y + filter!.height / 2);
    expect(toggle!.y + toggle!.height / 2).toBe(filter!.y + filter!.height / 2);
    expect(toggle!.x + toggle!.width).toBeCloseTo(Math.min(width - 12, (width + 1280) / 2), 1);

    await large.focus();
    await page.keyboard.press('Enter');
    const compact = page.getByRole('button', { name: 'Показать компактные карточки' });
    await expect(compact).toBeFocused();
    await expect(compact).toHaveCSS('outline-style', 'solid');
    await expect(compact.locator('..').locator('..')).toHaveCSS('overflow', 'visible');
    await expect(cards.first()).toHaveCSS('aspect-ratio', '0.75 / 1');
    expect((await cards.first().boundingBox())!.width).toBeCloseTo(Math.min(width - 24, 1280), 1);
    expect((await cards.nth(1).boundingBox())!.y).toBeGreaterThan((await cards.first().boundingBox())!.y);
    expect(await cards.evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))).toEqual(hrefs);
    await expect(page).toHaveURL(/sort=oldest/);
    expect(requests).toBe(beforeRequests);
    mkdirSync(join(e2eEvidenceDir, 'compact-work-card'), { recursive: true });
    await page.screenshot({ path: join(e2eEvidenceDir, 'compact-work-card', `${testInfo.project.name}-large-${width}.png`) });
    await page.keyboard.press('Space');
    await expect(large).toBeFocused();
    await expect(media).toHaveCSS('aspect-ratio', '0.75 / 1');
    expect(requests).toBe(beforeRequests);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: join(e2eEvidenceDir, 'compact-work-card', `${testInfo.project.name}-compact-${width}.png`) });
    await large.click();
    await page.getByRole('tab', { name: 'Авторы', exact: true }).click();
    await expect(compact).toHaveCount(0);
    await page.getByRole('tab', { name: 'Работы', exact: true }).click();
    await expect(compact).toBeVisible();
    await cards.first().click();
    await expect(page).toHaveURL(/\/product\//);
    await page.goBack();
    await expect(compact).toBeVisible();
    await expect(cards.first()).toHaveCSS('aspect-ratio', '0.75 / 1');
  });
}


test('compact work cards contain long text and preserve unavailable image geometry', async ({ page }) => {
  const title = 'Длинное название работы '.repeat(8).trim();
  const slug = 'long-author-name-without-breaks';
  await page.route('**/api/works?*', async route => {
    const response = await route.fetch();
    const body = await response.json();
    body.works[0].work.title = title;
    body.works[0].author.slug = slug;
    await route.fulfill({ response, json: body });
  });
  await page.route('**/api/images/**', route => route.fulfill({ status: 404, body: '' }));
  await page.goto('/explore?section=works');
  const cards = scroll(page).locator('a[href^="/product/"]');
  await expect(cards.first()).toBeVisible();
  await expect(cards.first().getByText(`@${slug}`, { exact: true })).toBeVisible();
  await expect(cards.nth(1).getByRole('img', { name: /^Изображение недоступно:/ })).toBeVisible();
  const first = await cards.first().boundingBox();
  const second = await cards.nth(1).boundingBox();
  expect(second!.x - first!.x - first!.width).toBeCloseTo(12, 1);
  const mediaBoxes = await Promise.all([cards.first(), cards.nth(1)].map(card => card.locator('[style*="aspect-ratio"]').first().boundingBox()));
  expect(mediaBoxes.length).toBeGreaterThan(1);
  for (const box of mediaBoxes) expect(box!.width / box!.height).toBeCloseTo(3 / 4, 2);
  await expect(cards.first().getByText(title, { exact: true })).toHaveCSS('-webkit-line-clamp', '2');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Показать крупные карточки' }).click();
  await expect(cards.first().getByText(title, { exact: true })).toBeVisible();
  await expect(cards.first()).toHaveCSS('aspect-ratio', '0.75 / 1');
});


test('work view toggle remains reachable with doubled text on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/explore?section=works');
  const large = page.getByRole('button', { name: 'Показать крупные карточки' });
  await expect(large).toBeVisible();
  await page.getByRole('button', { name: 'Сортировка', exact: true }).getByText('Сортировка', { exact: true }).evaluate(node => {
    node.style.fontSize = '28px';
    node.style.lineHeight = '40px';
  });
  const box = await large.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(12);
  expect(box!.x + box!.width).toBeLessThanOrEqual(308);
  await large.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Показать компактные карточки' })).toBeFocused();
});
