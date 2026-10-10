import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  searchChromeScaledPaint,
  searchChromeStrokeViewport,
  searchChromeTokens,
} from '@bidplace/design-tokens';
import { describe, expect, it } from 'vitest';

import {
  searchOverlayCloseStyle,
  searchOverlayFieldChromeStyle,
  searchOverlayFieldInputStyle,
  searchOverlayFieldRowStyle,
  searchOverlayIconFrameStyle,
} from './search-overlay-header-style';

const svg = readFileSync(
  resolve(
    __dirname,
    '../../../../../design/figma-handoff/search/2026-10-10-search-popup/fallbacks/001-456_8298.svg',
  ),
  'utf8',
);

function paint(id: string) {
  const block = svg.match(
    new RegExp(
      `<linearGradient id="${id}" x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"[\\s\\S]*?<stop stop-color="([^"]+)"/>\\s*<stop offset="1" stop-color="([^"]+)"/>`,
    ),
  );
  if (!block) throw new Error(`missing ${id}`);
  return {
    x1: Number(block[1]),
    y1: Number(block[2]),
    x2: Number(block[3]),
    y2: Number(block[4]),
    start: block[5],
    end: block[6],
  };
}

describe('search overlay header style', () => {
  it('keeps the field and close on the 52px search row', () => {
    expect(searchOverlayFieldRowStyle().gap).toBe(searchChromeTokens.rowGap);
    expect(searchOverlayFieldChromeStyle()).toMatchObject({
      height: 52,
      padding: 8,
      gap: 8,
    });
    expect(searchOverlayIconFrameStyle()).toMatchObject({ width: 36, height: 36 });
    expect(searchOverlayCloseStyle()).toMatchObject({ width: 52, height: 52 });
    expect(searchOverlayFieldInputStyle()).toMatchObject({
      fontSize: 16,
      lineHeight: 19,
      letterSpacing: -0.16,
      color: '#121212',
    });
    expect(searchOverlayFieldChromeStyle()).not.toHaveProperty('borderColor');
  });

  it('matches the SVG gradient axes and stroke paths of 456:8298', () => {
    const fieldPaint = paint('paint5_linear_456_8298');
    const closePaint = paint('paint6_linear_456_8298');
    const railPaint = paint('paint7_linear_456_8298');
    const field = searchChromeScaledPaint('field', 302, 52);
    const close = searchChromeScaledPaint('close', 52, 52);
    const rail = searchChromeScaledPaint('rail', 364, 50);

    expect(field.axis).toMatchObject({
      x2: fieldPaint.x2 - fieldPaint.x1,
      y2: fieldPaint.y2 - fieldPaint.y1,
      start: '#D1D1D1',
      end: '#EBEBEB',
    });
    expect(field).toMatchObject({ x: -0.25, y: -0.25, width: 302.5, height: 52.5, rx: 26.25 });
    expect(close.axis.x2).toBeCloseTo(closePaint.x2 - closePaint.x1, 3);
    expect(close.axis.y2).toBeCloseTo(closePaint.y2 - closePaint.y1, 3);
    expect(close).toMatchObject({ x: -0.25, width: 52.5, height: 52.5, rx: 26.25 });
    expect(rail.axis.x2).toBeCloseTo(railPaint.x2 - railPaint.x1, 3);
    expect(rail.axis.y2).toBeCloseTo(railPaint.y2 - railPaint.y1, 3);
    expect(rail).toMatchObject({ x: 0.25, y: 0.25, width: 363.5, height: 49.5, rx: 24.75 });
    expect(searchChromeTokens.tab).toMatchObject({
      height: 41,
      selectedFill: '#F3F3F3',
      stroke: '#FFFFFF',
    });
    expect(searchChromeTokens.tab.typography).toMatchObject({
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
    });
    expect(searchChromeTokens.blur).toEqual({ figmaRadius: 12, cssPx: 6 });
  });

  it('keeps the outer half of the stroke inside the SVG viewport', () => {
    const half = searchChromeTokens.strokeWidth / 2;
    for (const sample of [
      ['field', 302, 52],
      ['close', 52, 52],
      ['rail', 364, 50],
      ['field', 109.578, 52],
    ] as const) {
      const frame = searchChromeStrokeViewport(sample[0], sample[1], sample[2]);
      expect(frame.path.x - half).toBeGreaterThanOrEqual(-1e-9);
      expect(frame.path.y - half).toBeGreaterThanOrEqual(-1e-9);
      expect(frame.path.x + frame.path.width + half).toBeLessThanOrEqual(frame.width + 1e-9);
      expect(frame.path.y + frame.path.height + half).toBeLessThanOrEqual(frame.height + 1e-9);
    }
    const fractional = searchChromeStrokeViewport('field', 109.578, 52);
    expect(fractional.width).not.toBe(110);
    expect(fractional.width).toBeGreaterThan(109.578);
    const field = searchChromeStrokeViewport('field', 302, 52);
    expect(field.left).toBeCloseTo(-0.5, 5);
    expect(field.width).toBeCloseTo(303, 5);
    expect(field.height).toBeCloseTo(53, 5);
    expect(field.path.x).toBeCloseTo(0.25, 5);
    expect(field.axis.x2 - field.axis.x1).toBeCloseTo(225.915, 3);
  });
});
