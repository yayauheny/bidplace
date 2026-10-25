import { expect, test, type Page } from '@playwright/test';
import {
  lightColorMap,
  searchChromeScaledPaint,
  searchChromeStrokeViewport,
  searchChromeTokens,
} from '@bidplace/design-tokens';

test('Explore retains fractional glass strokes, typography and the measured segmented rail', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/explore?section=works&search=1');
  const field = page.getByTestId('explore-field-glass');
  const close = page.getByTestId('explore-close-glass');
  const rail = page.getByTestId('segmented-tabs');
  await expect(field).toBeVisible();
  for (const [locator, kind] of [
    [field, 'field'],
    [close, 'close'],
    [rail, 'rail'],
  ] as const) {
    const size = await cssBorderBox(locator);
    await expectStroke(locator, kind, size.width, size.height);
  }
  expect((await field.boundingBox())!.height).toBe(52);
  expect((await close.boundingBox())!.width).toBe(52);
  expect((await rail.boundingBox())!.height).toBe(50);
  expect((await rail.boundingBox())!.width).toBe(366);
  await expect(field).toHaveCSS('backdrop-filter', 'blur(6px)');
  await expect(field).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.6)');
  const filterBox = await page
    .getByRole('button', { name: 'Фильтры', exact: true })
    .boundingBox();
  expect(filterBox!.width).toBe(42);
  expect(filterBox!.height).toBe(42);
  const filter = page.getByRole('button', { name: 'Фильтры', exact: true });
  const sort = page.getByRole('button', { name: 'Сортировка', exact: true });
  const sortBox = await sort.boundingBox();
  expect(sortBox!.x - filterBox!.x - filterBox!.width).toBe(8);
  expect(sortBox!.y).toBe(filterBox!.y);
  expect(sortBox!.height).toBe(42);
  await expect(filter.locator('svg')).toHaveAttribute('width', '18');
  const sortLabel = sort.getByText('Сортировка', { exact: true });
  await expect(sortLabel).toHaveCSS('font-family', 'Inter_500Medium');
  await expect(sortLabel).toHaveCSS('font-size', '14px');
  await expect(sortLabel).toHaveCSS('font-weight', '500');
  await expect(sortLabel).toHaveCSS('line-height', '26px');
  await expect(sortLabel).toHaveCSS('letter-spacing', '-0.28px');
  await expect(sortLabel).toHaveCSS('color', 'rgb(86, 86, 86)');
  const surface = sort.locator('..').locator('..');
  await expect(surface).toHaveClass(/figma-glass-control/);
  await expect(surface).toHaveCSS('border-radius', '80px');
  await expect(surface.locator('.figma-glass-material')).toHaveCSS('overflow', 'hidden');
  await expect(surface.locator('.figma-glass-material')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(surface.locator('.figma-glass-material')).toHaveCSS('backdrop-filter', 'blur(50px)');
  await expect(surface.locator('.figma-glass-stroke')).toHaveCSS('box-shadow', 'rgb(209, 209, 209) 0px 0px 0px 0.5px inset');
  await sort.focus();
  await expect(sort).toHaveCSS('outline-style', 'solid');
  await expect(surface).toHaveCSS('overflow', 'visible');

  const tabs = page.getByRole('tab');
  const widths = await tabs.evaluateAll((nodes) =>
    nodes.map((node) => node.getBoundingClientRect().width),
  );
  const share =
    (366 -
      searchChromeTokens.rail.padding * 2 -
      searchChromeTokens.rail.gap * 2) /
    3;
  for (const width of widths) expect(width).toBeCloseTo(share, 1);
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(0.05);
  const label = tabs.first().locator('div[dir="auto"]').first();
  await expect(label).toHaveCSS('font-size', '14px');
  await expect(label).toHaveCSS('line-height', '20px');
  await expect(label).toHaveCSS('letter-spacing', '-0.28px');
  await expect(tabs.first()).toHaveCSS('height', '41px');
});

