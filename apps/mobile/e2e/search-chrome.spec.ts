import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { searchChromeScaledPaint } from '@bidplace/design-tokens';

import { e2eEvidenceDir } from './support/evidence-dir';

const viewports = [
  { width: 390, height: 874, name: '390' },
  { width: 1024, height: 900, name: '1024' },
  { width: 1440, height: 900, name: '1440' },
  { width: 390, height: 480, name: 'short' },
] as const;

test.beforeEach(async ({ page }) => {
  await page.goto('/?overlay=search');
  await expect(page.getByTestId('search-overlay-query')).toBeVisible();
});

test('search popup matches the 456:8298 stroke, tabs, and interactions', async ({
  page,
}, testInfo) => {
  const evidence = join(e2eEvidenceDir, 'search-chrome');
  mkdirSync(evidence, { recursive: true });

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await expectChrome(page);
    await page.screenshot({
      path: join(evidence, `${testInfo.project.name}-${viewport.name}.png`),
    });
  }

  await page.setViewportSize({ width: 390, height: 874 });
  await page.setViewportSize({ width: 800, height: 700 });
  await page.setViewportSize({ width: 390, height: 874 });
  await expectChrome(page);

  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expect(page.getByTestId('search-overlay-field').locator('svg:has(linearGradient)')).toBeVisible();
  const tabEdges = await page.getByRole('tab').evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return { left: box.left, right: box.right };
    }),
  );
  for (let index = 1; index < tabEdges.length; index += 1) {
    expect(tabEdges[index]!.left).toBeGreaterThanOrEqual(tabEdges[index - 1]!.right - 1);
  }
  await page.screenshot({
    path: join(evidence, `${testInfo.project.name}-zoom-200.png`),
  });
  await page.evaluate(() => {
    document.documentElement.style.zoom = '1';
  });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.getByTestId('search-overlay-query')).toBeVisible();
  const duration = await page.getByLabel('Закрыть поиск').evaluate((node) =>
    getComputedStyle(node).transitionDuration,
  );
  expect(duration === '0s' || duration === '0ms').toBe(true);

  const query = page.getByTestId('search-overlay-query');
  await query.fill('dali');
  await expect(query).toHaveValue('dali');
  await expect(page).toHaveURL(/oq=dali/);
  await page.getByRole('tab', { name: 'Авторы' }).click();
  await expect(page).toHaveURL(/otab=authors/);
  await expect(page.getByRole('tab', { name: 'Авторы' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.getByRole('tab', { name: 'Работы' }).click();
  await expect(page).toHaveURL(/otab=works/);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('search-overlay')).toHaveCount(0);
  await expect(page).not.toHaveURL(/overlay=search/);

  writeFileSync(
    join(evidence, `${testInfo.project.name}-measurements.json`),
    JSON.stringify({ viewports, zoom: 2, reducedMotion: duration }, null, 2),
  );
});

test('search tabs keep capture fills under hover and keyboard focus', async ({
  page,
}, testInfo) => {
  mkdirSync(join(e2eEvidenceDir, 'search-chrome'), { recursive: true });
  await page.setViewportSize({ width: 390, height: 874 });
  const authors = page.getByRole('tab', { name: 'Авторы' });
  await authors.click();
  await expect.poll(async () => (await tabPaint(authors)).fill).toBe(
    'rgb(243, 243, 243)',
  );
  await authors.hover();
  expect((await tabPaint(authors)).fill).toBe('rgb(243, 243, 243)');

  await page.getByTestId('search-overlay-query').focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const focusedOutline = await page.evaluate(() => {
    const node = document.activeElement;
    if (!node) return '';
    return getComputedStyle(node).outlineColor;
  });
  expect(focusedOutline).toContain('36, 87, 230');

  await page.screenshot({
    path: join(e2eEvidenceDir, 'search-chrome', `${testInfo.project.name}-focus.png`),
  });
  const close = page.getByLabel('Закрыть поиск');
  const box = await close.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await expect
    .poll(async () =>
      Number(await close.evaluate((node) => getComputedStyle(node).opacity)),
    )
    .toBeCloseTo(0.6, 1);
  await page.mouse.up();
});

