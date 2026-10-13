import { describe, expect, it } from 'vitest';

import { listPublicSocialLinks } from './creator-social-links';

const profile = {
  telegramUrl: 'https://t.me/anna',
  instagramUrl: 'https://instagram.com/anna',
  websiteUrl: 'https://anna.example',
};

describe('public creator social links', () => {
  it('lists all available public links in a stable order', () => {
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
