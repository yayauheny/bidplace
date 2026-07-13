import { type Auction, type Bid } from '@bidplace/contracts';

export const terminalAuctionStatuses = [
  'ended',
  'sold',
  'failed',
  'cancelled',
  'hidden',
] as const satisfies readonly Auction['status'][];

export const activatableAuctionStatuses = [
  'scheduled',
] as const satisfies readonly Auction['status'][];

export const closableAuctionStatuses = [
  'scheduled',
  'active',
] as const satisfies readonly Auction['status'][];

export function canPublishAuction(status: Auction['status']): boolean {
  return status === 'draft';
}

export function canActivateAuction(
  status: Auction['status'],
  startsAt: Date,
  endsAt: Date,
  now: Date,
): boolean {
  return status === 'scheduled' && startsAt <= now && endsAt > now;
}

export function canCloseAuction(
  status: Auction['status'],
  endsAt: Date,
  now: Date,
): boolean {
  return (
    (closableAuctionStatuses as readonly Auction['status'][]).includes(status) &&
    endsAt <= now
  );
}

export function resolvePublishedAuctionStatus(
  startsAt: Date,
  now: Date,
): Auction['status'] {
  return startsAt <= now ? 'active' : 'scheduled';
}

export const winningBidStatuses = [
  'active',
  'winning',
  'outbid',
] as const satisfies readonly Bid['status'][];

export function canMarkBidAsOutbid(status: Bid['status']): boolean {
  return (winningBidStatuses as readonly Bid['status'][]).includes(status);
}

export function isTerminalBidStatus(status: Bid['status']): boolean {
  return ['won', 'lost', 'cancelled', 'invalid'].includes(status);
}
