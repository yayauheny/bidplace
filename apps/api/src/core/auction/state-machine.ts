import { type ListingStatus } from '@bidplace/contracts';
export function canScheduleListing(status: ListingStatus): boolean { return status === 'DRAFT'; }
export function canCancelListing(status: ListingStatus): boolean { return status === 'DRAFT' || status === 'SCHEDULED'; }
export function canActivateListing(status: ListingStatus, startsAt: Date, endsAt: Date, now: Date): boolean { return status === 'SCHEDULED' && startsAt <= now && endsAt > now; }
export function canEndListing(status: ListingStatus, endsAt: Date, now: Date): boolean { return status === 'LIVE' && endsAt <= now; }
