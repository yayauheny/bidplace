import { describe, expect, it } from 'vitest';

import {
  creatorProfileTabs,
  creatorWorksTabLabel,
  getCreatorProfileTabAt,
  parseCreatorProfileTabParam,
} from './creator-profile-tabs';

describe('creator profile tabs', () => {
  it('exposes only works and about', () => {
    expect(creatorProfileTabs.map((tab) => tab.id)).toEqual(['works', 'about']);
    expect(creatorProfileTabs).toHaveLength(2);
  });

  it('labels the works tab with the published count', () => {
    expect(creatorWorksTabLabel(4)).toBe('Работы 4');
  });

  it('parses URL tab params and ignores archive', () => {
    expect(parseCreatorProfileTabParam('about')).toBe('about');
    expect(parseCreatorProfileTabParam('archive')).toBe('works');
    expect(parseCreatorProfileTabParam(undefined)).toBe('works');
  });

  it('wraps keyboard indexes onto the two public tabs', () => {
    expect(getCreatorProfileTabAt(1)).toBe('about');
    expect(getCreatorProfileTabAt(-1)).toBe('about');
    expect(getCreatorProfileTabAt(2)).toBe('works');
  });
});