async function expectStroke(
  locator: ReturnType<Page['getByTestId']>,
  kind: 'field' | 'close' | 'rail',
  width: number,
  height: number,
) {
  const paint = searchChromeScaledPaint(kind, width, height, lightColorMap);
  const frame = searchChromeStrokeViewport(kind, width, height, lightColorMap);
  const half = searchChromeTokens.strokeWidth / 2;
  const measured = await locator
    .locator('svg:has(rect[stroke])')
    .evaluate((node) => {
      const rect = node.querySelector('rect');
      return {
        color: rect?.getAttribute('stroke'),
        stroke: Number(rect?.getAttribute('stroke-width')),
        rx: Number(rect?.getAttribute('rx')),
        ry: Number(rect?.getAttribute('ry')),
        rectX: Number(rect?.getAttribute('x')),
        rectY: Number(rect?.getAttribute('y')),
        rectWidth: Number(rect?.getAttribute('width')),
        rectHeight: Number(rect?.getAttribute('height')),
        svgWidth: Number(node.getAttribute('width')),
        svgHeight: Number(node.getAttribute('height')),
      };
    });
  expect(measured.color).toBe(lightColorMap.toolbarBorder);
  expect(measured.stroke).toBe(0.5);
  expect(measured.rx).toBeCloseTo(paint.rx, 1);
  expect(measured.ry).toBe(measured.rx);
  expect(measured.rectWidth).toBeCloseTo(paint.width, 1);
  expect(measured.rectHeight).toBeCloseTo(paint.height, 1);
  expect(measured.rectX - half).toBeGreaterThanOrEqual(-0.01);
  expect(measured.rectY - half).toBeGreaterThanOrEqual(-0.01);
  expect(measured.rectX + measured.rectWidth + half).toBeLessThanOrEqual(
    measured.svgWidth + 0.01,
  );
  expect(measured.rectY + measured.rectHeight + half).toBeLessThanOrEqual(
    measured.svgHeight + 0.01,
  );
  expect(measured.svgWidth).toBeCloseTo(frame.width, 2);
  expect(measured.svgHeight).toBeCloseTo(frame.height, 2);
}

async function cssBorderBox(locator: ReturnType<Page['getByTestId']>) {
  return locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      width: Number.parseFloat(style.width),
      height: Number.parseFloat(style.height),
    };
  });
}

test('segmented selection slides in both directions and snaps under reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/explore?section=categories');
  const indicator = page.getByTestId('segmented-tab-indicator');
  await expect(indicator).toBeVisible();
  const sample = () =>
    page.evaluate(async () => {
      const pill = document.querySelector(
        '[data-testid="segmented-tab-indicator"]',
      )!;
      const target = [...document.querySelectorAll('[role="tab"]')].find(
        (tab) => tab.textContent === 'Работы',
      ) as HTMLElement;
      const positions = [pill.getBoundingClientRect().x];
      target.click();
      const start = performance.now();
      while (performance.now() - start < 350) {
        await new Promise(requestAnimationFrame);
        positions.push(pill.getBoundingClientRect().x);
      }
      return positions;
    });
  const positions = await sample();
  const first = positions[0];
  const last = positions.at(-1)!;
  expect(last).toBeGreaterThan(first + 100);
  expect(positions.some((x) => x > first + 1 && x < last - 1)).toBe(true);
  await page.getByRole('tab', { name: 'Категории', exact: true }).click();
  await expect
    .poll(async () => (await indicator.boundingBox())!.x)
    .toBeCloseTo(first, 1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reduced = await sample();
  expect(reduced.some((x) => x > first + 1 && x < last - 1)).toBe(false);
  await page.setViewportSize({ width: 1024, height: 768 });
  const selected = page.getByRole('tab', { name: 'Работы', exact: true });
  await expect
    .poll(async () =>
      Math.abs(
        (await selected.boundingBox())!.x - (await indicator.boundingBox())!.x,
      ),
    )
    .toBeLessThan(0.1);
  expect(
    Math.abs(
      (await selected.boundingBox())!.width -
        (await indicator.boundingBox())!.width,
    ),
  ).toBeLessThan(0.1);
});

