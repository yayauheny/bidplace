import { describe, expect, it } from 'vitest';

import {
  CREATOR_COMPACT_SOCIAL_LIMIT,
  listPublicSocialLinks,
} from './creator-header-motion';

const profile = {
  telegramUrl: 'https://t.me/anna',
  instagramUrl: 'https://instagram.com/anna',
  websiteUrl: 'https://anna.example',
};

describe('creator header handoff helpers', () => {
  it('lists public social links in a stable order and caps compact actions', () => {
    expect(CREATOR_COMPACT_SOCIAL_LIMIT).toBe(2);
    expect(listPublicSocialLinks(profile).map((link) => link.key)).toEqual([
      'telegram',
      'instagram',
      'website',
    ]);
    expect(
      listPublicSocialLinks({ ...profile, telegramUrl: null }).map(
        (link) => link.key,
      ),
    ).toEqual(['instagram', 'website']);
    expect(
      listPublicSocialLinks({
        telegramUrl: null,
        instagramUrl: null,
        websiteUrl: null,
      }),
    ).toEqual([]);
  });
});
