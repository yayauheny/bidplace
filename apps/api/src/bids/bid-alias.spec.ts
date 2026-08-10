import { describe, expect, it } from 'vitest';

import { createBidderAlias } from './bid-alias';

describe('createBidderAlias', () => {
  it('is stable inside one Listing without exposing the user id', () => {
    const alias = createBidderAlias('listing-a', 'user-secret-123');

    expect(createBidderAlias('listing-a', 'user-secret-123')).toBe(alias);
    expect(alias).toMatch(/^Bidder [a-f0-9]{6}$/);
    expect(alias).not.toContain('user-secret-123');
  });

  it('does not correlate the same bidder across Listings', () => {
    expect(createBidderAlias('listing-a', 'user-id')).not.toBe(
      createBidderAlias('listing-b', 'user-id'),
    );
  });
});
