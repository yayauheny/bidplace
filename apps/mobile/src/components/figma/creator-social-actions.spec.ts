import { describe, expect, it } from 'vitest';

import {
  creatorSocialActionsVisible,
  presentCreatorSocials,
} from './creator-social-actions';

describe('creator social actions', () => {
  it('renders only present public URLs and never accepts email', () => {
    const socials = presentCreatorSocials({
      telegramUrl: ' https://t.me/vex ',
      instagramUrl: null,
      websiteUrl: '',
    });

    expect(socials).toEqual([
      {
        id: 'telegram',
        href: 'https://t.me/vex',
        label: 'Telegram автора',
      },
    ]);
    expect(socials.some((item) => item.id === 'instagram')).toBe(false);
    expect(JSON.stringify(socials)).not.toMatch(/email|vk/i);
  });

  it('keeps Instagram and website when those URLs exist', () => {
    expect(
      presentCreatorSocials({
        telegramUrl: null,
        instagramUrl: 'https://instagram.com/vex',
        websiteUrl: 'https://vex.example',
      }).map((item) => item.id),
    ).toEqual(['instagram', 'website']);
  });

  it('hides the cluster when every URL is missing and share is absent', () => {
    const links = {
      telegramUrl: null,
      instagramUrl: null,
      websiteUrl: null,
    };
    expect(creatorSocialActionsVisible(links, false)).toBe(false);
    expect(creatorSocialActionsVisible(links, true)).toBe(true);
  });
});
