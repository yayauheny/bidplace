import { beforeAll, describe, expect, it, vi } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

const viewportGutter = designTokens.space.x5;
const wideViewport = designTokens.layout.sheetFillViewportMax + 1;
let appDialogHostStyle: typeof import('./app-dialog-host-style').appDialogHostStyle;
let appDialogHostFlexDirection: typeof import('./app-dialog-host-style').appDialogHostFlexDirection;
let appDialogSheetBottomSpace: typeof import('./app-dialog-host-style').appDialogSheetBottomSpace;
let sheetWidthConstraint: typeof import('./app-dialog-host-style').sheetWidthConstraint;

describe('app dialog host style', () => {
  beforeAll(async () => {
    ({
      appDialogHostStyle,
      appDialogHostFlexDirection,
      appDialogSheetBottomSpace,
      sheetWidthConstraint,
    } = await import('./app-dialog-host-style'));
  });

  it('keeps the sheet on a column axis so flex-end docks to the bottom', () => {
    const style = appDialogHostStyle({
      presentation: 'sheet',
      viewportGutter,
      viewportWidth: wideViewport,
    });

    expect(style.flexDirection).toBe('column');
    expect(style.flexDirection).not.toBe('row');
    expect(style.justifyContent).toBe('flex-end');
    expect(style.alignItems).toBe('stretch');
    expect(style.alignSelf).toBeUndefined();
    expect(style.marginLeft).toBe('auto');
    expect(style.marginRight).toBe('auto');
    expect(style.marginHorizontal).toBeUndefined();
    expect(style.maxWidth).toBe(designTokens.layout.sheetMax);
  });

  it.each([
    [320, '100%'],
    [390, '100%'],
    [414, '100%'],
    [440, '100%'],
    [600, '100%'],
    [601, designTokens.layout.sheetMax],
    [1024, designTokens.layout.sheetMax],
  ] as const)(
    'fills the viewport width at %i and keeps the sheet column above 600',
    (viewportWidth, expected) => {
      expect(sheetWidthConstraint(viewportWidth)).toBe(expected);
      expect(
        appDialogHostStyle({
          presentation: 'sheet',
          viewportGutter,
          viewportWidth,
        }).maxWidth,
      ).toBe(expected);
    },
  );

  it('docks the media sheet to the bottom like the sheet', () => {
    const style = appDialogHostStyle({
      presentation: 'mediaSheet',
      viewportGutter,
      viewportWidth: wideViewport,
    });

    expect(style.justifyContent).toBe('flex-end');
    expect(style.alignItems).toBe('stretch');
  });

  it('centers a dialog on the same column axis', () => {
    const style = appDialogHostStyle({
      presentation: 'dialog',
      viewportGutter,
      viewportWidth: 390,
    });

    expect(style.flexDirection).toBe('column');
    expect(style.justifyContent).toBe('center');
    expect(style.alignItems).toBe('center');
  });

  it('defaults the web host to a column when RN does not pass an axis', () => {
    expect(appDialogHostFlexDirection(undefined)).toBe('column');
    expect(appDialogHostFlexDirection('column')).toBe('column');
  });

  it.each([
    [16, 0, 16],
    [16, 34, 34],
    [20, 0, 20],
    [20, 34, 34],
    [40, 0, 40],
    [40, 34, 40],
  ] as const)(
    'keeps sheet bottom space at least %i with inset %i',
    (space, inset, expected) => {
      expect(appDialogSheetBottomSpace(space, inset)).toBe(expected);
    },
  );
});
