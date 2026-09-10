import { describe, expect, it } from 'vitest';

import {
  curatorFeatureContent,
  curatorRailItemCount,
  CURATOR_EDITORIAL_WIDTH,
  CURATOR_FEATURE_CTA,
  CURATOR_FEATURE_LABEL,
  CURATOR_FEATURE_TITLE,
} from './curator-feature';

const selection = {
  work: {
    publicId: 'abcdefghijk',
    title: 'Внутренние миры',
    images: [{ url: '/api/works/abcdefghijk/images/1' }],
  },
  author: {
    slug: 'vex',
    fullName: 'Vex',
    profilePhotoUrl: '/api/sellers/vex/photo',
    shortDescription: 'Ищу логику в абсурде.',
  },
};

describe('curator feature', () => {
  it('maps one server selection onto editorial chrome and a single work card', () => {
    const content = curatorFeatureContent(selection);

    expect(content.sectionTitle).toBe(CURATOR_FEATURE_TITLE);
    expect(content.curatorLabel).toBe(CURATOR_FEATURE_LABEL);
    expect(content.ctaLabel).toBe(CURATOR_FEATURE_CTA);
    expect(content.handle).toBe('@vex');
    expect(content.workTitle).toBe('Внутренние миры');
    expect(content.workHref).toBe('/product/abcdefghijk');
    expect(content.profileHref).toBe('/seller/vex');
    expect(content.quote).toBe('Ищу логику в абсурде.');
    expect(curatorRailItemCount(selection)).toBe(1);
    expect(CURATOR_EDITORIAL_WIDTH).toBe(280);
  });

  it('does not invent extra rail items or placeholder copy', () => {
    const content = curatorFeatureContent({
      ...selection,
      author: { ...selection.author, shortDescription: '  ' },
    });

    expect(content.quote).toBeNull();
    expect(content.workTitle).not.toMatch(/безупречная техника/i);
    expect(curatorRailItemCount(selection)).not.toBeGreaterThan(1);
  });
});
