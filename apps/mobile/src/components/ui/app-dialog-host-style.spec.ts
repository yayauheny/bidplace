import { beforeAll, describe, expect, it, vi } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

const viewportGutter = designTokens.space.x5;
let appDialogHostStyle: typeof import('./app-dialog-host-style').appDialogHostStyle;
let appDialogHostFlexDirection: typeof import('./app-dialog-host-style').appDialogHostFlexDirection;

describe('app dialog host style', () => {
  beforeAll(async () => {
    ({ appDialogHostStyle, appDialogHostFlexDirection } = await import(
      './app-dialog-host-style'
    ));
  });

  it('keeps the sheet on a column axis so flex-end docks to the bottom', () => {
    const style = appDialogHostStyle({
      presentation: 'sheet',
      width: designTokens.layout.phoneWidth,
      viewportGutter,
    });

    expect(style.flexDirection).toBe('column');
    expect(style.flexDirection).not.toBe('row');
    expect(style.justifyContent).toBe('flex-end');
    expect(style.alignItems).toBe('stretch');
  });

  it('centers a dialog on the same column axis', () => {
    const style = appDialogHostStyle({
      presentation: 'dialog',
      width: 390,
      viewportGutter,
    });

    expect(style.flexDirection).toBe('column');
    expect(style.justifyContent).toBe('center');
    expect(style.alignItems).toBe('center');
  });

  it('defaults the web host to a column when RN does not pass an axis', () => {
    expect(appDialogHostFlexDirection(undefined)).toBe('column');
    expect(appDialogHostFlexDirection('column')).toBe('column');
  });
});
