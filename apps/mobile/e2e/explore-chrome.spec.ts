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
  const ids: string[] = [];
  for (const [locator, kind] of [
    [field, 'field'],
    [close, 'close'],
    [rail, 'rail'],
  ] as const) {
    const size = await cssBorderBox(locator);
    ids.push(await expectGradient(locator, kind, size.width, size.height));
  }
  expect(new Set(ids).size).toBe(3);
  expect((await field.boundingBox())!.height).toBe(52);
  expect((await close.boundingBox())!.width).toBe(52);
  expect((await rail.boundingBox())!.height).toBe(50);
  expect((await rail.boundingBox())!.width).toBe(366);
  await expect(field).toHaveCSS('backdrop-filter', 'blur(6px)');
  await expect(field).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.6)');
  const filterBox = await page.getByRole('button', { name: 'Фильтры', exact: true }).boundingBox();
  expect(filterBox!.width).toBe(42);
  expect(filterBox!.height).toBe(42);
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

async function expectGradient(
  locator: ReturnType<Page['getByTestId']>,
  kind: 'field' | 'close' | 'rail',
  width: number,
  height: number,
) {
  const paint = searchChromeScaledPaint(kind, width, height, lightColorMap);
  const frame = searchChromeStrokeViewport(kind, width, height, lightColorMap);
  const half = searchChromeTokens.strokeWidth / 2;
  const measured = await locator
    .locator('svg:has(linearGradient)')
    .evaluate((node) => {
      const gradient = node.querySelector('linearGradient');
      const rect = node.querySelector('rect');
      const stops = [...(gradient?.querySelectorAll('stop') ?? [])].map(
        (stop) => stop.getAttribute('stop-color'),
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
        rectX: Number(rect?.getAttribute('x')),
        rectY: Number(rect?.getAttribute('y')),
        rectWidth: Number(rect?.getAttribute('width')),
        rectHeight: Number(rect?.getAttribute('height')),
        svgWidth: Number(node.getAttribute('width')),
        svgHeight: Number(node.getAttribute('height')),
      };
    });
  expect(measured.stops).toEqual(['#D1D1D1', '#EBEBEB']);
  expect(measured.x2 - measured.x1).toBeCloseTo(
    paint.axis.x2 - paint.axis.x1,
    1,
  );
  expect(measured.y2 - measured.y1).toBeCloseTo(
    paint.axis.y2 - paint.axis.y1,
    1,
  );
  expect(measured.x1).toBeCloseTo(frame.axis.x1, 1);
  expect(measured.y1).toBeCloseTo(frame.axis.y1, 1);
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
  expect(measured.id.length).toBeGreaterThan(0);
  return measured.id;
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
