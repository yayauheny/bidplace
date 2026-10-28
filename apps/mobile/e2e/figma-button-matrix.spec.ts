import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import {
  figmaButtonMatrixCell,
  figmaButtonTokens,
  lightColorMap,
} from '@bidplace/design-tokens';

import { e2eEvidenceDir } from './support/evidence-dir';
import {
  expectSvgMatrixPaints,
  expectSvgShellAligned,
  expectTypography,
  interactionPaintReady,
  probeSvgButtonCell,
  type SvgButtonProbe,
} from './support/figma-button-svg-probe';

const standPath = '/dev/figma-buttons';
const variants = ['solid', 'outline', 'ghost', 'muted'] as const;
const interactions = ['idle', 'hover', 'pressed', 'disabled'] as const;
const viewports = [
  { width: 390, height: 874 },
  { width: 1024, height: 900 },
  { width: 1440, height: 900 },
  { width: 390, height: 400 },
];

const matrixBoard = {
  width: 714,
  height: 283,
  columnX: [20, 193, 366, 539],
  rowY: [20, 82, 144, 206],
} as const;

async function pageZoom(page: Page) {
  return page.evaluate(() =>
    Number.parseFloat(getComputedStyle(document.documentElement).zoom || '1'),
  );
}

async function resetPointer(page: Page) {
  await page.mouse.move(0, 0);
}

async function expectMatrixChromeAlignment(page: Page) {
  const board = page.getByTestId('figma-button-matrix-board');
  const boardBox = await board.boundingBox();
  expect(boardBox?.width).toBeCloseTo(matrixBoard.width, 0);
  expect(boardBox?.height).toBeCloseTo(matrixBoard.height, 0);

  const solidIdle = page.getByTestId('figma-button-preview-solid-idle');
  const idleBox = await solidIdle.boundingBox();
  expect(idleBox).not.toBeNull();
  expect(idleBox!.x - boardBox!.x).toBeCloseTo(matrixBoard.columnX[0], 1);
  expect(idleBox!.y - boardBox!.y).toBeCloseTo(matrixBoard.rowY[0], 1);

  const headerIdle = page.getByTestId('figma-button-matrix-header-idle');
  const headerBox = await headerIdle.boundingBox();
  expect(headerBox!.x - boardBox!.x).toBeCloseTo(matrixBoard.columnX[0], 1);

  const rowSolid = page.getByTestId('figma-button-matrix-row-label-solid');
  const rowBox = await rowSolid.boundingBox();
  const rowCenter = rowBox!.y + rowBox!.height / 2;
  const idleCenter = idleBox!.y + idleBox!.height / 2;
  expect(rowCenter).toBeCloseTo(idleCenter, 1);
}

async function liveControlForInteraction(
  page: Page,
  variant: (typeof variants)[number],
  interaction: (typeof interactions)[number],
) {
  await resetPointer(page);
  if (interaction === 'disabled') {
    const disabled = page.getByTestId(`figma-button-${variant}-disabled`);
    await disabled.scrollIntoViewIfNeeded();
    return disabled;
  }
  const idle = page.getByTestId(`figma-button-${variant}-idle`);
  await idle.scrollIntoViewIfNeeded();
  if (interaction === 'hover') {
    await idle.hover();
    return idle;
  }
  if (interaction === 'pressed') {
    await idle.hover();
    await page.mouse.down();
    return idle;
  }
  return idle;
}

async function expectPreviewMatchesLive(
  page: Page,
  variant: (typeof variants)[number],
  interaction: (typeof interactions)[number],
  zoom = 1,
) {
  const preview = page.getByTestId(
    `figma-button-preview-${variant}-${interaction}`,
  );
  await preview.scrollIntoViewIfNeeded();
  const previewProbe = await probeSvgButtonCell(preview);
  expectTypography(previewProbe);
  expectSvgMatrixPaints(variant, interaction, previewProbe, zoom);

  const live = await liveControlForInteraction(page, variant, interaction);
  try {
    if (interaction === 'pressed') {
      await expect
        .poll(async () =>
          interactionPaintReady(
            variant,
            'pressed',
            await probeSvgButtonCell(live),
          ),
        )
        .toBe(true);
    }
    if (interaction === 'hover') {
      await expect
        .poll(async () =>
          interactionPaintReady(
            variant,
            'hover',
            await probeSvgButtonCell(live),
          ),
        )
        .toBe(true);
    }
    const liveProbe = await probeSvgButtonCell(live);
    expectSvgMatrixPaints(variant, interaction, liveProbe, zoom);
    if (interaction !== 'disabled') {
      expect(liveProbe.shellCssWidth).toBeCloseTo(
        previewProbe.shellCssWidth,
        2,
      );
      expect(liveProbe.shellCssHeight).toBeCloseTo(
        previewProbe.shellCssHeight,
        2,
      );
    }
    expect(liveProbe.rects[0]?.fill).toBe(previewProbe.rects[0]?.fill);
    if (previewProbe.rects.find((rect) => rect.fill?.includes('rgba'))) {
      expect(
        liveProbe.rects.find((rect) => rect.fill?.includes('rgba'))?.fill,
      ).toBe(
        previewProbe.rects.find((rect) => rect.fill?.includes('rgba'))?.fill,
      );
    }
    return { previewProbe, liveProbe };
  } finally {
    if (interaction === 'pressed') {
      await page.mouse.up();
    }
  }
}