async function expectChrome(page: Page) {
  const field = page.getByTestId('search-overlay-field');
  const close = page.getByTestId('search-overlay-close');
  const rail = page.getByTestId('search-overlay-tabs');
  const fieldBox = await field.boundingBox();
  const closeBox = await close.boundingBox();
  const railBox = await rail.boundingBox();
  expect(fieldBox!.height).toBeCloseTo(52, 0);
  expect(closeBox!.width).toBeCloseTo(52, 0);
  expect(closeBox!.height).toBeCloseTo(52, 0);
  expect(railBox!.width).toBeCloseTo(364, 0);
  expect(railBox!.height).toBeCloseTo(50, 0);
  expect(closeBox!.x - (fieldBox!.x + fieldBox!.width)).toBeCloseTo(12, 0);

  const fieldId = await expectGradient(field, 'field', fieldBox!.width, fieldBox!.height);
  const closeId = await expectGradient(close, 'close', closeBox!.width, closeBox!.height);
  const railId = await expectGradient(rail, 'rail', railBox!.width, railBox!.height);
  expect(new Set([fieldId, closeId, railId]).size).toBe(3);

  const blur = await field.evaluate((node) => getComputedStyle(node).backdropFilter);
  expect(blur).toContain('blur(6px)');
  const fill = await field.evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(fill).toBe('rgba(255, 255, 255, 0.6)');

  const tab = page.getByRole('tab', { name: 'Категории' });
  const tabBox = await tab.boundingBox();
  expect(tabBox!.height).toBeCloseTo(41, 0);
  const type = await tab.evaluate((node) => {
    const label = node.querySelector('[role="text"], span, div') ?? node;
    const style = getComputedStyle(label as Element);
    return {
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      fontFamily: style.fontFamily,
      letterSpacing: style.letterSpacing,
    };
  });
  expect(type.fontSize).toBe('14px');
  expect(type.lineHeight).toBe('20px');
  expect(type.fontFamily).toContain('Inter_500Medium');
  expect(Number.parseFloat(type.letterSpacing)).toBeCloseTo(-0.28, 1);
}

async function expectGradient(
  locator: ReturnType<Page['getByTestId']>,
  kind: 'field' | 'close' | 'rail',
  width: number,
  height: number,
) {
  const paint = searchChromeScaledPaint(kind, width, height);
  const left = Math.min(0, paint.x);
  const top = Math.min(0, paint.y);
  const measured = await locator.locator('svg:has(linearGradient)').evaluate((node) => {
    const gradient = node.querySelector('linearGradient');
    const rect = node.querySelector('rect');
    const stops = [...(gradient?.querySelectorAll('stop') ?? [])].map((stop) =>
      stop.getAttribute('stop-color'),
    );
    return {
      id: gradient?.id ?? '',
      x1: Number(gradient?.getAttribute('x1')),
      y1: Number(gradient?.getAttribute('y1')),
      x2: Number(gradient?.getAttribute('x2')),
      y2: Number(gradient?.getAttribute('y2')),
      stops,
      rx: Number(rect?.getAttribute('rx')),
      ry: Number(rect?.getAttribute('ry')),
      rectWidth: Number(rect?.getAttribute('width')),
      rectHeight: Number(rect?.getAttribute('height')),
      svgWidth: Number(node.getAttribute('width')),
      svgHeight: Number(node.getAttribute('height')),
    };
  });
  expect(measured.stops).toEqual(['#D1D1D1', '#EBEBEB']);
  expect(measured.x2).toBeCloseTo(paint.axis.x2 - left, 1);
  expect(measured.y2).toBeCloseTo(paint.axis.y2 - top, 1);
  expect(measured.rx).toBeCloseTo(paint.rx, 1);
  expect(measured.ry).toBe(measured.rx);
  expect(measured.rectWidth).toBeCloseTo(paint.width, 1);
  expect(measured.rectHeight).toBeCloseTo(paint.height, 1);
  expect(measured.svgWidth).toBeGreaterThanOrEqual(width - 0.01);
  expect(measured.id.length).toBeGreaterThan(0);
  return measured.id;
}

async function tabPaint(locator: ReturnType<Page['getByRole']>) {
  return locator.evaluate((node) => ({
    fill: getComputedStyle(node).backgroundColor,
  }));
}
