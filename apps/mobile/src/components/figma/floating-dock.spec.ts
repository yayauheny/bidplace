import { describe, expect, it } from 'vitest';

import {
  dockItemAccessibility,
  getFigmaDockItems,
  figmaDockItemIds,
  figmaDockItems,
  isFigmaDockItemSelected,
} from './floating-dock';

describe('Figma floating dock', () => {
  it('uses Home Search Add Profile and no cart', () => {
    expect(figmaDockItemIds).toEqual(['home', 'search', 'plus', 'profile']);
    expect(figmaDockItems.map((item) => item.icon)).toEqual([
      'home-01',
      'search-01',
      'plus',
      'user',
    ]);
  });

  it('keeps four dock items without a cart', () => {
    expect(figmaDockItemIds).not.toContain('cart');
    expect(figmaDockItems).toHaveLength(4);
  });

  it('selects search and profile from public routes', () => {
    expect(isFigmaDockItemSelected('home', '/')).toBe(true);
    expect(isFigmaDockItemSelected('search', '/search')).toBe(true);
    expect(isFigmaDockItemSelected('profile', '/login')).toBe(true);
    expect(isFigmaDockItemSelected('plus', '/')).toBe(false);
  });

  it('keeps route items as links and create as a button', () => {
    expect(dockItemAccessibility('home', true)).toEqual({
      role: 'link',
      accessibilityState: { selected: true },
      ariaCurrent: 'page',
    });
    expect(dockItemAccessibility('search', false)).toEqual({
      role: 'button',
      accessibilityState: { selected: false },
    });
    expect(dockItemAccessibility('plus', false)).toEqual({
      role: 'button',
      accessibilityState: {},
    });
  });
});

it('shows administrative destinations independently and leaves ordinary navigation unchanged', () => {
  expect(getFigmaDockItems({canModerate:false,canReadAnalytics:false})).toBe(figmaDockItems);
  expect(getFigmaDockItems({canModerate:true,canReadAnalytics:true}).map(item=>item.id)).toEqual(['home','search','moderation','analytics','profile']);
  expect(getFigmaDockItems({canModerate:true,canReadAnalytics:false}).map(item=>item.id)).not.toContain('analytics');
  expect(getFigmaDockItems({canModerate:false,canReadAnalytics:true}).map(item=>item.id)).not.toContain('moderation');
  expect(isFigmaDockItemSelected('moderation','/admin/products/id')).toBe(true);
  expect(isFigmaDockItemSelected('analytics','/analytics')).toBe(true);
  expect(isFigmaDockItemSelected('profile','/admin')).toBe(false);
  expect(isFigmaDockItemSelected('profile','/account')).toBe(true);
});
