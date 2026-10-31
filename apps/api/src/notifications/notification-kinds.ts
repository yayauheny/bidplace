export const NOTIFICATION_KINDS = [
  'BID_WON',
  'PURCHASED',
  'LISTING_SOLD',
  'AUCTION_ENDED',
  'AUCTION_ENDED_NO_BIDS',
  'OFFER_RECEIVED',
  'CONFIRM_DEAL_REMINDER',
  'DEAL_COMPLETED',
  'ORDER_FAILED',
  'ORDER_REPORTED',
  'LISTING_REMOVED',
  'OUTBID',
  'CONTACTS_CHANGED',
] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

const KIND_SET: ReadonlySet<string> = new Set(NOTIFICATION_KINDS);

export function isNotificationKind(kind: string): kind is NotificationKind {
  return KIND_SET.has(kind);
}
