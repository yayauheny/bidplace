import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  isEscapeKey,
  shouldCloseOnPointerDown,
} from '../layout/dismissible-overlay';
import { filterSheetPanelStyle } from './filter-sheet-style';
import { filterTriggerStyle } from './filter-sort-bar-style';
import {
  FILTER_OPTION_CONTROL_SIZE,
  isHiddenFilterGroup,
  toggleMultiFilterValue,
  visibleFilterGroups,
} from './filter-option-row';
import { resultsCountLabel, resultsCountUsesLotCopy } from './results-count';
import { isTabKey, nextFocusIndex } from './share-sheet-focus';

describe('C4 filter masters', () => {
  it('keeps filter triggers as measured glass chips', () => {
    expect(filterTriggerStyle(false)).toMatchObject({
      minHeight: 42,
      borderRadius: 14,
      backgroundColor: figmaTokens.color.glassStrong,
      borderColor: figmaTokens.color.divider,
    });
    expect(filterTriggerStyle(true).borderColor).toBe(figmaTokens.color.ink);
  });

  it('hides price and auction groups without filtering the page', () => {
    expect(
      visibleFilterGroups([
        { id: 'category', label: 'Категория' },
        { id: 'materials', label: 'Материалы' },
        { id: 'price', label: 'Цена' },
        { id: 'auction', label: 'Торги' },
      ]).map((group) => group.id),
    ).toEqual(['category', 'materials']);
    expect(isHiddenFilterGroup('price')).toBe(true);
    expect(toggleMultiFilterValue(['холст'], 'масло')).toEqual([
      'холст',
      'масло',
    ]);
    expect(toggleMultiFilterValue(['холст', 'масло'], 'масло')).toEqual([
      'холст',
    ]);
  });

  it('labels the apply action with работ, not лот', () => {
    const label = resultsCountLabel(12);
    expect(label).toBe('Показать 12 работ');
    expect(resultsCountUsesLotCopy(label)).toBe(false);
    expect(resultsCountUsesLotCopy('Показать 12 лотов')).toBe(true);
  });

  it('keeps the sheet as a full-height 390 panel with 20px option controls', () => {
    expect(filterSheetPanelStyle()).toMatchObject({
      maxWidth: figmaTokens.size.phoneWidth,
      height: '100%',
      backgroundColor: figmaTokens.color.canvas,
    });
    expect(FILTER_OPTION_CONTROL_SIZE).toBe(20);
  });

  it('dismisses on Escape and backdrop, and wraps Tab inside the sheet', () => {
    expect(isEscapeKey({ key: 'Escape' } as KeyboardEvent)).toBe(true);
    expect(isTabKey({ key: 'Tab' })).toBe(true);
    expect(nextFocusIndex(2, 3, false)).toBe(0);
    expect(
      shouldCloseOnPointerDown({} as EventTarget, [
        { contains: () => false },
      ]),
    ).toBe(true);
    expect(
      shouldCloseOnPointerDown({} as EventTarget, [{ contains: () => true }]),
    ).toBe(false);
  });
});
