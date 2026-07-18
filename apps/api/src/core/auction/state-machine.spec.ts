import { describe, expect, it } from 'vitest';

import { canActivateListing, canCancelListing, canEndListing, canScheduleListing } from './state-machine';

const now = new Date('2026-07-18T12:00:00.000Z');

describe('Listing state machine', () => {
  it('allows only Draft Listings to be scheduled', () => {
    expect(canScheduleListing('DRAFT')).toBe(true);
    expect(canScheduleListing('SCHEDULED')).toBe(false);
    expect(canScheduleListing('LIVE')).toBe(false);
    expect(canScheduleListing('ENDED')).toBe(false);
    expect(canScheduleListing('CANCELLED')).toBe(false);
  });

  it('allows cancellation only before a Listing is live', () => {
    expect(canCancelListing('DRAFT')).toBe(true);
    expect(canCancelListing('SCHEDULED')).toBe(true);
    expect(canCancelListing('LIVE')).toBe(false);
    expect(canCancelListing('ENDED')).toBe(false);
  });

  it('activates and ends only at the server-time boundaries', () => {
    expect(canActivateListing('SCHEDULED', now, new Date(now.getTime() + 1), now)).toBe(true);
    expect(canActivateListing('SCHEDULED', new Date(now.getTime() + 1), new Date(now.getTime() + 2), now)).toBe(false);
    expect(canEndListing('LIVE', now, now)).toBe(true);
    expect(canEndListing('LIVE', new Date(now.getTime() + 1), now)).toBe(false);
  });
});
