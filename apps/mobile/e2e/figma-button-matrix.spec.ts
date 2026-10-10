import { expect, test, type Locator, type Page } from '@playwright/test';

import { figmaButtonMatrixCell, figmaButtonTokens } from '@bidplace/design-tokens';

import { e2eEvidenceDir } from './support/evidence-dir';

const standPath = '/dev/figma-buttons';
const variants = ['solid', 'outline', 'ghost', 'muted'] as const;
const viewports = [
  { width: 390, height: 874 },
  { width: 1024, height: 900 },
  { width: 1440, height: 900 },
  { width: 390, height: 400 },
];

async function shellMetrics(locator: Locator) {
  return locator.evaluate((node) => {
    const element = node as HTMLElement;
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      backgroundColor: style.backgroundColor,
      opacity: style.opacity,
      width: rect.width,
      height: rect.height,
    };
  });
}

function cssRgb(hex: string) {
  const value = hex.replace('#', '');
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgb(${red}, ${green}, ${blue})`;
}

async function expectMatrixIdle(page: Page, variant: (typeof variants)[number]) {
  const cell = figmaButtonMatrixCell(variant, 'idle');
  const button = page.getByTestId(`figma-button-${variant}-idle`);
  await expect(button).toBeVisible();
  const metrics = await shellMetrics(button);
  expect(metrics.opacity).toBe('1');
  expect(metrics.backgroundColor).toBe(cssRgb(cell.fill));
  expect(Math.round(metrics.width)).toBeGreaterThanOrEqual(
    figmaButtonTokens.metrics.sampleWidth - 2,
  );
  expect(Math.round(metrics.height)).toBeGreaterThanOrEqual(
    figmaButtonTokens.metrics.sampleHeight - 2,
  );
}

test.describe('FigmaButton matrix stand', () => {
  for (const viewport of viewports) {
    test(`matrix interactions at ${viewport.width}x${viewport.height}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.goto(standPath);
      await expect(page.getByTestId('figma-button-stand-note')).toBeVisible();

      for (const variant of variants) {
        const idle = page.getByTestId(`figma-button-${variant}-idle`);
        await idle.scrollIntoViewIfNeeded();
        await expectMatrixIdle(page, variant);

        await idle.hover();
        const hoverCell = figmaButtonMatrixCell(variant, 'hover');
        const hovered = await shellMetrics(idle);
        expect(hovered.opacity).toBe('1');
        expect(hovered.backgroundColor).toBe(cssRgb(hoverCell.fill));
        if (hoverCell.overlay) {
          const overlay = await idle.evaluate((node) =>
            [...node.querySelectorAll('div')].map(
              (element) => getComputedStyle(element).backgroundColor,
            ),
          );
          expect(overlay).toContain(hoverCell.overlay);
        }

        await page.mouse.down();
        await expect.poll(async () => (await shellMetrics(idle)).opacity).toBe('1');
        const pressed = await shellMetrics(idle);
        expect(pressed.width).toBe(hovered.width);
        expect(pressed.height).toBe(hovered.height);
        if (variant === 'ghost') {
          await expect
            .poll(async () => (await shellMetrics(idle)).backgroundColor)
            .toBe('rgba(0, 0, 0, 0)');
        }
        await page.mouse.up();

        await idle.focus();
        await page.keyboard.press('Enter');
        const focused = await shellMetrics(idle);
        expect(focused.opacity).toBe('1');

        const disabled = page.getByTestId(`figma-button-${variant}-disabled`);
        const disabledCell = figmaButtonMatrixCell(variant, 'disabled');
        const disabledMetrics = await shellMetrics(disabled);
        expect(disabledMetrics.opacity).toBe(
          String(disabledCell.controlOpacity),
        );
        expect(disabledMetrics.backgroundColor).toBe(cssRgb(disabledCell.fill));
      }

      const loading = page.getByTestId('figma-button-solid-loading');
      const loadingMetrics = await shellMetrics(loading);
      expect(loadingMetrics.opacity).toBe(
        String(figmaButtonTokens.disabledOpacity),
      );
      await expect(loading.getByRole('progressbar')).toBeVisible();

      const icon = page.getByTestId('figma-button-solid-icon');
      await expect(icon).toBeVisible();

      const link = page.getByTestId('figma-button-outline-link');
      await expect(link).toHaveAttribute('role', 'link');

      await page.screenshot({
        path: `${e2eEvidenceDir}/figma-button-matrix-${viewport.width}x${viewport.height}-${testInfo.project.name}.png`,
        fullPage: true,
      });
    });
  }

  test('resize, zoom, focus-visible, and reduced motion keep the matrix', async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(standPath);
    const solid = page.getByTestId('figma-button-solid-idle');
    await expect(solid).toBeVisible();
    const wide = await shellMetrics(solid);

    await page.setViewportSize({ width: 390, height: 400 });
    const narrow = await shellMetrics(solid);
    expect(narrow.backgroundColor).toBe(wide.backgroundColor);
    expect(narrow.opacity).toBe('1');

    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
    await solid.focus();
    const zoomed = await shellMetrics(solid);
    expect(zoomed.opacity).toBe('1');
    expect(zoomed.backgroundColor).toBe(wide.backgroundColor);
    const outline = await solid.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
      };
    });
    expect(outline.outlineStyle).not.toBe('none');
    expect(outline.outlineWidth).not.toBe('0px');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    const reduced = page.getByTestId('figma-button-outline-idle');
    await reduced.hover();
    const transition = await reduced.evaluate(
      (node) => getComputedStyle(node).transitionDuration,
    );
    expect(transition === '0s' || transition === '0ms').toBe(true);
    const reducedMetrics = await shellMetrics(reduced);
    expect(reducedMetrics.opacity).toBe('1');
    expect(reducedMetrics.backgroundColor).toBe(
      cssRgb(figmaButtonMatrixCell('outline', 'hover').fill),
    );

    const gradient = await page.getByTestId('figma-button-solid-idle').evaluate((node) => {
      const paint = node.querySelector('linearGradient');
      if (!paint) return null;
      return {
        x2: paint.getAttribute('x2'),
        y2: paint.getAttribute('y2'),
        stops: [...paint.querySelectorAll('stop')].map((stop) => stop.getAttribute('stop-color')),
      };
    });
    expect(gradient?.x2).toBe('84.791');
    expect(gradient?.y2).toBe('39.1182');
    expect(gradient?.stops).toEqual(['#2A2A2A', '#585858']);

    await page.screenshot({
      path: `${e2eEvidenceDir}/figma-button-matrix-motion-${testInfo.project.name}.png`,
      fullPage: true,
    });
  });
});