async function expectMatrixIdle(
  page: Page,
  variant: (typeof variants)[number],
  zoom = 1,
) {
  const cell = figmaButtonMatrixCell(variant, 'idle', lightColorMap);
  const button = page.getByTestId(`figma-button-${variant}-idle`);
  await expect(button).toBeVisible();
  const probe = await probeSvgButtonCell(button);
  expect(probe.opacity).toBe('1');
  expect(probe.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expectSvgShellAligned(probe, zoom);
  expect(probe.rects[0]?.fill?.toLowerCase()).toBe(cell.fill.toLowerCase());
  expect(probe.shellCssWidth).toBeGreaterThanOrEqual(
    figmaButtonTokens.metrics.sampleWidth - 1,
  );
  expect(probe.shellCssHeight).toBeGreaterThanOrEqual(
    figmaButtonTokens.metrics.sampleHeight - 1,
  );
}

test.describe('FigmaButton matrix stand', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      if (
        /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(url) ||
        url.startsWith('data:') ||
        url.startsWith('blob:')
      ) {
        await route.continue();
        return;
      }
      await route.abort('blockedbyclient');
    });
  });

  for (const viewport of viewports) {
    test(`matrix interactions at ${viewport.width}x${viewport.height}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.goto(standPath);
      await expect(page.getByTestId('figma-button-stand-note')).toBeVisible();
      const zoom = await pageZoom(page);

      const matrix = page.getByTestId('figma-button-state-matrix');
      await matrix.scrollIntoViewIfNeeded();
      if (viewport.width === 1440) {
        await expectMatrixChromeAlignment(page);
      }

      const previewCells = await matrix
        .locator('[data-testid^="figma-button-preview-"]')
        .all();
      expect(previewCells).toHaveLength(16);

      const computedCells: Record<string, SvgButtonProbe> = {};
      for (const variant of variants) {
        for (const interaction of interactions) {
          const key = `${variant}-${interaction}`;
          const { previewProbe } = await expectPreviewMatchesLive(
            page,
            variant,
            interaction,
            zoom,
          );
          computedCells[key] = previewProbe;
          const preview = page.getByTestId(
            `figma-button-preview-${variant}-${interaction}`,
          );
          const beforeMove = await probeSvgButtonCell(preview);
          const previewBox = await preview.boundingBox();
          if (previewBox) {
            await page.mouse.move(
              previewBox.x + previewBox.width / 2,
              previewBox.y + previewBox.height / 2,
            );
          }
          const afterMove = await probeSvgButtonCell(preview);
          expect(afterMove).toEqual(beforeMove);
        }
      }

      await resetPointer(page);
      await page.mouse.up();

      if (viewport.width === 390) {
        const overflow = await page.evaluate(() => {
          const root = document.querySelector(
            '[data-testid="figma-button-state-matrix-scroll"]',
          );
          if (!root) return false;
          const queue: HTMLElement[] = [root as HTMLElement];
          for (const node of queue) {
            if (node.scrollWidth > node.clientWidth + 1) return true;
            queue.push(...([...node.children] as HTMLElement[]));
          }
          return false;
        });
        expect(overflow).toBe(true);

        const scroll = page.getByTestId('figma-button-state-matrix-scroll');
        await scroll.evaluate((el) => {
          (el as HTMLElement).focus();
        });
        for (let step = 0; step < 40; step += 1) {
          await page.keyboard.press('ArrowRight');
        }

        const lastPreview = page.getByTestId(
          'figma-button-preview-muted-disabled',
        );
        const beforeScroll = await lastPreview.boundingBox();
        await page.evaluate(() => {
          const root = document.querySelector(
            '[data-testid="figma-button-state-matrix-scroll"]',
          );
          if (!root) return;
          const queue: HTMLElement[] = [root as HTMLElement];
          for (const node of queue) {
            if (node.scrollWidth > node.clientWidth + 1) {
              node.scrollLeft = node.scrollWidth;
            }
            queue.push(...([...node.children] as HTMLElement[]));
          }
        });
        await lastPreview.scrollIntoViewIfNeeded();
        await expect(lastPreview).toBeInViewport();
        const afterScroll = await lastPreview.boundingBox();
        expect(afterScroll?.x ?? 0).toBeLessThan(
          beforeScroll?.x ?? Number.MAX_VALUE,
        );
        await expect(page.getByRole('img', { name: /Кнопка:/ })).toHaveCount(
          16,
        );
      }

      mkdirSync(e2eEvidenceDir, { recursive: true });
      writeFileSync(
        join(
          e2eEvidenceDir,
          `figma-button-matrix-cells-${testInfo.project.name}-${viewport.width}x${viewport.height}.json`,
        ),
        JSON.stringify(computedCells, null, 2),
      );

      if (viewport.width === 1440) {
        await matrix.screenshot({
          path: join(
            e2eEvidenceDir,
            `matrix-${viewport.width}-${testInfo.project.name}.png`,
          ),
        });
      }

      for (const variant of variants) {
        const idle = page.getByTestId(`figma-button-${variant}-idle`);
        await idle.scrollIntoViewIfNeeded();
        await expectMatrixIdle(page, variant, zoom);

        await idle.hover();
        const hoverProbe = await probeSvgButtonCell(idle);
        expectSvgMatrixPaints(variant, 'hover', hoverProbe, zoom);

        await idle.hover();
        try {
          await page.mouse.down();
          await expect
            .poll(async () =>
              interactionPaintReady(
                variant,
                'pressed',
                await probeSvgButtonCell(idle),
              ),
            )
            .toBe(true);
          const pressedProbe = await probeSvgButtonCell(idle);
          expectSvgMatrixPaints(variant, 'pressed', pressedProbe, zoom);
          const pressedMetrics = pressedProbe;
          expect(pressedMetrics.shellCssWidth).toBeCloseTo(
            hoverProbe.shellCssWidth,
            2,
          );
          expect(pressedMetrics.shellCssHeight).toBeCloseTo(
            hoverProbe.shellCssHeight,
            2,
          );
        } finally {
          await page.mouse.up();
        }

        await idle.focus();
        await page.keyboard.press('Enter');
        const focusedProbe = await probeSvgButtonCell(idle);
        expect(focusedProbe.opacity).toBe('1');

        const disabled = page.getByTestId(`figma-button-${variant}-disabled`);
        const disabledProbe = await probeSvgButtonCell(disabled);
        expectSvgMatrixPaints(variant, 'disabled', disabledProbe, zoom);
      }

      const loading = page.getByTestId('figma-button-solid-loading');
      const loadingProbe = await probeSvgButtonCell(loading);
      expect(loadingProbe.opacity).toBe(
        String(figmaButtonTokens.disabledOpacity),
      );
      await expect(loading.getByRole('progressbar')).toBeVisible();

      await expect(page.getByTestId('figma-button-solid-icon')).toBeVisible();

      const link = page.getByTestId('figma-button-outline-link');
      await expect(link).toHaveAttribute('role', 'link');
      const linkProbe = await probeSvgButtonCell(link);
      expectSvgShellAligned(linkProbe, zoom);
      expect(linkProbe.shellCssWidth).toBeGreaterThan(
        figmaButtonTokens.metrics.sampleWidth,
      );
      expect(linkProbe.gradientX2).toBeCloseTo(
        88.232 * (linkProbe.svgWidth! / figmaButtonTokens.metrics.sampleWidth),
        1,
      );

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
    const wide = await probeSvgButtonCell(solid);

    await page.setViewportSize({ width: 390, height: 400 });
    const narrow = await probeSvgButtonCell(solid);
    expect(narrow.backgroundColor).toBe(wide.backgroundColor);
    expect(narrow.opacity).toBe('1');
    expect(narrow.rects[0]?.fill).toBe(wide.rects[0]?.fill);

    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
    const zoom = await pageZoom(page);
    await solid.focus();
    const zoomed = await probeSvgButtonCell(solid);
    expect(zoomed.opacity).toBe('1');
    expectSvgShellAligned(zoomed, zoom);
    expect(zoomed.rects[0]?.fill).toBe(wide.rects[0]?.fill);
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
    const reducedProbe = await probeSvgButtonCell(reduced);
    expectSvgMatrixPaints(
      'outline',
      'hover',
      reducedProbe,
      await pageZoom(page),
    );

    const { sampleWidth, sampleHeight } = figmaButtonTokens.metrics;
    const solidGradient = await probeSvgButtonCell(
      page.getByTestId('figma-button-solid-idle'),
    );
    expect(solidGradient.gradientStops).toEqual(['#2A2A2A', '#585858']);
    expect(solidGradient.gradientX2).toBeCloseTo(
      84.791 * ((solidGradient.svgWidth ?? 0) / sampleWidth),
      1,
    );
    expect(solidGradient.gradientY2).toBeCloseTo(
      39.1182 * ((solidGradient.svgHeight ?? 0) / sampleHeight),
      1,
    );
    const wideGradient = await probeSvgButtonCell(
      page.getByTestId('figma-button-outline-link'),
    );
    expect(wideGradient.svgWidth ?? 0).toBeGreaterThan(sampleWidth);
    expect(wideGradient.gradientX2).toBeCloseTo(
      88.232 * ((wideGradient.svgWidth ?? 0) / sampleWidth),
      1,
    );

    await page.screenshot({
      path: `${e2eEvidenceDir}/figma-button-matrix-motion-${testInfo.project.name}.png`,
      fullPage: true,
    });
  });
});
