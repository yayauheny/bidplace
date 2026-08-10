import { createHash } from 'node:crypto';

export function createBidderAlias(
  listingId: string,
  bidderUserId: string,
): string {
  const suffix = createHash('sha256')
    .update(`${listingId}:${bidderUserId}`)
    .digest('hex')
    .slice(0, 6);

  return `Bidder ${suffix}`;
}