test('empty Explore uses the Figma search state and keeps active filters recoverable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const section of ['works', 'authors', 'categories']) {
    await page.goto(`/explore?section=${section}&search=1&q=no-results-zzzz`);
    const empty = page.getByTestId('search-empty-state');
    await expect(empty).toBeVisible();
    await expect(
      empty.getByText('Ничего не найдено', { exact: true }),
    ).toHaveCSS('font-size', '18px');
    await expect(
      empty.getByText('Попробуйте изменить запрос или выбрать другой раздел'),
    ).toHaveCSS('line-height', '20px');
    await expect(
      page.getByRole('button', { name: 'Фильтры', exact: true }),
    ).toHaveCount(0);
    expect(
      Number(
        await empty.locator('svg path').first().getAttribute('stroke-width'),
      ),
    ).toBeCloseTo(1.6, 8);
    const footer = page.getByRole('contentinfo');
    expect((await footer.boundingBox())!.y).toBeGreaterThanOrEqual(844);
  }
  await page.goto(
    '/explore?section=works&search=1&q=no-results-zzzz&material=Clay',
  );
  await expect(page.getByTestId('search-empty-state')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Фильтры', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Фильтры', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('empty state remains centered and reachable across viewport sizes', async ({
  page,
}) => {
  await page.goto('/explore?section=works&search=1&q=no-results-zzzz');
  const empty = page.getByTestId('search-empty-state');
  for (const width of [390, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(empty).toBeVisible();
    await expect
      .poll(async () => (await empty.boundingBox())!.width)
      .toBeGreaterThan(300);
    const activeTab = page.getByRole('tab', { name: 'Работы', exact: true });
    const indicator = page.getByTestId('segmented-tab-indicator');
    await expect
      .poll(async () =>
        Math.abs(
          (await activeTab.boundingBox())!.x -
            (await indicator.boundingBox())!.x,
        ),
      )
      .toBeLessThan(0.1);
    await expect
      .poll(async () =>
        Math.abs(
          (await activeTab.boundingBox())!.width -
            (await indicator.boundingBox())!.width,
        ),
      )
      .toBeLessThan(0.1);
    const icon = page
      .getByTestId('explore-header')
      .locator('[aria-label="Открыть поиск"] svg');
    const field = page.getByTestId('explore-field-glass');
    await expect
      .poll(async () =>
        Math.abs(
          (await icon.boundingBox())!.x - (await field.boundingBox())!.x - 14,
        ),
      )
      .toBeLessThan(1);
    await page.screenshot({ path: `/private/tmp/explore-empty-${width}.png` });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
  await page.setViewportSize({ width: 390, height: 420 });
  await expect(
    empty.getByText('Ничего не найдено', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Закрыть поиск' }).click();
  const back = page.getByRole('button', { name: 'Назад', exact: true });
  await expect(back.locator('svg path').first()).toHaveAttribute(
    'd',
    'M5.5 12.002H19',
  );
  const filter = page.getByRole('button', { name: 'Фильтры', exact: true });
  await expect(filter).toBeVisible();
  await expect(filter.locator('svg')).toHaveAttribute('width', '18');
  const sortIcon = page
    .getByRole('button', { name: 'Сортировка', exact: true })
    .locator('svg');
  expect(
    await sortIcon.evaluate(
      (svg) =>
        (Number(svg.querySelector('path')!.getAttribute('stroke-width')) *
          svg.getBoundingClientRect().width) /
        24,
    ),
  ).toBeCloseTo(1.3, 8);
  expect(
    await filter.locator('svg').evaluate(
      (svg) =>
        (Number(svg.querySelector('path')!.getAttribute('stroke-width')) *
          svg.getBoundingClientRect().width) /
        24,
    ),
  ).toBeCloseTo(1.6, 8);
});
