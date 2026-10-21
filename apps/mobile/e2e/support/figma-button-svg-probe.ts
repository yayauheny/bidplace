import { expect, type Locator } from '@playwright/test';

import {
  figmaButtonMatrixCell,
  figmaButtonTokens,
  lightColorMap,
} from '@bidplace/design-tokens';

export type SvgRectProbe = {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
  ry: number;
  fill: string | null;
  stroke: string | null;
  strokeWidth: number | null;
};

export type SvgButtonProbe = {
  shellWidth: number;
  shellHeight: number;
  shellCssWidth: number;
  shellCssHeight: number;
  backgroundColor: string;
  opacity: string;
  svgWidth: number | null;
  svgHeight: number | null;
  svgRenderedWidth: number | null;
  svgRenderedHeight: number | null;
  rects: SvgRectProbe[];
  gradientX2: number | null;
  gradientY2: number | null;
  gradientStops: string[] | null;
  fontSize: string | null;
  fontWeight: string | null;
  letterSpacing: string | null;
  lineHeight: string | null;
  labelColor: string | null;
};

export function cssRgb(hex: string) {
  const value = hex.replace('#', '');
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgb(${red}, ${green}, ${blue})`;
}

export async function probeSvgButtonCell(
  locator: Locator,
): Promise<SvgButtonProbe> {
  return locator.evaluate((node) => {
    const element = node as HTMLElement;
    const style = getComputedStyle(element);
    const shellRect = element.getBoundingClientRect();
    const textLeaves = [...element.querySelectorAll('*')].filter(
      (el) =>
        el.childElementCount === 0 && (el.textContent?.trim().length ?? 0) > 0,
    );
    const label =
      textLeaves.find((el) => el.textContent?.includes('Кнопка')) ??
      textLeaves[0] ??
      null;
    const labelStyle = label ? getComputedStyle(label) : null;
    const svg = element.querySelector('svg');
    const paint = svg?.querySelector('linearGradient');
    const rects = svg
      ? [...svg.querySelectorAll('rect')].map((rect) => ({
          x: Number(rect.getAttribute('x')),
          y: Number(rect.getAttribute('y')),
          width: Number(rect.getAttribute('width')),
          height: Number(rect.getAttribute('height')),
          rx: Number(rect.getAttribute('rx')),
          ry: Number(rect.getAttribute('ry')),
          fill: rect.getAttribute('fill'),
          stroke: rect.getAttribute('stroke'),
          strokeWidth: rect.hasAttribute('stroke-width')
            ? Number(rect.getAttribute('stroke-width'))
            : null,
        }))
      : [];

    return {
      shellWidth: shellRect.width,
      shellHeight: shellRect.height,
      shellCssWidth: Number.parseFloat(style.width),
      shellCssHeight: Number.parseFloat(style.height),
      backgroundColor: style.backgroundColor,
      opacity: style.opacity,
      svgWidth: svg
        ? Number.parseFloat(svg.getAttribute('width') ?? '0')
        : null,
      svgHeight: svg
        ? Number.parseFloat(svg.getAttribute('height') ?? '0')
        : null,
      svgRenderedWidth: svg?.getBoundingClientRect().width ?? null,
      svgRenderedHeight: svg?.getBoundingClientRect().height ?? null,
      rects,
      gradientX2: paint ? Number(paint.getAttribute('x2')) : null,
      gradientY2: paint ? Number(paint.getAttribute('y2')) : null,
      gradientStops: paint
        ? [...paint.querySelectorAll('stop')]
            .map((stop) => stop.getAttribute('stop-color'))
            .filter((color): color is string => color != null)
        : null,
      fontSize: labelStyle?.fontSize ?? null,
      fontWeight: labelStyle?.fontWeight ?? null,
      letterSpacing: labelStyle?.letterSpacing ?? null,
      lineHeight: labelStyle?.lineHeight ?? null,
      labelColor: labelStyle?.color ?? null,
    };
  });
}

export function interactionPaintReady(
  variant: 'solid' | 'outline' | 'ghost' | 'muted',
  interaction: 'idle' | 'hover' | 'pressed' | 'disabled',
  probe: SvgButtonProbe,
) {
  const cell = figmaButtonMatrixCell(variant, interaction, lightColorMap);
  const base = probe.rects[0];
  if (!base) return false;

  if (
    cell.overlay &&
    !probe.rects.some((rect) => rect.fill?.includes('rgba'))
  ) {
    return false;
  }
  if (
    !cell.overlay &&
    probe.rects.some((rect) => rect.fill?.includes('rgba'))
  ) {
    return false;
  }

  const strokeRect = probe.rects.find((rect) => rect.stroke);
  if (cell.strokeMode === 'none' && strokeRect) return false;
  if (cell.strokeMode !== 'none' && !strokeRect) return false;

  if (cell.pressedGhostInset) {
    const { pressedGhostWidth, pressedGhostHeight } = figmaButtonTokens.metrics;
    if (
      base.width !== pressedGhostWidth ||
      base.height !== pressedGhostHeight
    ) {
      return false;
    }
    if (base.x !== 0 || base.y !== 0) return false;
  }

  if (base.fill?.toLowerCase() !== cell.fill.toLowerCase()) return false;
  return true;
}

export function expectTypography(probe: SvgButtonProbe) {
  expect(probe.fontSize).toBe(`${figmaButtonTokens.typography.fontSize}px`);
  expect(probe.fontWeight).toBe(figmaButtonTokens.typography.fontWeight);
  expect(probe.letterSpacing).toBe(
    `${figmaButtonTokens.typography.letterSpacing}px`,
  );
  expect(Number.parseFloat(probe.lineHeight ?? '0')).toBeCloseTo(
    figmaButtonTokens.typography.lineHeight,
    0,
  );
}

function paintMatchesHex(actual: string | null, hex: string) {
  expect(actual?.toLowerCase()).toBe(hex.toLowerCase());
}

export function expectSvgShellAligned(probe: SvgButtonProbe, zoom = 1) {
  expect(probe.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(probe.svgWidth).not.toBeNull();
  expect(probe.svgHeight).not.toBeNull();
  expect(
    Math.abs((probe.svgWidth ?? 0) - probe.shellCssWidth),
  ).toBeLessThanOrEqual(0.01);
  expect(
    Math.abs((probe.svgHeight ?? 0) - probe.shellCssHeight),
  ).toBeLessThanOrEqual(0.01);
  expect(
    Math.abs(probe.shellWidth - probe.shellCssWidth * zoom),
  ).toBeLessThanOrEqual(0.05);
  expect(
    Math.abs(probe.shellHeight - probe.shellCssHeight * zoom),
  ).toBeLessThanOrEqual(0.05);
  expect(
    Math.abs((probe.svgRenderedWidth ?? 0) - probe.shellWidth),
  ).toBeLessThanOrEqual(0.01);
  expect(
    Math.abs((probe.svgRenderedHeight ?? 0) - probe.shellHeight),
  ).toBeLessThanOrEqual(0.01);

  const sampleShell = 82.71875;
  if (Math.abs(probe.shellCssWidth - sampleShell) < 0.02) {
    expect(probe.svgWidth).not.toBe(83);
    expect(probe.svgWidth).toBeCloseTo(sampleShell, 2);
  }

  for (const rect of probe.rects) {
    const halfStroke = (rect.strokeWidth ?? 0) / 2;
    expect(rect.x - halfStroke).toBeGreaterThanOrEqual(-0.01);
    expect(rect.y - halfStroke).toBeGreaterThanOrEqual(-0.01);
    expect(rect.x + rect.width + halfStroke).toBeLessThanOrEqual(
      (probe.svgWidth ?? 0) + 0.01,
    );
    expect(rect.y + rect.height + halfStroke).toBeLessThanOrEqual(
      (probe.svgHeight ?? 0) + 0.01,
    );
  }
}

export function expectSharedRectGeometry(probe: SvgButtonProbe) {
  if (probe.rects.length === 0) return;
  const [first, ...rest] = probe.rects;
  for (const rect of rest) {
    expect(rect.x).toBeCloseTo(first.x, 2);
    expect(rect.y).toBeCloseTo(first.y, 2);
    expect(rect.width).toBeCloseTo(first.width, 2);
    expect(rect.height).toBeCloseTo(first.height, 2);
    expect(rect.rx).toBeCloseTo(first.rx, 2);
    expect(rect.ry).toBeCloseTo(first.ry, 2);
  }
}

export function expectSvgMatrixPaints(
  variant: 'solid' | 'outline' | 'ghost' | 'muted',
  interaction: 'idle' | 'hover' | 'pressed' | 'disabled',
  probe: SvgButtonProbe,
  zoom = 1,
) {
  const cell = figmaButtonMatrixCell(variant, interaction, lightColorMap);
  const { metrics } = figmaButtonTokens;

  expect(probe.opacity).toBe(String(cell.controlOpacity));
  expectSvgShellAligned(probe, zoom);
  expectSharedRectGeometry(probe);

  const base = probe.rects[0];
  expect(base).toBeDefined();
  paintMatchesHex(base.fill, cell.fill);

  // Independent values from nodes.json and 001-292_5058.svg, not runtime tokens.
  const sourceFill =
    variant === 'solid'
      ? interaction === 'disabled'
        ? '#949494'
        : '#121212'
      : variant === 'muted'
        ? '#F3F3F3'
        : '#FFFFFF';
  const sourceOverlay =
    interaction === 'hover' || interaction === 'pressed'
      ? variant === 'solid'
        ? 'rgba(255, 255, 255, 0.15)'
        : variant === 'muted'
          ? 'rgba(0, 0, 0, 0.06)'
          : 'rgba(0, 0, 0, 0.05)'
      : null;
  const sourceHasStroke = !(variant === 'ghost' && interaction === 'pressed');
  paintMatchesHex(base.fill, sourceFill);
  expect(probe.opacity).toBe(interaction === 'disabled' ? '0.5' : '1');
  expect(probe.rects.map((rect) => rect.fill)).toEqual([
    sourceFill,
    ...(sourceOverlay ? [sourceOverlay] : []),
    ...(sourceHasStroke ? ['none'] : []),
  ]);
  if (sourceHasStroke) {
    expect(base.x).toBe(0.25);
    expect(base.y).toBe(0.25);
    expect(base.width).toBeCloseTo((probe.svgWidth ?? 0) - 0.5, 3);
    expect(base.height).toBeCloseTo((probe.svgHeight ?? 0) - 0.5, 3);
  }

  const overlayRect = probe.rects.find(
    (rect) => rect.fill && rect.fill.includes('rgba'),
  );
  if (cell.overlay) {
    expect(overlayRect?.fill).toBe(cell.overlay);
  } else {
    expect(overlayRect).toBeUndefined();
  }

  const strokeRect = probe.rects.find((rect) => rect.stroke);
  if (cell.strokeMode === 'none') {
    expect(strokeRect).toBeUndefined();
  } else {
    expect(strokeRect).toBeDefined();
    expect(strokeRect?.strokeWidth).toBe(metrics.strokeWidth);
    if (cell.strokeMode === 'gradient') {
      expect(strokeRect?.stroke?.startsWith('url(#')).toBe(true);
      expect(probe.gradientStops).toEqual(
        variant === 'solid' ? ['#2A2A2A', '#585858'] : ['#D1D1D1', '#EBEBEB'],
      );
      expect(probe.gradientX2).toBeCloseTo(
        ((variant === 'solid' ? 84.791 : 88.232) * (probe.svgWidth ?? 0)) / 83,
        3,
      );
      expect(probe.gradientY2).toBeCloseTo(
        ((variant === 'solid' ? 39.1182 : 20.724) * (probe.svgHeight ?? 0)) /
          43,
        3,
      );
    } else {
      paintMatchesHex(strokeRect?.stroke ?? null, cell.strokeColor ?? '');
      paintMatchesHex(
        strokeRect?.stroke ?? null,
        variant === 'ghost' ? '#FFFFFF' : '#F3F3F3',
      );
    }
  }

  if (cell.pressedGhostInset) {
    expect(base.width).toBe(metrics.pressedGhostWidth);
    expect(base.height).toBe(metrics.pressedGhostHeight);
    expect(base.x).toBeCloseTo(0, 2);
    expect(base.y).toBeCloseTo(0, 2);
    expect(base.rx).toBeCloseTo(21, 1);
    expect(base.ry).toBeCloseTo(21, 1);
  }

  if (interaction === 'disabled' && variant === 'solid') {
    paintMatchesHex(base.fill, lightColorMap.solidDisabled);
    expect(probe.opacity).toBe(String(figmaButtonTokens.disabledOpacity));
  }

  if (variant === 'solid') {
    expect(probe.labelColor).toBe(cssRgb(lightColorMap.onAction));
  } else {
    expect(probe.labelColor).toBe(cssRgb(lightColorMap.textSubdued));
  }
}
